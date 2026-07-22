import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/models/story.dart';
import '../core/providers/app_state.dart';
import '../core/providers/auth_state.dart';
import '../core/services/analytics_service.dart';
import '../core/services/api_service.dart';
import '../core/services/offline_cache.dart';
import '../core/services/launch_offer_service.dart';
import '../core/services/reading_progress_service.dart';
import '../core/services/share_service.dart';
import '../core/config/paywall_copy.dart';
import '../core/services/razorpay_checkout.dart';
import '../core/services/subscription_service.dart';
import '../core/theme/katha_theme.dart';
import '../widgets/chapter_body.dart';
import '../widgets/error_state.dart';
import 'reader_auth_screen.dart';

class ReaderScreen extends StatefulWidget {
  final String storyId;
  final String storyTitle;
  final int chapterNumber;

  const ReaderScreen({
    super.key,
    required this.storyId,
    required this.storyTitle,
    required this.chapterNumber,
  });

  @override
  State<ReaderScreen> createState() => _ReaderScreenState();
}

class _ReaderScreenState extends State<ReaderScreen> {
  final _scrollController = ScrollController();
  final _cache = OfflineCache.instance;
  final _progress = ReadingProgressService.instance;
  bool _isOfflineChapter = false;
  bool _scrollRestored = false;
  double _scrollProgress = 0;
  int _lastSavedPct = -1;
  Chapter? _chapter;
  bool _loading = true;
  String? _error;
  ApiException? _apiError;
  bool _streakPinged = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _loadChapter();
  }

  ApiService _api(BuildContext context) =>
      ApiService.fromAuth(context.read<AuthState>());

  Future<void> _loadChapter() async {
    final api = _api(context);

    // === SNAP UX: Try cache first for instant render ===
    final cached = _cache.getCachedChapter(
      widget.storyId,
      widget.chapterNumber,
    );
    if (cached != null) {
      if (mounted) {
        setState(() {
          _chapter = cached;
          _loading = false;
          _isOfflineChapter = true;
          _error = null;
          _apiError = null;
          _scrollRestored = false;
        });
        context.read<AppState>().setContinueReading(
          storyId: widget.storyId,
          title: widget.storyTitle,
          chapter: widget.chapterNumber,
        );
        _restoreScrollPosition();
      }
      AnalyticsService.instance.chapterOpened(
        widget.storyId,
        widget.chapterNumber,
      );

      // Background refresh + prefetch (never blocks UI)
      _cache.getChapterSmart(
        storyId: widget.storyId,
        chapterNumber: widget.chapterNumber,
        api: api,
        onUpdated: (updated) {
          if (mounted && updated.id != _chapter?.id) {
            setState(() {
              _chapter = updated;
              _isOfflineChapter = false;
            });
          }
        },
      );

      // Prefetch next chapters aggressively (seamless next-chapter)
      _cache.prefetchNextChapters(
        storyId: widget.storyId,
        currentChapter: widget.chapterNumber,
        api: api,
      );
      return;
    }

    // No cache: normal path (first time or invalidated)
    setState(() {
      _loading = true;
      _error = null;
      _apiError = null;
    });

    try {
      final chapter = await api.fetchChapter(
        widget.storyId,
        widget.chapterNumber,
      );
      await _cache.cacheChapter(chapter);

      if (mounted) {
        setState(() {
          _chapter = chapter;
          _loading = false;
          _isOfflineChapter = false;
          _scrollRestored = false;
        });
        context.read<AppState>().setContinueReading(
          storyId: widget.storyId,
          title: widget.storyTitle,
          chapter: widget.chapterNumber,
        );
        _restoreScrollPosition();
      }

      AnalyticsService.instance.chapterOpened(
        widget.storyId,
        widget.chapterNumber,
      );

      // Prefetch forward for seamless experience
      _cache.prefetchNextChapters(
        storyId: widget.storyId,
        currentChapter: widget.chapterNumber,
        api: api,
      );
    } on ApiException catch (e) {
      if (mounted) {
        setState(() {
          _apiError = e;
          _loading = false;
        });
        if (e.code == 'OTP_REQUIRED') {
          AnalyticsService.instance.otpGateShown(widget.storyId);
          _showOtpGate();
        } else if (e.code == 'PAYWALL_REQUIRED') {
          AnalyticsService.instance.paywallShown(widget.storyId);
          _showPaywall();
        }
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _error = 'No connection';
          _loading = false;
        });
      }
    }
  }

  Future<void> _restoreScrollPosition() async {
    if (_scrollRestored) return;
    final saved = await _progress.getScrollPct(
      widget.storyId,
      widget.chapterNumber,
    );
    if (saved == null || saved <= 2) {
      _scrollRestored = true;
      return;
    }
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      final max = _scrollController.position.maxScrollExtent;
      if (max <= 0) return;
      final offset = max * (saved / 100);
      _scrollController.jumpTo(offset.clamp(0.0, max));
      setState(() {
        _scrollProgress = offset / max;
        _scrollRestored = true;
      });
    });
  }

  // Throttled scroll handler - prevents excessive setState + network during fast scroll
  DateTime _lastScrollSave = DateTime.now();
  static const _scrollSaveInterval = Duration(milliseconds: 800);

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    final max = _scrollController.position.maxScrollExtent;
    if (max <= 0) return;

    final offset = _scrollController.offset;
    final pct = (offset / max * 100).round();

    // Update progress bar only when it meaningfully changes (cheap)
    if ((offset / max - _scrollProgress).abs() > 0.01) {
      setState(() => _scrollProgress = offset / max);
    }

    // Debounced + coarser save for network + disk (huge perf win)
    final now = DateTime.now();
    if (_chapter != null &&
        (pct != _lastSavedPct) &&
        (pct % 10 == 0 ||
            now.difference(_lastScrollSave) > _scrollSaveInterval) &&
        pct > (_lastSavedPct + 3)) {
      _lastSavedPct = pct;
      _lastScrollSave = now;

      _progress.saveScrollPct(widget.storyId, widget.chapterNumber, pct);

      final contentLen = _chapter!.content.length;
      final approxOffset = ((pct / 100.0) * contentLen).round();

      // Fire and forget - do not await in scroll path
      _api(context).saveProgress(
        storyId: widget.storyId,
        chapterId: _chapter!.id,
        scrollPct: pct,
        charOffset: approxOffset,
      );

      if (pct >= 95) {
        AnalyticsService.instance.chapterCompleted(
          widget.storyId,
          widget.chapterNumber,
        );
      }

      // Hooked Model: Reward trigger for Reading Streaks
      if (pct >= 30 && !_streakPinged) {
        _streakPinged = true;
        _api(context).pingStreak().then((streakData) {
          if (!mounted || streakData == null) return;
          if (streakData['milestone_unlocked'] == true) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Row(
                  children: [
                    const Icon(
                      Icons.local_fire_department,
                      color: Colors.orange,
                      size: 28,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Streak Unlocked!',
                            style: Theme.of(context).textTheme.titleLarge
                                ?.copyWith(color: Colors.white, fontSize: 16),
                          ),
                          Text(
                            streakData['message'] ??
                                'Keep reading to maintain your streak.',
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                backgroundColor: KathaColors.inkSoft,
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                duration: const Duration(seconds: 4),
              ),
            );
          }
        });
      }
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    // Reading canvas tone is a per-reader choice, independent of app chrome
    // brightness — see AppState.readingTone. The app-bar icon below cycles it
    // directly since that's the control readers actually expect a "mode
    // button" to drive, rather than the app-wide theme setting in Settings.
    final tone = appState.readingTone;
    final ink = KathaTheme.readingInk(tone);
    final muted = KathaTheme.readingMuted(tone);

    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.storyTitle)),
        body: const Center(
          child: CircularProgressIndicator(color: KathaColors.gold),
        ),
      );
    }

    if (_error != null) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.storyTitle)),
        body: ErrorState(
          message: _error!,
          offlineChapters: _cache.getCachedChapterNumbers(widget.storyId),
          onRetry: _loadChapter,
        ),
      );
    }

    if (_apiError != null && _chapter == null) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.storyTitle)),
        body: Center(
          child: Text(
            _apiError!.userMessage,
            style: Theme.of(context).textTheme.titleLarge,
          ),
        ),
      );
    }

    final chapter = _chapter!;

    return Scaffold(
      backgroundColor: KathaTheme.readingBackground(tone),
      body: Stack(
        children: [
          CustomScrollView(
            controller: _scrollController,
            slivers: [
              SliverAppBar(
                pinned: true,
                expandedHeight: 120,
                backgroundColor: KathaTheme.readingBackground(tone),
                leading: IconButton(
                  icon: Icon(Icons.arrow_back, color: ink),
                  onPressed: () => Navigator.pop(context),
                ),
                actions: [
                  IconButton(
                    icon: Icon(Icons.share_outlined, color: ink),
                    onPressed: () => ShareService.shareChapter(
                      storyId: widget.storyId,
                      storyTitle: widget.storyTitle,
                      chapterNumber: widget.chapterNumber,
                      chapterTitle: chapter.title,
                    ),
                    tooltip: 'Share this chapter',
                  ),
                  IconButton(
                    icon: Icon(Icons.rate_review_outlined, color: ink),
                    onPressed: _showFeedbackSheet,
                    tooltip: 'Send feedback to the author',
                  ),
                  IconButton(
                    icon: Icon(Icons.text_fields, color: ink),
                    onPressed: _showReadingOptions,
                    tooltip: 'Reading options (tone, size, spacing, alignment)',
                  ),
                  IconButton(
                    icon: Icon(
                      appState.fontScale >= 5
                          ? Icons.text_decrease
                          : Icons.text_increase,
                      color: ink,
                    ),
                    onPressed: () => appState.setFontScale(
                      appState.fontScale >= 5 ? 1 : appState.fontScale + 1,
                    ),
                    tooltip: 'Quick font size',
                  ),
                  IconButton(
                    icon: Icon(_toneIcon(tone), color: ink),
                    onPressed: () => appState.setReadingTone(_nextTone(tone)),
                    tooltip:
                        'Reading tone: ${KathaTheme.readingToneLabel(tone)} (tap to cycle)',
                  ),
                ],
                flexibleSpace: FlexibleSpaceBar(
                  titlePadding: const EdgeInsets.only(left: 56, bottom: 16),
                  title: Text(
                    widget.storyTitle,
                    style: TextStyle(fontSize: 16, color: ink),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 8, 24, 100),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Chapter ${chapter.chapterNumber}',
                        style: Theme.of(context).textTheme.labelMedium
                            ?.copyWith(
                              color: KathaColors.gold,
                              letterSpacing: 1.2,
                            ),
                      ),
                      if (chapter.title != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          chapter.title!,
                          style: Theme.of(
                            context,
                          ).textTheme.headlineMedium?.copyWith(color: ink),
                        ),
                      ],
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(
                            Icons.verified_outlined,
                            size: 14,
                            color: KathaColors.gold.withValues(alpha: 0.7),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '${chapter.viewCount} readers · ${chapter.estimatedReadTimeMinutes} min read',
                            style: Theme.of(
                              context,
                            ).textTheme.labelMedium?.copyWith(color: muted),
                          ),
                        ],
                      ),
                      if (_isOfflineChapter)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Row(
                            children: [
                              Icon(
                                Icons.offline_pin,
                                size: 16,
                                color: KathaColors.gold.withValues(alpha: 0.8),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                'Cached — ready to read offline',
                                style: Theme.of(context).textTheme.labelMedium
                                    ?.copyWith(color: KathaColors.goldDark),
                              ),
                            ],
                          ),
                        ),
                      const SizedBox(height: 32),
                      // HTML or plain — never raw-string Text (would leak <p>/<span>/<hr>).
                      RepaintBoundary(
                        child: ChapterBody(
                          content: chapter.content,
                          tone: tone,
                          fontScale: appState.fontScale,
                          lineHeight: appState.effectiveLineHeight,
                          textAlign: appState.isLeftAlign
                              ? TextAlign.left
                              : TextAlign.justify,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: LinearProgressIndicator(
              value: _scrollProgress,
              backgroundColor: Colors.transparent,
              color: KathaColors.gold,
              minHeight: 2,
            ),
          ),
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: _ChapterNavBar(
              currentChapter: widget.chapterNumber,
              tone: tone,
              onPrevious: widget.chapterNumber > 1
                  ? () => _navigateChapter(widget.chapterNumber - 1)
                  : null,
              onNext: () => _navigateChapter(widget.chapterNumber + 1),
            ),
          ),
        ],
      ),
    );
  }

  void _navigateChapter(int chapter) {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (_) => ReaderScreen(
          storyId: widget.storyId,
          storyTitle: widget.storyTitle,
          chapterNumber: chapter,
        ),
      ),
    );
  }

  static ReadingTone _nextTone(ReadingTone current) => switch (current) {
    ReadingTone.paper => ReadingTone.sepia,
    ReadingTone.sepia => ReadingTone.night,
    ReadingTone.night => ReadingTone.paper,
  };

  static IconData _toneIcon(ReadingTone tone) => switch (tone) {
    ReadingTone.paper => Icons.article_outlined,
    ReadingTone.sepia => Icons.menu_book_outlined,
    ReadingTone.night => Icons.dark_mode_outlined,
  };

  void _showOtpGate() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetCtx) => _GateSheet(
        title: 'Sign in to continue',
        subtitle: 'Chapter 4 and beyond require a free account',
        actionLabel: 'Continue with Google',
        onAction: () async {
          Navigator.pop(sheetCtx);
          final ok = await Navigator.push<bool>(
            context,
            MaterialPageRoute(builder: (_) => const ReaderAuthScreen()),
          );
          if (!mounted) return;
          if (ok == true || context.read<AuthState>().isLoggedIn) {
            _loadChapter();
          }
        },
      ),
    );
  }

  void _showPaywall() {
    final offer = LaunchOfferService.instance.config;
    final auth = context.read<AuthState>();
    final trialEnded =
        auth.user?.trialEndsAt != null &&
        !(auth.user?.isOnLaunchTrial ?? false);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetCtx) => _GateSheet(
        title: trialEnded
            ? 'Your launch trial has ended'
            : 'Unlock unlimited reading',
        subtitle: PaywallCopy.subtitle(
          hasLaunchTrial: offer.hasLaunchTrial && !trialEnded,
          trialDays: offer.trialDays,
        ),
        actionLabel: 'Subscribe · ${PaywallCopy.priceMonthlyLabel}',
        isPremium: true,
        loading: false,
        onAction: () async {
          Navigator.pop(sheetCtx);
          await _handleSubscribe();
        },
      ),
    );
  }

  void _showFeedbackSheet() {
    final controller = TextEditingController();
    var submitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 20,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
        ),
        child: StatefulBuilder(
          builder: (ctx, setSheetState) => Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Feedback for the author',
                style: Theme.of(ctx).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Text(
                'Chapter ${widget.chapterNumber} · ${widget.storyTitle}',
                style: Theme.of(ctx).textTheme.labelMedium,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: controller,
                maxLines: 4,
                maxLength: 500,
                decoration: const InputDecoration(
                  hintText: 'What did you think of this chapter?',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: submitting
                      ? null
                      : () async {
                          final text = controller.text.trim();
                          if (text.length < 3) {
                            ScaffoldMessenger.of(ctx).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'Please write at least a few words.',
                                ),
                              ),
                            );
                            return;
                          }
                          setSheetState(() => submitting = true);
                          try {
                            await _api(context).submitReaderFeedback(
                              storyId: widget.storyId,
                              chapterNumber: widget.chapterNumber,
                              body: text,
                            );
                            if (!ctx.mounted) return;
                            Navigator.pop(ctx);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'Thank you — your feedback was sent to the author.',
                                ),
                              ),
                            );
                          } on ApiException catch (e) {
                            setSheetState(() => submitting = false);
                            if (!ctx.mounted) return;
                            ScaffoldMessenger.of(ctx).showSnackBar(
                              SnackBar(content: Text(e.userMessage)),
                            );
                          } catch (_) {
                            setSheetState(() => submitting = false);
                            if (!ctx.mounted) return;
                            ScaffoldMessenger.of(ctx).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'Could not send feedback. Try again.',
                                ),
                              ),
                            );
                          }
                        },
                  child: submitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Send feedback'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showReadingOptions() {
    showModalBottomSheet(
      context: context,
      // Consumer (not a captured `appState` local) so every segmented control
      // below actually re-highlights on tap instead of only affecting the
      // reader screen behind the sheet.
      builder: (ctx) => Consumer<AppState>(
        builder: (context, appState, _) => Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Reading comfort',
                style: Theme.of(ctx).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              const Text(
                'Reading tone',
                style: TextStyle(fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 8),
              SegmentedButton<ReadingTone>(
                segments: [
                  for (final t in ReadingTone.values)
                    ButtonSegment(
                      value: t,
                      label: Text(KathaTheme.readingToneLabel(t)),
                      icon: Icon(switch (t) {
                        ReadingTone.paper => Icons.article_outlined,
                        ReadingTone.sepia => Icons.menu_book_outlined,
                        ReadingTone.night => Icons.dark_mode_outlined,
                      }, size: 16),
                    ),
                ],
                selected: {appState.readingTone},
                onSelectionChanged: (s) => appState.setReadingTone(s.first),
              ),
              const SizedBox(height: 16),
              const Text(
                'Font size',
                style: TextStyle(fontWeight: FontWeight.w500),
              ),
              SegmentedButton<int>(
                segments: const [
                  ButtonSegment(value: 1, label: Text('S')),
                  ButtonSegment(value: 2, label: Text('M')),
                  ButtonSegment(value: 3, label: Text('L')),
                  ButtonSegment(value: 4, label: Text('XL')),
                  ButtonSegment(value: 5, label: Text('XXL')),
                ],
                selected: {appState.fontScale},
                onSelectionChanged: (s) => appState.setFontScale(s.first),
              ),
              const SizedBox(height: 16),
              const Text(
                'Line spacing',
                style: TextStyle(fontWeight: FontWeight.w500),
              ),
              SegmentedButton<int>(
                segments: const [
                  ButtonSegment(value: 1, label: Text('Compact')),
                  ButtonSegment(value: 2, label: Text('Comfort')),
                  ButtonSegment(value: 3, label: Text('Spacious')),
                ],
                selected: {appState.lineHeightScale},
                onSelectionChanged: (s) => appState.setLineHeightScale(s.first),
              ),
              const SizedBox(height: 16),
              const Text(
                'Alignment',
                style: TextStyle(fontWeight: FontWeight.w500),
              ),
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(
                    value: 'left',
                    label: Text('Left (recommended)'),
                  ),
                  ButtonSegment(value: 'justify', label: Text('Justified')),
                ],
                selected: {appState.textAlign},
                onSelectionChanged: (s) => appState.setTextAlign(s.first),
              ),
              const SizedBox(height: 12),
              const Text(
                'Changes apply instantly. Left + generous spacing recommended for Telugu long-form reading.',
                style: TextStyle(fontSize: 12, color: Colors.black54),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _handleSubscribe() async {
    final auth = context.read<AuthState>();
    if (!auth.isLoggedIn) {
      await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) =>
              ReaderAuthScreen(onSuccess: () => Navigator.pop(context)),
        ),
      );
      if (!mounted) return;
      if (!context.read<AuthState>().isLoggedIn) return;
    }

    final liveAuth = context.read<AuthState>();
    final sub = SubscriptionService(
      userId: liveAuth.user!.id,
      subscriptionStatus: liveAuth.user!.subscriptionStatus,
      accessToken: liveAuth.token,
    );

    final checkoutUi = KathaRazorpayCheckout();
    try {
      final checkout = await sub.createCheckout(storyId: widget.storyId);

      if (!checkout.canOpenNativeCheckout) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              checkout.orderError ??
                  'Payments are being configured (${checkout.mode}). '
                      '${PaywallCopy.shareTransparency}. Try again soon.',
            ),
            backgroundColor: KathaColors.ember,
          ),
        );
        return;
      }

      final payment = await checkoutUi.open(
        checkout: checkout,
        email: liveAuth.user?.email,
        contact: liveAuth.user?.phone,
        name: liveAuth.user?.displayName,
      );

      if (!payment.success) {
        if (!mounted) return;
        final msg = payment.errorMessage ?? 'Payment cancelled';
        if (!msg.toLowerCase().contains('cancel')) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text(msg)));
        }
        return;
      }

      final confirmed = await sub.confirmSubscription(
        storyId: widget.storyId,
        creatorId: checkout.notes?['creator_id_source'] as String?,
        razorpayPaymentId: payment.paymentId,
        razorpayOrderId: payment.orderId ?? checkout.orderId,
        razorpaySignature: payment.signature,
      );
      final status = confirmed['subscription_status'] as String? ?? 'free';

      if (status == 'active') {
        await liveAuth.setSubscriptionStatus(status);
        AnalyticsService.instance.subscriptionConfirmed();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Welcome to Katha Unlimited · ${checkout.shareLabel}',
              ),
              backgroundColor: KathaColors.gold,
            ),
          );
          _loadChapter();
        }
        return;
      }

      if (status == 'pending_webhook' && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Payment received — activating your subscription. Open this chapter again in a moment.',
            ),
          ),
        );
        return;
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Payment recorded ($status). If chapters stay locked, wait a moment and retry.',
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    } finally {
      checkoutUi.dispose();
    }
  }
}

class _ChapterNavBar extends StatelessWidget {
  final int currentChapter;
  final ReadingTone tone;
  final VoidCallback? onPrevious;
  final VoidCallback onNext;

  const _ChapterNavBar({
    required this.currentChapter,
    required this.tone,
    this.onPrevious,
    required this.onNext,
  });

  @override
  Widget build(BuildContext context) {
    final ink = KathaTheme.readingInk(tone);
    return Container(
      padding: EdgeInsets.fromLTRB(
        16,
        12,
        16,
        MediaQuery.of(context).padding.bottom + 12,
      ),
      decoration: BoxDecoration(
        color: KathaTheme.readingSurface(tone),
        border: Border(top: BorderSide(color: ink.withValues(alpha: 0.08))),
      ),
      child: Row(
        children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: onPrevious,
              icon: Icon(Icons.arrow_back, size: 18, color: ink),
              label: Text('Previous', style: TextStyle(color: ink)),
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: ink.withValues(alpha: 0.3)),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Text(
            'Ch $currentChapter',
            style: Theme.of(
              context,
            ).textTheme.labelMedium?.copyWith(color: ink),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: FilledButton.icon(
              onPressed: onNext,
              icon: const Icon(Icons.arrow_forward, size: 18),
              label: const Text('Next'),
              style: FilledButton.styleFrom(
                backgroundColor: KathaColors.gold,
                foregroundColor: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _GateSheet extends StatelessWidget {
  final String title;
  final String subtitle;
  final String actionLabel;
  final VoidCallback onAction;
  final bool isPremium;
  final bool loading;

  const _GateSheet({
    required this.title,
    required this.subtitle,
    required this.actionLabel,
    required this.onAction,
    this.isPremium = false,
    this.loading = false,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: isDark ? KathaColors.darkElevated : Colors.white,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isPremium ? Icons.auto_stories : Icons.phone_android,
            size: 48,
            color: KathaColors.gold,
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: Theme.of(context).textTheme.headlineMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: Theme.of(context).textTheme.bodyMedium,
            textAlign: TextAlign.center,
          ),
          if (isPremium) ...[
            const SizedBox(height: 16),
            // Value-first benefits + Story Trust ladder honesty (DEC-006)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF222228)
                    : const Color(0xFFF8F5F0),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: KathaColors.gold.withValues(alpha: 0.25),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'What you get',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                  const SizedBox(height: 8),
                  ...PaywallCopy.benefits.map(
                    (b) => Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Text(
                        '• $b',
                        style: const TextStyle(fontSize: 12, height: 1.35),
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '• ${PaywallCopy.shareBullet}',
                    style: const TextStyle(
                      fontSize: 12,
                      height: 1.35,
                      color: Color(0xFF6B2338),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: onAction,
              style: FilledButton.styleFrom(
                backgroundColor: KathaColors.gold,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: Text(actionLabel),
            ),
          ),
          if (isPremium)
            const Padding(
              padding: EdgeInsets.only(top: 10),
              child: Text(
                PaywallCopy.trustLine,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 11, color: Colors.black45),
              ),
            ),
        ],
      ),
    );
  }
}
