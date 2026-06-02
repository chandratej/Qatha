import '../../entities/story.dart';
import '../../entities/chapter.dart';

abstract class StoryRepository {
  Future<List<Story>> getStories({
    int limit = 20,
    String? cursor,
    List<String>? genres,
    String? leagueId,
    bool? isCompleted,
    String? sortBy,
  });
  
  Future<Story?> getStoryById(String storyId);
  Future<Story> createStory(Story story);
  Future<void> updateStory(Story story);
  Future<void> deleteStory(String storyId);
  
  Future<List<Chapter>> getChaptersForStory(String storyId, {int limit = 50});
  Future<Chapter?> getChapterById(String chapterId);
  Future<Chapter?> getChapterByNumber(String storyId, int chapterNumber);
  Future<Chapter> createChapter(Chapter chapter);
  Future<void> updateChapter(Chapter chapter);
  Future<void> deleteChapter(String chapterId);
  
  Future<void> incrementReadCount(String storyId);
  Future<void> updateRating(String storyId, double rating);
  Future<void> addToList(String listId, String storyId);
  Future<void> removeFromList(String listId, String storyId);
  
  Future<List<Story>> getFeaturedStories({int limit = 10});
  Future<List<Story>> getTrendingStories({int limit = 20});
  Future<List<Story>> getRecommendedStories(String userId, {int limit = 20});
  Future<List<Story>> getStoriesByAuthor(String authorId, {int limit = 50});
  Future<List<Story>> searchStories(String query, {int limit = 20});
}
