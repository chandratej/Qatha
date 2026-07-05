import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/models/story.dart';
import '../core/providers/auth_state.dart';
import '../core/services/api_service.dart';
import '../core/theme/katha_theme.dart';
import '../widgets/error_state.dart';
import '../widgets/story_card.dart';
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
    setState(() { _loading[genre] = true; _errors[genre] = null; });
    try {
      final auth = context.read<AuthState>();
      final api = ApiService.fromAuth(auth);
      final feed = await api.fetchDiscover(genre);
      if (mounted) setState(() { _feeds[genre] = feed; _loading[genre] = false; });
    } catch (_) {
      if (mounted) setState(() { _errors[genre] = 'Unable to load stories'; _loading[genre] = false; });
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('వెతకండి · Browse'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: KathaColors.gold,
          unselectedLabelColor: KathaColors.inkMuted,
          indicatorColor: KathaColors.gold,
          tabs: _labels.map((l) => Tab(text: l)).toList(),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: _genres.map((g) => _GenreFeed(
          genre: g,
          feed: _feeds[g],
          loading: _loading[g] ?? false,
          error: _errors[g],
          onRetry: () { _feeds.remove(g); _loadGenre(g); },
        )).toList(),
      ),
    );
  }
}

class _GenreFeed extends StatelessWidget {
  final String genre;
  final DiscoverFeed? feed;
  final bool loading;
  final String? error;
  final VoidCallback onRetry;

  const _GenreFeed({required this.genre, this.feed, required this.loading, this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator(color: KathaColors.gold));
    if (error != null) return ErrorState(message: error!, onRetry: onRetry);
    if (feed == null) return const SizedBox();

    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        _SectionHeader(title: 'Trending this week', icon: Icons.trending_up),
        const SizedBox(height: 12),
        ...feed!.trending.asMap().entries.map((e) => StoryCard(story: e.value, index: e.key, onTap: () => _open(context, e.value))),
        const SizedBox(height: 24),
        _SectionHeader(title: 'New releases', icon: Icons.fiber_new),
        const SizedBox(height: 12),
        ...feed!.newReleases.asMap().entries.map((e) => StoryCard(story: e.value, index: e.key + 3, onTap: () => _open(context, e.value))),
      ],
    );
  }

  void _open(BuildContext context, Story story) {
    Navigator.push(context, MaterialPageRoute(
      builder: (_) => StoryDetailScreen(storyId: story.id),
    ));
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