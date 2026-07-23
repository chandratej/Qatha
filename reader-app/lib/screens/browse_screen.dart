import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/models/story.dart';
import '../core/providers/auth_state.dart';
import '../core/services/api_service.dart' show ApiService, ApiException, DiscoverFeed;
import '../core/theme/katha_theme.dart';
import '../widgets/error_state.dart';
import '../widgets/story_card.dart';
import '../l10n/generated/app_localizations.dart';
import 'story_detail_screen.dart';

class BrowseScreen extends StatefulWidget {
  const BrowseScreen({super.key});

  @override
  State<BrowseScreen> createState() => _BrowseScreenState();
}

class _BrowseScreenState extends State<BrowseScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final _genres = ['romance', 'family_drama', 'suspense'];
  final _labels = ['Romance', 'Family Drama', 'Suspense'];
  final Map<String, DiscoverFeed?> _feeds = {};
  final Map<String, bool> _loading = {};
  final Map<String, String?> _errors = {};

  final _searchController = TextEditingController();
  List<Story> _searchResults = [];
  bool _searching = false;
  String? _searchError;
  bool _searchActive = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(_onTabChanged);
    _loadGenre(_genres[0]);
  }

  void _onTabChanged() {
    if (!_tabController.indexIsChanging) _loadGenre(_genres[_tabController.index]);
  }

  Future<void> _loadGenre(String genre) async {
    if (_feeds[genre] != null) return;
    setState(() {
      _loading[genre] = true;
      _errors[genre] = null;
    });
    try {
      final auth = context.read<AuthState>();
      final api = ApiService.fromAuth(auth);
      final feed = await api.fetchDiscover(genre);
      if (mounted) {
        setState(() {
          _feeds[genre] = feed;
          _loading[genre] = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errors[genre] = e is ApiException
              ? e.userMessage
              : 'Cannot reach story API. Is the backend running on port 3001?';
          _loading[genre] = false;
        });
      }
    }
  }

  Future<void> _runSearch(String raw) async {
    final q = raw.trim();
    if (q.isEmpty) {
      setState(() {
        _searchActive = false;
        _searchResults = [];
        _searchError = null;
      });
      return;
    }
    setState(() {
      _searchActive = true;
      _searching = true;
      _searchError = null;
    });
    try {
      final auth = context.read<AuthState>();
      final api = ApiService.fromAuth(auth);
      final results = await api.searchStories(q);
      if (mounted) {
        setState(() {
          _searchResults = results;
          _searching = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _searching = false;
          _searchError = e is ApiException ? e.userMessage : 'Search failed';
        });
      }
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.browseTitle),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(104),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                child: TextField(
                  controller: _searchController,
                  textInputAction: TextInputAction.search,
                  onSubmitted: _runSearch,
                  decoration: InputDecoration(
                    hintText: l10n.browseSearchHint,
                    prefixIcon: const Icon(Icons.search, color: KathaColors.gold),
                    suffixIcon: _searchActive
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              _runSearch('');
                            },
                          )
                        : IconButton(
                            icon: const Icon(Icons.arrow_forward),
                            onPressed: () => _runSearch(_searchController.text),
                          ),
                    filled: true,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
                  ),
                ),
              ),
              if (!_searchActive)
                TabBar(
                  controller: _tabController,
                  labelColor: KathaColors.gold,
                  unselectedLabelColor: KathaTheme.mutedInk(context),
                  indicatorColor: KathaColors.gold,
                  tabs: _labels.map((l) => Tab(text: l)).toList(),
                ),
            ],
          ),
        ),
      ),
      body: _searchActive
          ? _buildSearchBody()
          : TabBarView(
              controller: _tabController,
              children: _genres
                  .map(
                    (g) => _GenreFeed(
                      genre: g,
                      feed: _feeds[g],
                      loading: _loading[g] ?? false,
                      error: _errors[g],
                      onRetry: () {
                        _feeds.remove(g);
                        _loadGenre(g);
                      },
                    ),
                  )
                  .toList(),
            ),
    );
  }

  Widget _buildSearchBody() {
    if (_searching) {
      return const Center(child: CircularProgressIndicator(color: KathaColors.gold));
    }
    if (_searchError != null) {
      return ErrorState(
        message: _searchError!,
        onRetry: () => _runSearch(_searchController.text),
      );
    }
    if (_searchResults.isEmpty) {
      return Center(
        child: Text(AppLocalizations.of(context)!.emptySearchResultsTitle),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(24),
      itemCount: _searchResults.length,
      itemBuilder: (context, i) {
        final story = _searchResults[i];
        return StoryCard(
          story: story,
          index: i,
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => StoryDetailScreen(storyId: story.id)),
          ),
        );
      },
    );
  }
}

class _GenreFeed extends StatelessWidget {
  final String genre;
  final DiscoverFeed? feed;
  final bool loading;
  final String? error;
  final VoidCallback onRetry;

  const _GenreFeed({
    required this.genre,
    this.feed,
    required this.loading,
    this.error,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Center(child: CircularProgressIndicator(color: KathaColors.gold));
    }
    if (error != null) return ErrorState(message: error!, onRetry: onRetry);
    if (feed == null) return const SizedBox();

    final l10n = AppLocalizations.of(context)!;
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        _SectionHeader(
          title: l10n.browseSectionTrendingThisWeek,
          icon: Icons.trending_up,
        ),
        const SizedBox(height: 12),
        ...feed!.trending.asMap().entries.map(
              (e) => StoryCard(
                story: e.value,
                index: e.key,
                onTap: () => _open(context, e.value),
              ),
            ),
        const SizedBox(height: 24),
        _SectionHeader(title: l10n.sectionNewReleases, icon: Icons.fiber_new),
        const SizedBox(height: 12),
        ...feed!.newReleases.asMap().entries.map(
              (e) => StoryCard(
                story: e.value,
                index: e.key + 3,
                onTap: () => _open(context, e.value),
              ),
            ),
      ],
    );
  }

  void _open(BuildContext context, Story story) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => StoryDetailScreen(storyId: story.id)),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final IconData icon;
  const _SectionHeader({required this.title, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 20, color: KathaColors.gold),
        const SizedBox(width: 8),
        Text(title, style: Theme.of(context).textTheme.titleLarge),
      ],
    );
  }
}
