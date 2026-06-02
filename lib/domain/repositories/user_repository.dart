import '../../entities/user.dart';

abstract class UserRepository {
  Future<User?> getCurrentUser();
  Future<User> getUserById(String userId);
  Future<void> createUser(User user);
  Future<void> updateUser(User user);
  Future<void> deleteUser(String userId);
  Future<List<User>> getUsersByIds(List<String> userIds);
  Future<void> addBookmark(String userId, String storyId);
  Future<void> removeBookmark(String userId, String storyId);
  Future<void> addToReadingHistory(String userId, String storyId);
  Future<void> followAuthor(String userId, String authorId);
  Future<void> unfollowAuthor(String userId, String authorId);
  Future<void> addAchievement(String userId, String achievementId);
  Future<void> updateReadingStreak(String userId, int streak);
  Future<void> updateTotalReadingTime(String userId, int minutes);
  Future<void> incrementStoriesRead(String userId);
  Future<User> getProfile(String userId);
  Future<void> updateProfile(User user);
  Future<List<String>> getFollowingAuthors(String userId);
  Future<List<String>> getBookmarkedStories(String userId);
  Future<List<String>> getReadingHistory(String userId);
}
