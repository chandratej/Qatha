import 'package:hive/hive.dart';
import '../../../domain/entities/story.dart';
import '../../../domain/entities/chapter.dart';
import '../../../core/constants/app_constants.dart';

/// Local data source for offline story caching
abstract class StoryLocalDataSource {
  /// Caches stories locally
  Future<void> cacheStories(List<Story> stories);

  /// Gets cached stories
  Future<List<Story>> getCachedStories();

  /// Caches a single story
  Future<void> cacheStory(Story story);

  /// Gets a cached story by ID
  Future<Story?> getCachedStory(String storyId);

  /// Caches chapters for a story
  Future<void> cacheChapters(String storyId, List<Chapter> chapters);

  /// Gets cached chapters for a story
  Future<List<Chapter>> getCachedChapters(String storyId);

  /// Clears story cache
  Future<void> clearStoryCache();

  /// Removes a story from cache
  Future<void> removeStory(String storyId);

  /// Saves reading progress locally
  Future<void> saveReadingProgress({
    required String userId,
    required String storyId,
    required String chapterId,
    required double progress,
    required DateTime lastReadAt,
  });

  /// Gets reading progress locally
  Future<Map<String, dynamic>?> getReadingProgress({
    required String userId,
    required String storyId,
  });

  /// Gets all reading progress for a user
  Future<List<Map<String, dynamic>>> getAllReadingProgress(String userId);

  /// Clears reading progress
  Future<void> clearReadingProgress(String userId);
}

class StoryLocalDataSourceImpl implements StoryLocalDataSource {
  final Box<dynamic> _storiesBox;
  final Box<dynamic> _chaptersBox;
  final Box<dynamic> _progressBox;

  StoryLocalDataSourceImpl({
    required Box<dynamic> storiesBox,
    required Box<dynamic> chaptersBox,
    required Box<dynamic> progressBox,
  })  : _storiesBox = storiesBox,
        _chaptersBox = chaptersBox,
        _progressBox = progressBox;

  @override
  Future<void> cacheStories(List<Story> stories) async {
    try {
      await _storiesBox.putAll({
        for (var story in stories) story.id: story.toMap(),
      });
    } catch (e) {
      throw Exception('Failed to cache stories: $e');
    }
  }

  @override
  Future<List<Story>> getCachedStories() async {
    try {
      return _storiesBox.values
          .map((data) => Story.fromMap(data as Map<dynamic, dynamic>))
          .toList();
    } catch (e) {
      throw Exception('Failed to get cached stories: $e');
    }
  }

  @override
  Future<void> cacheStory(Story story) async {
    try {
      await _storiesBox.put(story.id, story.toMap());
    } catch (e) {
      throw Exception('Failed to cache story: $e');
    }
  }

  @override
  Future<Story?> getCachedStory(String storyId) async {
    try {
      final data = _storiesBox.get(storyId);
      if (data == null) return null;
      return Story.fromMap(data as Map<dynamic, dynamic>);
    } catch (e) {
      throw Exception('Failed to get cached story: $e');
    }
  }

  @override
  Future<void> cacheChapters(String storyId, List<Chapter> chapters) async {
    try {
      final key = '${AppConstants.hiveChaptersPrefix}_$storyId';
      final chaptersData = chapters.map((chapter) => chapter.toMap()).toList();
      await _chaptersBox.put(key, chaptersData);
    } catch (e) {
      throw Exception('Failed to cache chapters: $e');
    }
  }

  @override
  Future<List<Chapter>> getCachedChapters(String storyId) async {
    try {
      final key = '${AppConstants.hiveChaptersPrefix}_$storyId';
      final data = _chaptersBox.get(key);
      
      if (data == null) return [];
      
      return (data as List)
          .map((item) => Chapter.fromMap(item as Map<dynamic, dynamic>))
          .toList();
    } catch (e) {
      throw Exception('Failed to get cached chapters: $e');
    }
  }

  @override
  Future<void> clearStoryCache() async {
    try {
      await _storiesBox.clear();
      await _chaptersBox.clear();
    } catch (e) {
      throw Exception('Failed to clear story cache: $e');
    }
  }

  @override
  Future<void> removeStory(String storyId) async {
    try {
      await _storiesBox.delete(storyId);
      final chaptersKey = '${AppConstants.hiveChaptersPrefix}_$storyId';
      await _chaptersBox.delete(chaptersKey);
    } catch (e) {
      throw Exception('Failed to remove story: $e');
    }
  }

  @override
  Future<void> saveReadingProgress({
    required String userId,
    required String storyId,
    required String chapterId,
    required double progress,
    required DateTime lastReadAt,
  }) async {
    try {
      final key = '${userId}_$storyId';
      await _progressBox.put(key, {
        'userId': userId,
        'storyId': storyId,
        'currentChapterId': chapterId,
        'progress': progress,
        'lastReadAt': lastReadAt.toIso8601String(),
      });
    } catch (e) {
      throw Exception('Failed to save reading progress: $e');
    }
  }

  @override
  Future<Map<String, dynamic>?> getReadingProgress({
    required String userId,
    required String storyId,
  }) async {
    try {
      final key = '${userId}_$storyId';
      final data = _progressBox.get(key);
      
      if (data == null) return null;
      
      final map = data as Map<dynamic, dynamic>;
      return {
        'userId': map['userId'],
        'storyId': map['storyId'],
        'currentChapterId': map['currentChapterId'],
        'progress': map['progress'],
        'lastReadAt': DateTime.parse(map['lastReadAt'] as String),
      };
    } catch (e) {
      throw Exception('Failed to get reading progress: $e');
    }
  }

  @override
  Future<List<Map<String, dynamic>>> getAllReadingProgress(String userId) async {
    try {
      return _progressBox.values
          .where((data) {
            final map = data as Map<dynamic, dynamic>;
            return map['userId'] == userId;
          })
          .map((data) {
            final map = data as Map<dynamic, dynamic>;
            return {
              'userId': map['userId'],
              'storyId': map['storyId'],
              'currentChapterId': map['currentChapterId'],
              'progress': map['progress'],
              'lastReadAt': DateTime.parse(map['lastReadAt'] as String),
            };
          })
          .toList();
    } catch (e) {
      throw Exception('Failed to get all reading progress: $e');
    }
  }

  @override
  Future<void> clearReadingProgress(String userId) async {
    try {
      final keysToDelete = <String>[];
      
      for (var key in _progressBox.keys) {
        final data = _progressBox.get(key);
        if (data != null) {
          final map = data as Map<dynamic, dynamic>;
          if (map['userId'] == userId) {
            keysToDelete.add(key.toString());
          }
        }
      }
      
      await _progressBox.deleteAll(keysToDelete);
    } catch (e) {
      throw Exception('Failed to clear reading progress: $e');
    }
  }
}
