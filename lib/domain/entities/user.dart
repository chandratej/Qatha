import 'package:equatable/equatable.dart';

enum UserType {
  reader,
  author,
  moderator,
  admin,
}

class User extends Equatable {
  final String id;
  final String email;
  final String displayName;
  final String photoUrl;
  final UserType userType;
  final DateTime createdAt;
  final String subscriptionStatus;
  final DateTime? subscriptionExpiry;
  final List<String> favoriteGenres;
  final List<String> followingAuthors;
  final List<String> bookmarkedStories;
  final List<String> readingHistory;
  final List<String> achievements;
  final List<String> badges;
  final int readingStreak;
  final int totalReadingTime;
  final int storiesRead;
  final bool notificationsEnabled;

  const User({
    required this.id,
    required this.email,
    required this.displayName,
    required this.photoUrl,
    required this.userType,
    required this.createdAt,
    required this.subscriptionStatus,
    required this.subscriptionExpiry,
    required this.favoriteGenres,
    required this.followingAuthors,
    required this.bookmarkedStories,
    required this.readingHistory,
    required this.achievements,
    required this.badges,
    required this.readingStreak,
    required this.totalReadingTime,
    required this.storiesRead,
    required this.notificationsEnabled,
  });

  @override
  List<Object?> get props => [
        id,
        email,
        displayName,
        photoUrl,
        userType,
        createdAt,
        subscriptionStatus,
        subscriptionExpiry,
        favoriteGenres,
        followingAuthors,
        bookmarkedStories,
        readingHistory,
        achievements,
        badges,
        readingStreak,
        totalReadingTime,
        storiesRead,
        notificationsEnabled,
      ];

  bool get isPremium => 
      subscriptionStatus == 'active' || 
      subscriptionStatus == 'premium';
  
  bool get isAuthor => userType == UserType.author;
  
  bool get isModerator => userType == UserType.moderator;
  
  bool get isAdmin => userType == UserType.admin;
  
  bool get isNewUser => 
      DateTime.now().difference(createdAt).inDays <= 7;
}
