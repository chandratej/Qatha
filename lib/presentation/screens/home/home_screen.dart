import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../domain/entities/story.dart';
import '../../../core/routes/app_router.dart';
import '../../providers/story_providers.dart';
import '../../widgets/story/story_card.dart';
import '../../widgets/common/common_widgets.dart';

/// Home screen state notifier
class HomeStateNotifier extends StateNotifier<HomeState> {
  final Ref ref;

  HomeStateNotifier(this.ref) : super(HomeState());

  Future<void> loadAllSections() async {
    state = state.copyWith(isLoading: true);

    try {
      await Future.wait([
        _loadContinueReading(),
        _loadRecommended(),
        _loadTrending(),
        _loadNearPromotion(),
        _loadRecentlyPromoted(),
        _loadArchiveDiscoveries(),
        _loadPremiumSpotlight(),
        _loadImmortalCollection(),
        _loadDailyPick(),
      ]);

      state = state.copyWith(isLoading: false, hasError: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        hasError: true,
        errorMessage: e.toString(),
      );
    }
  }

  Future<void> _loadContinueReading() async {
    // This would come from user's reading progress
    // For now, using empty list
    state = state.copyWith(continueReading: []);
  }

  Future<void> _loadRecommended() async {
    final useCase = ref.read(getRecommendedStoriesProvider);
    final stories = await useCase('current_user_id', limit: 10);
    state = state.copyWith(recommended: stories);
  }

  Future<void> _loadTrending() async {
    final useCase = ref.read(getTrendingStoriesProvider);
    final stories = await useCase(limit: 10);
    state = state.copyWith(trending: stories);
  }

  Future<void> _loadNearPromotion() async {
    final useCase = ref.read(getNearPromotionStoriesProvider);
    final stories = await useCase(limit: 8);
    state = state.copyWith(nearPromotion: stories);
  }

  Future<void> _loadRecentlyPromoted() async {
    final useCase = ref.read(getRecentlyPromotedStoriesProvider);
    final stories = await useCase(limit: 8);
    state = state.copyWith(recentlyPromoted: stories);
  }

  Future<void> _loadArchiveDiscoveries() async {
    final useCase = ref.read(getArchiveDiscoveriesProvider);
    final stories = await useCase(limit: 8);
    state = state.copyWith(archiveDiscoveries: stories);
  }

  Future<void> _loadPremiumSpotlight() async {
    final useCase = ref.read(getPremiumSpotlightProvider);
    final stories = await useCase(limit: 6);
    state = state.copyWith(premiumSpotlight: stories);
  }

  Future<void> _loadImmortalCollection() async {
    final useCase = ref.read(getImmortalCollectionProvider);
    final stories = await useCase(limit: 6);
    state = state.copyWith(immortalCollection: stories);
  }

  Future<void> _loadDailyPick() async {
    final useCase = ref.read(getDailyLiteraryPickProvider);
    final story = await useCase();
    state = state.copyWith(dailyPick: story);
  }

  void onStoryTap(Story story) {
    // Navigate to story detail
  }

  void onRefresh() {
    loadAllSections();
  }
}

/// Home screen state
class HomeState {
  final bool isLoading;
  final bool hasError;
  final String? errorMessage;
  final List<Story> continueReading;
  final List<Story> recommended;
  final List<Story> trending;
  final List<Story> nearPromotion;
  final List<Story> recentlyPromoted;
  final List<Story> archiveDiscoveries;
  final List<Story> premiumSpotlight;
  final List<Story> immortalCollection;
  final Story? dailyPick;

  HomeState({
    this.isLoading = false,
    this.hasError = false,
    this.errorMessage,
    this.continueReading = const [],
    this.recommended = const [],
    this.trending = const [],
    this.nearPromotion = const [],
    this.recentlyPromoted = const [],
    this.archiveDiscoveries = const [],
    this.premiumSpotlight = const [],
    this.immortalCollection = const [],
    this.dailyPick,
  });

  HomeState copyWith({
    bool? isLoading,
    bool? hasError,
    String? errorMessage,
    List<Story>? continueReading,
    List<Story>? recommended,
    List<Story>? trending,
    List<Story>? nearPromotion,
    List<Story>? recentlyPromoted,
    List<Story>? archiveDiscoveries,
    List<Story>? premiumSpotlight,
    List<Story>? immortalCollection,
    Story? dailyPick,
  }) {
    return HomeState(
      isLoading: isLoading ?? this.isLoading,
      hasError: hasError ?? this.hasError,
      errorMessage: errorMessage ?? this.errorMessage,
      continueReading: continueReading ?? this.continueReading,
      recommended: recommended ?? this.recommended,
      trending: trending ?? this.trending,
      nearPromotion: nearPromotion ?? this.nearPromotion,
      recentlyPromoted: recentlyPromoted ?? this.recentlyPromoted,
      archiveDiscoveries: archiveDiscoveries ?? this.archiveDiscoveries,
      premiumSpotlight: premiumSpotlight ?? this.premiumSpotlight,
      immortalCollection: immortalCollection ?? this.immortalCollection,
      dailyPick: dailyPick ?? this.dailyPick,
    );
  }
}

/// Provider for home state
final homeStateNotifierProvider =
    StateNotifierProvider<HomeStateNotifier, HomeState>((ref) {
  return HomeStateNotifier(ref);
});

/// Home Screen - Main discovery experience
class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(homeStateNotifierProvider.notifier).loadAllSections();
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final state = ref.watch(homeStateNotifierProvider);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // App Bar
          SliverAppBar(
            floating: true,
            snap: true,
            elevation: 0,
            backgroundColor: theme.colorScheme.surface,
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'StoryVerse',
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: theme.colorScheme.primary,
                  ),
                ),
                Text(
                  'Discover Premium Stories',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.search_rounded),
                onPressed: () => context.push(AppRoutes.explore),
              ),
              IconButton(
                icon: const Icon(Icons.notifications_outlined),
                onPressed: () {
                  // Show notifications
                },
              ),
            ],
          ),

          // Content
          if (state.isLoading && state.recommended.isEmpty)
            const SliverFillRemaining(
              child: LoadingState(message: 'Curating your stories...'),
            )
          else if (state.hasError && state.recommended.isEmpty)
            SliverFillRemaining(
              child: ErrorState(
                message: state.errorMessage ?? 'Something went wrong',
                onRetry: () =>
                    ref.read(homeStateNotifierProvider.notifier).onRefresh(),
              ),
            )
          else ...[
            // Daily Literary Pick
            if (state.dailyPick != null) ...[
              SliverToBoxAdapter(
                child: _buildDailyPickSection(state.dailyPick!),
              ),
            ],

            // Continue Reading
            if (state.continueReading.isNotEmpty) ...[
              SliverToBoxAdapter(
                child: StorySection(
                  title: 'Continue Reading',
                  stories: state.continueReading,
                  onStoryTap: (story) => _navigateToStory(story),
                  isCompact: true,
                ),
              ),
            ],

            // Recommended For You
            SliverToBoxAdapter(
              child: StorySection(
                title: 'Recommended For You',
                stories: state.recommended,
                onStoryTap: (story) => _navigateToStory(story),
                onViewAllTap: () => _viewAll('recommended'),
              ),
            ),

            // Trending Now
            SliverToBoxAdapter(
              child: StorySection(
                title: 'Trending Now',
                stories: state.trending,
                onStoryTap: (story) => _navigateToStory(story),
                onViewAllTap: () => _viewAll('trending'),
              ),
            ),

            // Near Promotion
            SliverToBoxAdapter(
              child: StorySection(
                title: 'Near Promotion 🔥',
                stories: state.nearPromotion,
                onStoryTap: (story) => _navigateToStory(story),
                isCompact: true,
              ),
            ),

            // Recently Promoted
            SliverToBoxAdapter(
              child: StorySection(
                title: 'Recently Promoted ⭐',
                stories: state.recentlyPromoted,
                onStoryTap: (story) => _navigateToStory(story),
                isCompact: true,
              ),
            ),

            // Archive Discoveries
            SliverToBoxAdapter(
              child: StorySection(
                title: 'Archive Discoveries',
                stories: state.archiveDiscoveries,
                onStoryTap: (story) => _navigateToStory(story),
                isCompact: true,
              ),
            ),

            // Premium Spotlight
            if (state.premiumSpotlight.isNotEmpty) ...[
              SliverToBoxAdapter(
                child: _buildPremiumSection(state.premiumSpotlight),
              ),
            ],

            // Immortal Collection
            if (state.immortalCollection.isNotEmpty) ...[
              SliverToBoxAdapter(
                child: _buildImmortalSection(state.immortalCollection),
              ),
            ],

            // Bottom padding for navigation bar
            const SliverToBoxAdapter(
              child: SizedBox(height: 80),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDailyPickSection(Story story) {
    final theme = Theme.of(context);

    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            theme.colorScheme.primaryContainer,
            theme.colorScheme.primaryContainer.withOpacity(0.5),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Stack(
        children: [
          // Background pattern
          Positioned(
            right: -20,
            top: -20,
            child: Icon(
              Icons.auto_stories_rounded,
              size: 120,
              color: theme.colorScheme.primary.withOpacity(0.1),
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.workspace_premium_rounded,
                      size: 20,
                      color: theme.colorScheme.primary,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Daily Literary Pick',
                      style: theme.textTheme.labelMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: theme.colorScheme.primary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  story.title,
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                Text(
                  'by ${story.authorName}',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => _navigateToStory(story),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: theme.colorScheme.primary,
                    foregroundColor: theme.colorScheme.onPrimary,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 12,
                    ),
                  ),
                  child: const Text('Start Reading'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPremiumSection(List<Story> stories) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
          child: Row(
            children: [
              Icon(
                Icons.diamond_rounded,
                color: AppColors.gold,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'Premium Spotlight',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 200,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: stories.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              return SizedBox(
                width: 160,
                child: StoryGridCard(
                  story: stories[index],
                  onTap: () => _navigateToStory(stories[index]),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildImmortalSection(List<Story> stories) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
          child: Row(
            children: [
              Icon(
                Icons.emoji_events_rounded,
                color: Colors.amber,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'Immortal Collection',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 200,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: stories.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              return SizedBox(
                width: 160,
                child: StoryGridCard(
                  story: stories[index],
                  onTap: () => _navigateToStory(stories[index]),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  void _navigateToStory(Story story) {
    context.push('${AppRoutes.storyDetail}/${story.id}');
  }

  void _viewAll(String section) {
    // Navigate to explore with filter
    context.push(AppRoutes.explore);
  }
}
