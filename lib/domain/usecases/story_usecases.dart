import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../domain/entities/story.dart';
import '../../../domain/entities/chapter.dart';

/// Use case for getting a list of stories with filters
class GetStories {
  final StoryRepository repository;

  GetStories(this.repository);

  Future<List<Story>> call({
    String? genre,
    String? leagueId,
    bool? isCompleted,
    int limit = 20,
    DocumentSnapshot? lastDocument,
    bool forceRefresh = false,
  }) {
    return repository.getStories(
      genre: genre,
      leagueId: leagueId,
      isCompleted: isCompleted,
      limit: limit,
      lastDocument: lastDocument,
      forceRefresh: forceRefresh,
    );
  }
}

/// Use case for getting a single story by ID
class GetStoryById {
  final StoryRepository repository;

  GetStoryById(this.repository);

  Future<Story> call(String storyId, {bool forceRefresh = false}) {
    return repository.getStoryById(storyId, forceRefresh: forceRefresh);
  }
}

/// Use case for getting chapters of a story
class GetChapters {
  final StoryRepository repository;

  GetChapters(this.repository);

  Future<List<Chapter>> call(String storyId, {bool forceRefresh = false}) {
    return repository.getChapters(storyId, forceRefresh: forceRefresh);
  }
}

/// Use case for getting a specific chapter
class GetChapter {
  final StoryRepository repository;

  GetChapter(this.repository);

  Future<Chapter> call(String storyId, String chapterId, {bool forceRefresh = false}) {
    return repository.getChapter(storyId, chapterId, forceRefresh: forceRefresh);
  }
}

/// Use case for searching stories
class SearchStories {
  final StoryRepository repository;

  SearchStories(this.repository);

  Future<List<Story>> call(String query, {Map<String, dynamic>? filters}) {
    return repository.searchStories(query, filters: filters);
  }
}

/// Use case for getting trending stories
class GetTrendingStories {
  final StoryRepository repository;

  GetTrendingStories(this.repository);

  Future<List<Story>> call({int limit = 10}) {
    return repository.getTrendingStories(limit: limit);
  }
}

/// Use case for getting recommended stories
class GetRecommendedStories {
  final StoryRepository repository;

  GetRecommendedStories(this.repository);

  Future<List<Story>> call(String userId, {int limit = 10}) {
    return repository.getRecommendedStories(userId, limit: limit);
  }
}

/// Use case for getting stories near promotion
class GetNearPromotionStories {
  final StoryRepository repository;

  GetNearPromotionStories(this.repository);

  Future<List<Story>> call({int limit = 10}) {
    return repository.getNearPromotionStories(limit: limit);
  }
}

/// Use case for getting recently promoted stories
class GetRecentlyPromotedStories {
  final StoryRepository repository;

  GetRecentlyPromotedStories(this.repository);

  Future<List<Story>> call({int limit = 10}) {
    return repository.getRecentlyPromotedStories(limit: limit);
  }
}

/// Use case for getting archive discoveries
class GetArchiveDiscoveries {
  final StoryRepository repository;

  GetArchiveDiscoveries(this.repository);

  Future<List<Story>> call({int limit = 10}) {
    return repository.getArchiveDiscoveries(limit: limit);
  }
}

/// Use case for getting premium spotlight stories
class GetPremiumSpotlight {
  final StoryRepository repository;

  GetPremiumSpotlight(this.repository);

  Future<List<Story>> call({int limit = 10}) {
    return repository.getPremiumSpotlight(limit: limit);
  }
}

/// Use case for getting immortal collection stories
class GetImmortalCollection {
  final StoryRepository repository;

  GetImmortalCollection(this.repository);

  Future<List<Story>> call({int limit = 10}) {
    return repository.getImmortalCollection(limit: limit);
  }
}

/// Use case for getting daily literary pick
class GetDailyLiteraryPick {
  final StoryRepository repository;

  GetDailyLiteraryPick(this.repository);

  Future<Story?> call() {
    return repository.getDailyLiteraryPick();
  }
}

/// Use case for recording reading progress
class RecordReadingProgress {
  final StoryRepository repository;

  RecordReadingProgress(this.repository);

  Future<void> call({
    required String userId,
    required String storyId,
    required String chapterId,
    required double progress,
  }) {
    return repository.recordReadingProgress(
      userId: userId,
      storyId: storyId,
      chapterId: chapterId,
      progress: progress,
    );
  }
}

/// Use case for getting reading progress
class GetReadingProgress {
  final StoryRepository repository;

  GetReadingProgress(this.repository);

  Future<Map<String, dynamic>?> call({
    required String userId,
    required String storyId,
  }) {
    return repository.getReadingProgress(userId: userId, storyId: storyId);
  }
}

/// Use case for incrementing story views
class IncrementStoryViews {
  final StoryRepository repository;

  IncrementStoryViews(this.repository);

  Future<void> call(String storyId) {
    return repository.incrementStoryViews(storyId);
  }
}
