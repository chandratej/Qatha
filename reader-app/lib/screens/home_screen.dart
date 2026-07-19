import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../core/config/app_config.dart';
import '../core/models/story.dart';
import '../core/providers/app_state.dart';
import '../core/services/api_service.dart';
import '../core/theme/katha_theme.dart';
import '../widgets/error_state.dart';
import '../core/services/analytics_service.dart';
import '../widgets/story_card.dart';
import '../widgets/story_card_shimmer.dart';
import '../core/providers/auth_state.dart';
import 'reader_screen.dart';
import 'story_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Story> _trending = [];
  List<Story> _newReleases = [];
  bool _loading = true;
  String? _error;
  String? _selectedGenre;

  static const _genres = [
    (id: null, label: 'All', labelTe: 'అన్నీ'),
    (id: 'romance', label: 'Romance', labelTe: 'ప్రేమ'),
    (id: 'family_drama', label: 'Family', labelTe: 'కుటుంబం'),
    (id: 'suspense', label: 'Suspense', labelTe: 'సస్పెన్స్'),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _load();
      AnalyticsService.instance.homepageView();
    });
  }

  /// Catalog is API-only. Never inject hard-coded demo stories.
  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final auth = context.read<AuthState>();
      final api = ApiService.fromAuth(auth);
      final results = await Future.wait([
        api.fetchStories(sort: 'trending', genre: _selectedGenre),
        api.fetchStories(sort: 'new', genre: _selectedGenre),
      ]);
      if (!mounted) return;
      setState(() {
        _trending = results[0];
        _newReleases = results[1];
        _loading = false;
        _error = null;
      });
    } catch (e) {
      if (!mounted) return;
      final msg = e is ApiException
          ? e.userMessage
          : 'Could not reach story API at ${AppConfig.apiBase}';
      setState(() {
        _trending = [];
        _newReleases = [];
        _loading = false;
        _error = msg;
      });
    }
  }

  void _openStory(Story story) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => StoryDetailScreen(storyId: story.id)),
    );
  }

  void _selectGenre(String? genre) {
    if (_selectedGenre == genre) return;
    setState(() => _selectedGenre = genre);
    if (genre != null) context.read<AppState>().setLastGenre(genre);
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isEmpty =
        !_loading && _error == null && _trending.isEmpty && _newReleases.isEmpty;

    // No nested Scaffold — AppShell already provides one (avoids web layout asserts).
    return SafeArea(
      child: _loading
          ? const Padding(
              padding: EdgeInsets.all(24),
              child: StoryListShimmer(),
            )
          : _error != null
              ? ErrorState(
                  message:
                      '$_error\n\nAPI: ${AppConfig.apiBase}\nStart backend (port 3001), publish in Creator Studio, then retry.',
                  onRetry: _load,
                )
              : isEmpty
                  ? ErrorState(
                      message:
                          'No published stories from the database yet.\n\n'
                          'In Creator Studio: create a story → write a chapter → Publish.\n'
                          'API: ${AppConfig.apiBase}',
                      onRetry: _load,
                    )
                  : RefreshIndicator(
                      color: KathaColors.gold,
                      onRefresh: _load,
                      child: CustomScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        slivers: [
                          _buildSliverHeader(context, appState, isDark),
                          if (_trending.isNotEmpty)
                            SliverPadding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 24),
                              sliver: SliverList(
                                delegate: SliverChildBuilderDelegate(
                                  (context, index) => StoryCard(
                                    story: _trending[index],
                                    index: index,
                                    onTap: () => _openStory(_trending[index]),
                                  ),
                                  childCount: _trending.length,
                                  addAutomaticKeepAlives: false,
                                ),
                              ),
                            ),
                          if (_newReleases.isNotEmpty) ...[
                            const SliverToBoxAdapter(
                              child: Padding(
                                padding: EdgeInsets.fromLTRB(24, 32, 24, 12),
                                child: _SectionHeader(
                                  titleTe: 'కొత్త కథలు',
                                  titleEn: 'New releases',
                                  subtitle: 'From Creator Studio · live catalog',
                                  icon: Icons.fiber_new_rounded,
                                ),
                              ),
                            ),
                            SliverPadding(
                              padding:
                                  const EdgeInsets.fromLTRB(24, 0, 24, 32),
                              sliver: SliverList(
                                delegate: SliverChildBuilderDelegate(
                                  (context, index) => StoryCard(
                                    story: _newReleases[index],
                                    index: index + _trending.length,
                                    onTap: () =>
                                        _openStory(_newReleases[index]),
                                  ),
                                  childCount: _newReleases.length,
                                  addAutomaticKeepAlives: false,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
    );
  }

  Widget _buildSliverHeader(
    BuildContext context,
    AppState appState,
    bool isDark,
  ) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'కథ',
                        style:
                            Theme.of(context).textTheme.displayLarge?.copyWith(
                                  foreground: Paint()
                                    ..shader = const LinearGradient(
                                      colors: [
                                        KathaColors.gold,
                                        KathaColors.ember,
                                      ],
                                    ).createShader(
                                      const Rect.fromLTWH(0, 0, 80, 40),
                                    ),
                                ),
                      ).animate().fadeIn(duration: 600.ms),
                      Text(
                        'తెలుగు కథలు · live from API',
                        style: Theme.of(context).textTheme.labelMedium,
                      ).animate().fadeIn(duration: 600.ms, delay: 100.ms),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => appState.toggleTheme(),
                  icon: Icon(
                    isDark
                        ? Icons.light_mode_outlined
                        : Icons.dark_mode_outlined,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            if (appState.hasContinueReading) ...[
              _ContinueReadingCard(
                title: appState.continueReadingTitle!,
                chapter: appState.continueReadingChapter,
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => ReaderScreen(
                      storyId: appState.continueReadingStoryId!,
                      storyTitle: appState.continueReadingTitle!,
                      chapterNumber: appState.continueReadingChapter,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],
            SizedBox(
              height: 40,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _genres.length,
                separatorBuilder: (context, index) => const SizedBox(width: 8),
                itemBuilder: (_, i) {
                  final g = _genres[i];
                  final selected = _selectedGenre == g.id;
                  return FilterChip(
                    label: Text(g.label),
                    selected: selected,
                    onSelected: (_) => _selectGenre(g.id),
                    selectedColor: KathaColors.gold.withValues(alpha: 0.2),
                    checkmarkColor: KathaColors.goldDark,
                    labelStyle: TextStyle(
                      color: selected ? KathaColors.goldDark : null,
                      fontWeight:
                          selected ? FontWeight.w600 : FontWeight.w500,
                    ),
                    side: BorderSide(
                      color: selected
                          ? KathaColors.gold
                          : KathaColors.ink.withValues(alpha: 0.1),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 24),
            if (_trending.isNotEmpty)
              const _SectionHeader(
                titleTe: 'ఇప్పుడు ట్రెండింగ్',
                titleEn: 'Trending now',
                subtitle: 'Published stories from the database',
              ),
            if (_trending.isNotEmpty) const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String titleTe;
  final String titleEn;
  final String subtitle;
  final IconData? icon;

  const _SectionHeader({
    required this.titleTe,
    required this.titleEn,
    required this.subtitle,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            if (icon != null) ...[
              Icon(icon, size: 20, color: KathaColors.gold),
              const SizedBox(width: 8),
            ],
            Flexible(
              child: Text(
                titleTe,
                style: Theme.of(context).textTheme.titleLarge,
              ),
            ),
          ],
        ),
        Text(
          titleEn,
          style: Theme.of(context)
              .textTheme
              .labelMedium
              ?.copyWith(color: KathaColors.goldDark),
        ),
        const SizedBox(height: 2),
        Text(subtitle, style: Theme.of(context).textTheme.labelMedium),
      ],
    );
  }
}

class _ContinueReadingCard extends StatelessWidget {
  final String title;
  final int chapter;
  final VoidCallback onTap;

  const _ContinueReadingCard({
    required this.title,
    required this.chapter,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [KathaColors.gold, KathaColors.goldDark],
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: KathaColors.gold.withValues(alpha: 0.3),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'కొనసాగించండి · Continue reading',
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                          color: Colors.white.withValues(alpha: 0.85),
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    title,
                    style: Theme.of(context)
                        .textTheme
                        .titleLarge
                        ?.copyWith(color: Colors.white),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    'Chapter $chapter',
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                          color: Colors.white.withValues(alpha: 0.75),
                        ),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.arrow_forward, color: Colors.white),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 500.ms);
  }
}
