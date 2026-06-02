import 'package:hive/hive.dart';
import '../../../domain/entities/user.dart';
import '../../core/constants/app_constants.dart';

abstract class AuthLocalDataSource {
  Future<void> cacheUser(User user);
  Future<User?> getCachedUser();
  Future<void> clearCache();
}

class AuthLocalDataSourceImpl implements AuthLocalDataSource {
  final Box<dynamic> _userBox;

  AuthLocalDataSourceImpl({required Box<dynamic> userBox}) 
      : _userBox = userBox;

  @override
  Future<void> cacheUser(User user) async {
    try {
      await _userBox.put(
        StorageKeys.currentUser,
        {
          'id': user.id,
          'email': user.email,
          'displayName': user.displayName,
          'photoUrl': user.photoUrl,
          'userType': user.userType.name,
          'subscriptionStatus': user.subscriptionStatus,
          'subscriptionExpiry': user.subscriptionExpiry?.toIso8601String(),
          'readingStreak': user.readingStreak,
          'storiesRead': user.storiesRead,
        },
      );
    } catch (e) {
      // Handle cache failure gracefully
      throw Exception('Failed to cache user: $e');
    }
  }

  @override
  Future<User?> getCachedUser() async {
    try {
      final userData = _userBox.get(StorageKeys.currentUser);
      
      if (userData == null) {
        return null;
      }
      
      return User(
        id: userData['id'] ?? '',
        email: userData['email'] ?? '',
        displayName: userData['displayName'] ?? 'Reader',
        photoUrl: userData['photoUrl'] ?? '',
        userType: UserType.values.firstWhere(
          (e) => e.name == userData['userType'],
          orElse: () => UserType.reader,
        ),
        createdAt: DateTime.now(),
        subscriptionStatus: userData['subscriptionStatus'] ?? 'free',
        subscriptionExpiry: userData['subscriptionExpiry'] != null
            ? DateTime.parse(userData['subscriptionExpiry'])
            : null,
        favoriteGenres: [],
        followingAuthors: [],
        bookmarkedStories: [],
        readingHistory: [],
        achievements: [],
        badges: [],
        readingStreak: userData['readingStreak'] ?? 0,
        totalReadingTime: 0,
        storiesRead: userData['storiesRead'] ?? 0,
        notificationsEnabled: true,
      );
    } catch (e) {
      return null;
    }
  }

  @override
  Future<void> clearCache() async {
    try {
      await _userBox.delete(StorageKeys.currentUser);
      await _userBox.delete(StorageKeys.authToken);
    } catch (e) {
      throw Exception('Failed to clear cache: $e');
    }
  }
}
