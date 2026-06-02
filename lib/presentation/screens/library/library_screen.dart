/// StoryVerse Library Screen
/// User's reading collection, bookmarks, and history

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:storyverse/core/theme/app_theme.dart';
import 'package:storyverse/presentation/widgets/story/story_card.dart';

class LibraryScreen extends ConsumerStatefulWidget {
  const LibraryScreen({super.key});

  @override
  ConsumerState<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends ConsumerState<LibraryScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.neutralOffWhite,
      appBar: AppBar(
        title: const Text('My Library'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: const [
            Tab(text: 'Reading'),
            Tab(text: 'Completed'),
            Tab(text: 'Bookmarks'),
            Tab(text: 'Downloads'),
            Tab(text: 'History'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildReadingTab(),
          _buildCompletedTab(),
          _buildBookmarksTab(),
          _buildDownloadsTab(),
          _buildHistoryTab(),
        ],
      ),
    );
  }

  Widget _buildReadingTab() {
    return _buildEmptyState(
      icon: Icons.auto_stories,
      title: 'Start Reading',
      subtitle: 'Stories you\'re currently reading will appear here',
      actionText: 'Explore Stories',
    );
  }

  Widget _buildCompletedTab() {
    return _buildEmptyState(
      icon: Icons.check_circle_outline,
      title: 'No Completed Stories',
      subtitle: 'Stories you finish will appear here',
      actionText: 'Discover Stories',
    );
  }

  Widget _buildBookmarksTab() {
    return _buildEmptyState(
      icon: Icons.bookmark_border,
      title: 'No Bookmarks',
      subtitle: 'Bookmark stories to read them later',
      actionText: 'Browse Stories',
    );
  }

  Widget _buildDownloadsTab() {
    return _buildEmptyState(
      icon: Icons.download_outlined,
      title: 'No Downloads',
      subtitle: 'Download stories for offline reading',
      actionText: 'Find Stories',
      isPremium: true,
    );
  }

  Widget _buildHistoryTab() {
    return _buildEmptyState(
      icon: Icons.history,
      title: 'No History',
      subtitle: 'Your reading history will appear here',
      actionText: 'Start Reading',
    );
  }

  Widget _buildEmptyState({
    required IconData icon,
    required String title,
    required String subtitle,
    required String actionText,
    bool isPremium = false,
  }) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 80,
              color: AppTheme.neutralGray,
            ),
            const SizedBox(height: 24),
            Text(
              title,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: AppTheme.neutralDarkGray,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              subtitle,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.neutralGray,
                  ),
              textAlign: TextAlign.center,
            ),
            if (isPremium) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppTheme.primaryGold.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.star,
                      size: 16,
                      color: AppTheme.primaryGold,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Premium Feature',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: AppTheme.primaryGold,
                          ),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.explore),
              label: Text(actionText),
            ),
          ],
        ),
      ),
    );
  }
}
