import 'package:hive/hive.dart';
import 'package:storyverse/domain/entities/user.dart' as domain;
import '../../../core/constants/app_constants.dart';

/// Local data source for user caching
abstract class UserLocalDataSource {
  /// Gets current user from local storage
  Future<domain.User?> getCurrentUser();

  /// Caches a user locally
  Future<void> cacheUser(domain.User user);

  /// Gets a cached user by ID
  Future<domain.User?> getUserById(String userId);

  /// Clears user cache
  Future<void> clearCache();

  /// Removes a user from cache
  Future<void> removeUser(String userId);
}

class UserLocalDataSourceImpl implements UserLocalDataSource {
  final Box<dynamic> _userBox;

  UserLocalDataSourceImpl({required HiveInterface hive})
      : _userBox = hive.box(AppConstants.hiveUsersBox);

  @override
  Future<domain.User?> getCurrentUser() async {
    try {
      final data = _userBox.get(AppConstants.currentUserKey);
      if (data == null) return null;

      final map = data as Map<dynamic, dynamic>;
      return domain.User.fromMap(Map<String, dynamic>.from(map));
    } catch (e) {
      return null;
    }
  }

  @override
  Future<void> cacheUser(domain.User user) async {
    try {
      await _userBox.put(user.id, user.toMap());
      await _userBox.put(AppConstants.currentUserKey, user.toMap());
    } catch (e) {
      throw Exception('Failed to cache user: $e');
    }
  }

  @override
  Future<domain.User?> getUserById(String userId) async {
    try {
      final data = _userBox.get(userId);
      if (data == null) return null;

      final map = data as Map<dynamic, dynamic>;
      return domain.User.fromMap(Map<String, dynamic>.from(map));
    } catch (e) {
      return null;
    }
  }

  @override
  Future<void> clearCache() async {
    try {
      await _userBox.clear();
    } catch (e) {
      throw Exception('Failed to clear user cache: $e');
    }
  }

  @override
  Future<void> removeUser(String userId) async {
    try {
      await _userBox.delete(userId);
      final currentUser = await getCurrentUser();
      if (currentUser?.id == userId) {
        await _userBox.delete(AppConstants.currentUserKey);
      }
    } catch (e) {
      throw Exception('Failed to remove user: $e');
    }
  }
}
