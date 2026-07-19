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
import 'reader_screen.dart';

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
    } catch (_) {
      if (mounted) {
        setState(() {
          _error = 'Unable to load story';
          _loading = false;
        });
      }
    }
  }

  String _releaseLabel() {
    final s = _detail!.story;
    switch (s.genre) {
      case 'romance':
        return 'Every Monday, 6:00 PM';
      default:
        return 'New chapters weekly';
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
        body: ErrorState(message: _error ?? 'Story not found', onRetry: _load),
      );
    }

    final story = _detail!.story;
    final isDark = Theme.of(context).brightness == Brightness.dark;

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
                  Row(
                    children: [
                      _InfoChip(
                        icon: Icons.category_outlined,
                        label: story.genreLabel,
                      ),
                      const SizedBox(width: 8),
                      _InfoChip(
                        icon: Icons.people_outline,
                        label: story.readersLabel,
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
                                'Next chapter',
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
                  ).animate().fadeIn(delay: 100.ms),
                  if (story.description != null) ...[
                    const SizedBox(height: 20),
                    Text(
                      story.description!,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                  const SizedBox(height: 28),
                  Text(
                    'Chapters',
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
              final freeThrough = cfg.freeChapters;
              final otpGate = cfg.otpGateChapter;
              final subGate = cfg.subscriptionGateChapter;
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
                    accessLabel =
                        'Free · ${ch.viewCount} readers · ${ch.readTimeMinutes} min';
                    trailingIcon = null;
                    trailingColor = KathaColors.gold;
                  } else if (needsSignIn) {
                    accessLabel =
                        'Free · Sign in to read · ${ch.readTimeMinutes} min';
                    trailingIcon = Icons.lock_outline;
                    trailingColor = KathaColors.inkMuted;
                  } else if (needsSub) {
                    accessLabel =
                        '${ch.viewCount} readers · ${ch.readTimeMinutes} min · Members';
                    trailingIcon = Icons.workspace_premium;
                    trailingColor = KathaColors.inkMuted;
                  } else {
                    accessLabel =
                        '${ch.viewCount} readers · ${ch.readTimeMinutes} min';
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
                      ch.title ?? 'Chapter $n',
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
            child: const Text('Start Reading — Chapter 1'),
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
