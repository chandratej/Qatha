import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import '../../../domain/entities/user.dart' as domain;
import '../../../domain/repositories/user_repository.dart';

class UserModel extends domain.User {
  const UserModel({
    required super.id,
    required super.email,
    required super.displayName,
    required super.photoUrl,
    required super.userType,
    required super.createdAt,
    required super.subscriptionStatus,
    required super.subscriptionExpiry,
    required super.favoriteGenres,
    required super.followingAuthors,
    required super.bookmarkedStories,
    required super.readingHistory,
    required super.achievements,
    required super.badges,
    required super.readingStreak,
    required super.totalReadingTime,
    required super.storiesRead,
    required super.notificationsEnabled,
  });

  factory UserModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return UserModel(
      id: doc.id,
      email: data['email'] ?? '',
      displayName: data['displayName'] ?? 'Reader',
      photoUrl: data['photoUrl'] ?? '',
      userType: domain.UserType.values.firstWhere(
        (e) => e.name == data['userType'],
        orElse: () => domain.UserType.reader,
      ),
      createdAt: (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      subscriptionStatus: data['subscriptionStatus'] ?? 'free',
      subscriptionExpiry: (data['subscriptionExpiry'] as Timestamp?)?.toDate(),
      favoriteGenres: List<String>.from(data['favoriteGenres'] ?? []),
      followingAuthors: List<String>.from(data['followingAuthors'] ?? []),
      bookmarkedStories: List<String>.from(data['bookmarkedStories'] ?? []),
      readingHistory: List<String>.from(data['readingHistory'] ?? []),
      achievements: List<String>.from(data['achievements'] ?? []),
      badges: List<String>.from(data['badges'] ?? []),
      readingStreak: data['readingStreak'] ?? 0,
      totalReadingTime: data['totalReadingTime'] ?? 0,
      storiesRead: data['storiesRead'] ?? 0,
      notificationsEnabled: data['notificationsEnabled'] ?? true,
    );
  }

  factory UserModel.fromFirebaseUser(firebase_auth.User user) {
    return UserModel(
      id: user.uid,
      email: user.email ?? '',
      displayName: user.displayName ?? 'Reader',
      photoUrl: user.photoURL ?? '',
      userType: domain.UserType.reader,
      createdAt: DateTime.now(),
      subscriptionStatus: 'free',
      subscriptionExpiry: null,
      favoriteGenres: [],
      followingAuthors: [],
      bookmarkedStories: [],
      readingHistory: [],
      achievements: [],
      badges: [],
      readingStreak: 0,
      totalReadingTime: 0,
      storiesRead: 0,
      notificationsEnabled: true,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'email': email,
      'displayName': displayName,
      'photoUrl': photoUrl,
      'userType': userType.name,
      'createdAt': Timestamp.fromDate(createdAt),
      'subscriptionStatus': subscriptionStatus,
      'subscriptionExpiry': subscriptionExpiry != null 
          ? Timestamp.fromDate(subscriptionExpiry!) 
          : null,
      'favoriteGenres': favoriteGenres,
      'followingAuthors': followingAuthors,
      'bookmarkedStories': bookmarkedStories,
      'readingHistory': readingHistory,
      'achievements': achievements,
      'badges': badges,
      'readingStreak': readingStreak,
      'totalReadingTime': totalReadingTime,
      'storiesRead': storiesRead,
      'notificationsEnabled': notificationsEnabled,
    };
  }

  UserModel copyWith({
    String? id,
    String? email,
    String? displayName,
    String? photoUrl,
    UserType? userType,
    DateTime? createdAt,
    String? subscriptionStatus,
    DateTime? subscriptionExpiry,
    List<String>? favoriteGenres,
    List<String>? followingAuthors,
    List<String>? bookmarkedStories,
    List<String>? readingHistory,
    List<String>? achievements,
    List<String>? badges,
    int? readingStreak,
    int? totalReadingTime,
    int? storiesRead,
    bool? notificationsEnabled,
  }) {
    return UserModel(
      id: id ?? this.id,
      email: email ?? this.email,
      displayName: displayName ?? this.displayName,
      photoUrl: photoUrl ?? this.photoUrl,
      userType: userType ?? this.userType,
      createdAt: createdAt ?? this.createdAt,
      subscriptionStatus: subscriptionStatus ?? this.subscriptionStatus,
      subscriptionExpiry: subscriptionExpiry ?? this.subscriptionExpiry,
      favoriteGenres: favoriteGenres ?? this.favoriteGenres,
      followingAuthors: followingAuthors ?? this.followingAuthors,
      bookmarkedStories: bookmarkedStories ?? this.bookmarkedStories,
      readingHistory: readingHistory ?? this.readingHistory,
      achievements: achievements ?? this.achievements,
      badges: badges ?? this.badges,
      readingStreak: readingStreak ?? this.readingStreak,
      totalReadingTime: totalReadingTime ?? this.totalReadingTime,
      storiesRead: storiesRead ?? this.storiesRead,
      notificationsEnabled: notificationsEnabled ?? this.notificationsEnabled,
    );
  }
}
