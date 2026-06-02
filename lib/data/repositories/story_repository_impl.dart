import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:dio/dio.dart';
import 'package:hive/hive.dart';
import '../../../domain/entities/story.dart';
import '../../../domain/entities/chapter.dart';
import '../../../domain/repositories/story_repository.dart';
import '../datasources/remote/story_remote_data_source.dart';
import '../datasources/local/story_local_data_source.dart';

/// Implementation of StoryRepository with offline-first architecture
class StoryRepositoryImpl implements StoryRepository {
  final StoryRemoteDataSource _remoteDataSource;
  final StoryLocalDataSource _localDataSource;

  StoryRepositoryImpl({
    required StoryRemoteDataSource remoteDataSource,
    required StoryLocalDataSource localDataSource,
  })  : _remoteDataSource = remoteDataSource,
        _localDataSource = localDataSource;

  @override
  Future<List<Story>> getStories({
    String? genre,
    String? leagueId,
    bool? isCompleted,
    int limit = 20,
    DocumentSnapshot? lastDocument,
    bool forceRefresh = false,
  }) async {
    try {
      // Offline-first: try cache first unless force refresh
      if (!forceRefresh) {
        final cachedStories = await _localDataSource.getCachedStories();
        if (cachedStories.isNotEmpty) {
          // Apply filters to cached data
          var filtered = cachedStories;
          
          if (genre != null && genre.isNotEmpty) {
            filtered = filtered.where((s) => s.genres.contains(genre)).toList();
          }
          
          if (leagueId != null && leagueId.isNotEmpty) {
            filtered = filtered.where((s) => s.leagueId == leagueId).toList();
          }
          
          if (isCompleted != null) {
            filtered = filtered.where((s) => s.isCompleted == isCompleted).toList();
          }
          
          if (filtered.isNotEmpty) {
            return filtered.take(limit).toList();
          }
        }
      }

      // Fetch from remote
      final stories = await _remoteDataSource.getStories(
        genre: genre,
        leagueId: leagueId,
        isCompleted: isCompleted,
        limit: limit,
        lastDocument: lastDocument,
      );

      // Cache the results
      await _localDataSource.cacheStories(stories);

      return stories;
    } catch (e) {
      // Fallback to cache on error
      final cachedStories = await _localDataSource.getCachedStories();
      if (cachedStories.isNotEmpty) {
        return cachedStories;
      }
      rethrow;
    }
  }

  @override
  Future<Story> getStoryById(String storyId, {bool forceRefresh = false}) async {
    try {
      // Try cache first
      if (!forceRefresh) {
        final cachedStory = await _localDataSource.getCachedStory(storyId);
        if (cachedStory != null) {
          return cachedStory;
        }
      }

      // Fetch from remote
      final story = await _remoteDataSource.getStoryById(storyId);

      // Cache the story
      await _localDataSource.cacheStory(story);

      return story;
    } catch (e) {
      // Fallback to cache on error
      final cachedStory = await _localDataSource.getCachedStory(storyId);
      if (cachedStory != null) {
        return cachedStory;
      }
      rethrow;
    }
  }

  @override
  Future<List<Chapter>> getChapters(String storyId, {bool forceRefresh = false}) async {
    try {
      // Try cache first
      if (!forceRefresh) {
        final cachedChapters = await _localDataSource.getCachedChapters(storyId);
        if (cachedChapters.isNotEmpty) {
          return cachedChapters;
        }
      }

      // Fetch from remote
      final chapters = await _remoteDataSource.getChapters(storyId);

      // Cache the chapters
      await _localDataSource.cacheChapters(storyId, chapters);

      return chapters;
    } catch (e) {
      // Fallback to cache on error
      final cachedChapters = await _localDataSource.getCachedChapters(storyId);
      if (cachedChapters.isNotEmpty) {
        return cachedChapters;
      }
      rethrow;
    }
  }

  @override
  Future<Chapter> getChapter(String storyId, String chapterId, {bool forceRefresh = false}) async {
    // Get all chapters and find the specific one
    final chapters = await getChapters(storyId, forceRefresh: forceRefresh);
    
    final chapter = chapters.firstWhere(
      (c) => c.id == chapterId,
      orElse: () => throw Exception('Chapter not found'),
    );

    return chapter;
  }

  @override
  Future<List<Story>> searchStories(String query, {Map<String, dynamic>? filters}) async {
    return await _remoteDataSource.searchStories(query, filters: filters);
  }

  @override
  Future<List<Story>> getTrendingStories({int limit = 10}) async {
    return await _remoteDataSource.getTrendingStories(limit: limit);
  }

  @override
  Future<List<Story>> getRecommendedStories(String userId, {int limit = 10}) async {
    return await _remoteDataSource.getRecommendedStories(userId, limit: limit);
  }

  @override
  Future<List<Story>> getNearPromotionStories({int limit = 10}) async {
    return await _remoteDataSource.getNearPromotionStories(limit: limit);
  }

  @override
  Future<List<Story>> getRecentlyPromotedStories({int limit = 10}) async {
    return await _remoteDataSource.getRecentlyPromotedStories(limit: limit);
  }

  @override
  Future<List<Story>> getArchiveDiscoveries({int limit = 10}) async {
    return await _remoteDataSource.getArchiveDiscoveries(limit: limit);
  }

  @override
  Future<List<Story>> getPremiumSpotlight({int limit = 10}) async {
    return await _remoteDataSource.getPremiumSpotlight(limit: limit);
  }

  @override
  Future<List<Story>> getImmortalCollection({int limit = 10}) async {
    return await _remoteDataSource.getImmortalCollection(limit: limit);
  }

  @override
  Future<List<Story>> getFeaturedAuthorsStories({int limit = 10}) async {
    return await _remoteDataSource.getFeaturedAuthorsStories(limit: limit);
  }

  @override
  Future<List<Story>> getSeasonalCollection({String? season, int limit = 10}) async {
    return await _remoteDataSource.getSeasonalCollection(season: season, limit: limit);
  }

  @override
  Future<Story?> getDailyLiteraryPick() async {
    return await _remoteDataSource.getDailyLiteraryPick();
  }

  @override
  Future<void> incrementStoryViews(String storyId) async {
    await _remoteDataSource.incrementStoryViews(storyId);
  }

  @override
  Future<void> recordReadingProgress({
    required String userId,
    required String storyId,
    required String chapterId,
    required double progress,
  }) async {
    final now = DateTime.now();
    
    // Save to local storage first (offline support)
    await _localDataSource.saveReadingProgress(
      userId: userId,
      storyId: storyId,
      chapterId: chapterId,
      progress: progress,
      lastReadAt: now,
    );

    // Sync to remote when online
    await _remoteDataSource.recordReadingProgress(
      userId: userId,
      storyId: storyId,
      chapterId: chapterId,
      progress: progress,
    );
  }

  @override
  Future<Map<String, dynamic>?> getReadingProgress({
    required String userId,
    required String storyId,
  }) async {
    // Try local first for instant access
    final localProgress = await _localDataSource.getReadingProgress(
      userId: userId,
      storyId: storyId,
    );

    if (localProgress != null) {
      return localProgress;
    }

    // Could fetch from remote if needed
    return null;
  }

  @override
  Future<List<Map<String, dynamic>>> getAllReadingProgress(String userId) async {
    return await _localDataSource.getAllReadingProgress(userId);
  }

  @override
  Future<void> clearCache() async {
    await _localDataSource.clearStoryCache();
  }

  @override
  Future<void> removeStoryFromCache(String storyId) async {
    await _localDataSource.removeStory(storyId);
  }
}
