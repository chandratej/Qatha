import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:storyverse/domain/entities/user.dart' as domain;
import 'package:storyverse/domain/repositories/user_repository.dart';
import 'package:storyverse/data/datasources/user_remote_data_source.dart';
import 'package:storyverse/data/datasources/user_local_data_source.dart';

class UserRepositoryImpl implements UserRepository {
  final UserRemoteDataSource remoteDataSource;
  final UserLocalDataSource localDataSource;
  final FirebaseFirestore firestore;

  UserRepositoryImpl({
    required this.remoteDataSource,
    required this.localDataSource,
    required this.firestore,
  });

  @override
  Future<domain.User?> getCurrentUser() async {
    try {
      final localUser = await localDataSource.getCurrentUser();
      if (localUser != null) return localUser;

      // Fallback to remote if not in local storage
      final remoteUser = await remoteDataSource.getUserById(localUser?.id ?? '');
      if (remoteUser != null) {
        await localDataSource.cacheUser(remoteUser);
        return remoteUser;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  @override
  Future<domain.User?> getUserById(String userId) async {
    try {
      final localUser = await localDataSource.getUserById(userId);
      if (localUser != null) return localUser;

      final remoteUser = await remoteDataSource.getUserById(userId);
      if (remoteUser != null) {
        await localDataSource.cacheUser(remoteUser);
        return remoteUser;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  @override
  Future<void> createUser(domain.User user) async {
    await remoteDataSource.createUser(user);
    await localDataSource.cacheUser(user);
  }

  @override
  Future<void> updateUser(domain.User user) async {
    await remoteDataSource.updateUser(user);
    await localDataSource.cacheUser(user);
  }

  @override
  Future<void> cacheUser(domain.User user) async {
    await localDataSource.cacheUser(user);
  }

  @override
  Future<List<domain.User>> searchUsers(String query) async {
    return await remoteDataSource.searchUsers(query);
  }

  @override
  Future<void> followAuthor(String userId, String authorId) async {
    final user = await getCurrentUser();
    if (user == null) throw Exception('User not logged in');

    final updatedUser = user.copyWith(
      followingAuthors: [...user.followingAuthors, authorId],
    );
    await updateUser(updatedUser);
  }

  @override
  Future<void> bookmarkStory(String userId, String storyId) async {
    final user = await getCurrentUser();
    if (user == null) throw Exception('User not logged in');

    final updatedUser = user.copyWith(
      bookmarkedStories: [...user.bookmarkedStories, storyId],
    );
    await updateUser(updatedUser);
  }

  @override
  Future<void> addToReadingHistory(String userId, String storyId) async {
    final user = await getCurrentUser();
    if (user == null) throw Exception('User not logged in');

    var history = List<String>.from(user.readingHistory);
    if (!history.contains(storyId)) {
      history.insert(0, storyId);
      if (history.length > 100) history = history.sublist(0, 100);
    }

    final updatedUser = user.copyWith(readingHistory: history);
    await updateUser(updatedUser);
  }

  @override
  Future<void> incrementReadingStreak(String userId) async {
    final user = await getCurrentUser();
    if (user == null) throw Exception('User not logged in');

    final updatedUser = user.copyWith(
      readingStreak: user.readingStreak + 1,
      totalReadingTime: user.totalReadingTime + 1, // Simplified: add 1 minute
    );
    await updateUser(updatedUser);
  }

  @override
  Future<void> clearCache() async {
    await localDataSource.clearCache();
  }
}
