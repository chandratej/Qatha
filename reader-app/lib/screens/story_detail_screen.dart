import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../core/models/story_detail.dart';
import '../core/providers/auth_state.dart';
import '../core/services/api_service.dart';
import '../core/services/launch_offer_service.dart';
import '../core/services/offline_cache.dart';
import '../core/theme/katha_theme.dart';
import '../widgets/error_state.dart';
import '../l10n/generated/app_localizations.dart';
import 'reader_screen.dart';
import '../core/utils/motion.dart';

class StoryDetailScreen extends StatefulWidget {
  final String storyId;

  const StoryDetailScreen({super.key, required this.storyId});

  @override
  State<StoryDetailScreen> createState() => _StoryDetailScreenState();
}

class _StoryDetailScreenState extends State<StoryDetailScreen> {
  StoryDetail? _detail;
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _praise = const [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final auth = context.read<AuthState>();
      final api = ApiService.fromAuth(auth);
      final detail = await api.fetchStoryDetail(widget.storyId);
      if (mounted) {
        setState(() {
          _detail = detail;
          _loading = false;
        });
      }

      // Predictive prefetch first 3 chapters for instant reading experience
      OfflineCache.instance.prefetchNextChapters(
        storyId: widget.storyId,
        currentChapter: 1,
        api: api,
        count: 3,
      );

      // Author-curated public testimonials — never blocks the main load (§3.2).
      api.fetchPublicPraise(widget.storyId).then((praise) {
        if (mounted) setState(() => _praise = praise);
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _error = AppLocalizations.of(context)!.storyDetailLoadError;
          _loading = false;
        });
      }
    }
  }

  String _releaseLabel() {
    final l10n = AppLocalizations.of(context)!;
    final s = _detail!.story;
    switch (s.genre) {
      case 'romance':
        return l10n.storyDetailReleaseRomanceSchedule;
      default:
        return l10n.storyDetailReleaseWeekly;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(
          child: CircularProgressIndicator(color: KathaColors.gold),
        ),
      );
    }

    if (_error != null || _detail == null) {
      return Scaffold(
        appBar: AppBar(),
        body: ErrorState(
          message: _error ?? AppLocalizations.of(context)!.storyDetailNotFound,
          onRetry: _load,
        ),
      );
    }

    final story = _detail!.story;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 280,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(story.title, style: const TextStyle(fontSize: 16)),
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: isDark
                        ? [KathaColors.darkElevated, KathaColors.darkBg]
                        : [
                            KathaColors.goldLight.withValues(alpha: 0.4),
                            KathaColors.paper,
                          ],
                  ),
                ),
                child: Center(
                  child: Text(
                    'కథ',
                    style: TextStyle(
                      fontSize: 64,
                      color: KathaColors.gold.withValues(alpha: 0.3),
                    ),
                  ),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    story.authorName,
                    style: Theme.of(context).textTheme.labelMedium,
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _InfoChip(
                        icon: Icons.category_outlined,
                        label: story.genreLabel,
                      ),
                      _InfoChip(
                        icon: Icons.people_outline,
                        label: story.readersLabel,
                      ),
                      // Content maturity signal (§2.4) — visible trust signal, not a
                      // hard age-gate; only shown when it deviates from "General".
                      if (story.isMatureThemed)
                        _InfoChip(
                          icon: Icons.info_outline,
                          label: l10n.maturityMature,
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isDark ? KathaColors.darkSurface : Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: KathaColors.gold.withValues(alpha: 0.2),
                      ),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.schedule,
                          color: KathaColors.gold,
                          size: 20,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                l10n.storyDetailNextChapterLabel,
                                style: Theme.of(context).textTheme.labelMedium,
                              ),
                              Text(
                                _releaseLabel(),
                                style: Theme.of(context).textTheme.bodyMedium,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ).withEntrance(context, (w) => w.animate().fadeIn(delay: 100.ms)),
                  if (story.description != null) ...[
                    const SizedBox(height: 20),
                    Text(
                      story.description!,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                  if (_praise.isNotEmpty) ...[
                    const SizedBox(height: 28),
                    Text(
                      l10n.storyDetailWhatReadersSay,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 12),
                    // Individual, author-curated testimonials — never an aggregate
                    // score (§3.2). Capped so this never reads as a review wall.
                    ..._praise.take(5).map(
                          (p) => Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: isDark
                                    ? KathaColors.darkSurface
                                    : Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: KathaColors.gold.withValues(alpha: 0.15),
                                ),
                              ),
                              child: Text(
                                '“${p['body'] ?? ''}”',
                                style: Theme.of(context)
                                    .textTheme
                                    .bodyMedium
                                    ?.copyWith(fontStyle: FontStyle.italic),
                              ),
                            ),
                          ),
                        ),
                  ],
                  const SizedBox(height: 28),
                  Text(
                    l10n.storyDetailChaptersHeading,
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            ),
          ),
          Consumer<AuthState>(
            builder: (context, auth, _) {
              final cfg = LaunchOfferService.instance.config;
              // Per-story sample size (proven vs. unproven auto-tiering — see
              // freeChapterThreshold.js) always wins over the platform default;
              // OTP/subscription gates scale off it the same way the backend
              // does in accessControl.js, so lock icons never lie about what
              // the server will actually enforce.
              final freeThrough = story.resolvedFreeChapters ?? cfg.freeChapters;
              final otpGate = freeThrough + 1;
              final subGate = [cfg.subscriptionGateChapter, freeThrough + 3].reduce(
                (a, b) => a > b ? a : b,
              );
              final signedIn = auth.isLoggedIn;
              final subscribed = auth.isSubscribed || auth.isOnLaunchTrial;

              return SliverList(
                delegate: SliverChildBuilderDelegate((context, index) {
                  final ch = _detail!.chapters[index];
                  final n = ch.chapterNumber;
                  final isPreviewFree = n <= freeThrough;
                  final needsSignIn = n >= otpGate && !signedIn;
                  final needsSub = n >= subGate && !subscribed;

                  // State the real access condition — never Free + padlock together.
                  final String accessLabel;
                  final IconData? trailingIcon;
                  final Color trailingColor;
                  if (isPreviewFree) {
                    accessLabel = l10n.storyDetailChapterAccessFree(
                      ch.viewCount,
                      ch.readTimeMinutes,
                    );
                    trailingIcon = null;
                    trailingColor = KathaColors.gold;
                  } else if (needsSignIn) {
                    accessLabel = l10n.storyDetailChapterAccessSignIn(
                      ch.readTimeMinutes,
                    );
                    trailingIcon = Icons.lock_outline;
                    trailingColor = KathaTheme.mutedInk(context);
                  } else if (needsSub) {
                    accessLabel = l10n.storyDetailChapterAccessMembers(
                      ch.viewCount,
                      ch.readTimeMinutes,
                    );
                    trailingIcon = Icons.workspace_premium;
                    trailingColor = KathaTheme.mutedInk(context);
                  } else {
                    accessLabel = l10n.storyDetailChapterAccessDefault(
                      ch.viewCount,
                      ch.readTimeMinutes,
                    );
                    trailingIcon = null;
                    trailingColor = KathaColors.gold;
                  }

                  return ListTile(
                    leading: CircleAvatar(
                      backgroundColor: KathaColors.gold.withValues(alpha: 0.15),
                      child: Text(
                        '$n',
                        style: const TextStyle(
                          color: KathaColors.goldDark,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    title: Text(
                      ch.title ?? l10n.errorChapterNumber(n),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    subtitle: Text(
                      accessLabel,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    trailing: trailingIcon == null
                        ? null
                        : Icon(trailingIcon, size: 18, color: trailingColor),
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => ReaderScreen(
                          storyId: story.id,
                          storyTitle: story.title,
                          chapterNumber: ch.chapterNumber,
                        ),
                      ),
                    ),
                  );
                }, childCount: _detail!.chapters.length),
              );
            },
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 32)),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: FilledButton(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => ReaderScreen(
                  storyId: story.id,
                  storyTitle: story.title,
                  chapterNumber: 1,
                ),
              ),
            ),
            style: FilledButton.styleFrom(
              backgroundColor: KathaColors.gold,
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            child: Text(l10n.storyDetailStartReadingChapter1),
          ),
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _InfoChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: KathaColors.gold.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(100),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: KathaColors.goldDark),
          const SizedBox(width: 6),
          Text(
            label,
            style: Theme.of(
              context,
            ).textTheme.labelMedium?.copyWith(color: KathaColors.goldDark),
          ),
        ],
      ),
    );
  }
}
