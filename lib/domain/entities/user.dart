import 'package:cloud_firestore/cloud_firestore.dart';
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

  factory User.fromMap(Map<String, dynamic> map) {
    return User(
      id: map['id'] ?? '',
      email: map['email'] ?? '',
      displayName: map['displayName'] ?? '',
      photoUrl: map['photoUrl'] ?? '',
      userType: UserType.values.firstWhere(
        (e) => e.name == map['userType'],
        orElse: () => UserType.reader,
      ),
      createdAt: (map['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      subscriptionStatus: map['subscriptionStatus'] ?? 'free',
      subscriptionExpiry: (map['subscriptionExpiry'] as Timestamp?)?.toDate(),
      favoriteGenres: List<String>.from(map['favoriteGenres'] ?? []),
      followingAuthors: List<String>.from(map['followingAuthors'] ?? []),
      bookmarkedStories: List<String>.from(map['bookmarkedStories'] ?? []),
      readingHistory: List<String>.from(map['readingHistory'] ?? []),
      achievements: List<String>.from(map['achievements'] ?? []),
      badges: List<String>.from(map['badges'] ?? []),
      readingStreak: map['readingStreak'] ?? 0,
      totalReadingTime: map['totalReadingTime'] ?? 0,
      storiesRead: map['storiesRead'] ?? 0,
      notificationsEnabled: map['notificationsEnabled'] ?? true,
    );
  }

  factory User.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return User.fromMap({...data, id: doc.id});
  }

  User copyWith({
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
    return User(
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
