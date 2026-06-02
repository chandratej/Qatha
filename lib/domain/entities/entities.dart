/// StoryVerse Domain Entities
/// 
/// Core business objects that represent the domain model

import 'package:equatable/equatable.dart';

/// User Types
enum UserType {
  reader,
  author,
  moderator,
  admin,
}

/// Subscription Status
enum SubscriptionStatus {
  none,
  trial,
  active,
  expired,
  cancelled,
}

/// League Entity - Represents a story league/tier
class League extends Equatable {
  final String id;
  final String name;
  final String description;
  final int order;
  final bool isPremium;
  final Map<String, dynamic> promotionRequirements;
  
  const League({
    required this.id,
    required this.name,
    required this.description,
    required this.order,
    required this.isPremium,
    required this.promotionRequirements,
  });

  factory League.fromJson(Map<String, dynamic> json) {
    return League(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      order: json['order'] as int,
      isPremium: json['isPremium'] as bool? ?? false,
      promotionRequirements: json['promotionRequirements'] as Map<String, dynamic>? ?? {},
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'order': order,
      'isPremium': isPremium,
      'promotionRequirements': promotionRequirements,
    };
  }

  @override
  List<Object?> get props => [id, name, description, order, isPremium];
}

/// User Entity
class User extends Equatable {
  final String id;
  final String email;
  final String displayName;
  final String? avatarUrl;
  final UserType userType;
  final SubscriptionStatus subscriptionStatus;
  final DateTime? subscriptionExpiryDate;
  final int readingStreak;
  final int totalStoriesRead;
  final int totalReviews;
  final List<String> followedAuthors;
  final List<String> bookmarkedStories;
  final Map<String, dynamic> preferences;
  final DateTime createdAt;
  final DateTime lastLoginAt;

  const User({
    required this.id,
    required this.email,
    required this.displayName,
    this.avatarUrl,
    this.userType = UserType.reader,
    this.subscriptionStatus = SubscriptionStatus.none,
    this.subscriptionExpiryDate,
    this.readingStreak = 0,
    this.totalStoriesRead = 0,
    this.totalReviews = 0,
    this.followedAuthors = const [],
    this.bookmarkedStories = const [],
    this.preferences = const {},
    required this.createdAt,
    required this.lastLoginAt,
  });

  bool get isPremium => subscriptionStatus == SubscriptionStatus.active;
  
  bool get isAuthor => userType == UserType.author || userType == UserType.admin;
  
  bool get isModerator => userType == UserType.moderator || userType == UserType.admin;
  
  bool get isAdmin => userType == UserType.admin;

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      displayName: json['displayName'] as String,
      avatarUrl: json['avatarUrl'] as String?,
      userType: UserType.values.firstWhere(
        (e) => e.toString() == 'UserType.${json['userType']}',
        orElse: () => UserType.reader,
      ),
      subscriptionStatus: SubscriptionStatus.values.firstWhere(
        (e) => e.toString() == 'SubscriptionStatus.${json['subscriptionStatus']}',
        orElse: () => SubscriptionStatus.none,
      ),
      subscriptionExpiryDate: json['subscriptionExpiryDate'] != null
          ? DateTime.parse(json['subscriptionExpiryDate'] as String)
          : null,
      readingStreak: json['readingStreak'] as int? ?? 0,
      totalStoriesRead: json['totalStoriesRead'] as int? ?? 0,
      totalReviews: json['totalReviews'] as int? ?? 0,
      followedAuthors: List<String>.from(json['followedAuthors'] ?? []),
      bookmarkedStories: List<String>.from(json['bookmarkedStories'] ?? []),
      preferences: json['preferences'] as Map<String, dynamic>? ?? {},
      createdAt: DateTime.parse(json['createdAt'] as String),
      lastLoginAt: DateTime.parse(json['lastLoginAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'displayName': displayName,
      'avatarUrl': avatarUrl,
      'userType': userType.toString().split('.').last,
      'subscriptionStatus': subscriptionStatus.toString().split('.').last,
      'subscriptionExpiryDate': subscriptionExpiryDate?.toIso8601String(),
      'readingStreak': readingStreak,
      'totalStoriesRead': totalStoriesRead,
      'totalReviews': totalReviews,
      'followedAuthors': followedAuthors,
      'bookmarkedStories': bookmarkedStories,
      'preferences': preferences,
      'createdAt': createdAt.toIso8601String(),
      'lastLoginAt': lastLoginAt.toIso8601String(),
    };
  }

  @override
  List<Object?> get props => [
        id,
        email,
        displayName,
        avatarUrl,
        userType,
        subscriptionStatus,
        readingStreak,
      ];
}

/// Author Entity
class Author extends Equatable {
  final String id;
  final String userId;
  final String penName;
  final String? bio;
  final String? avatarUrl;
  final String? bannerUrl;
  final List<String> genres;
  final int totalStories;
  final int totalFollowers;
  final int totalReads;
  final double averageRating;
  final List<String> achievements;
  final DateTime joinedAt;
  final Map<String, dynamic> socialLinks;

  const Author({
    required this.id,
    required this.userId,
    required this.penName,
    this.bio,
    this.avatarUrl,
    this.bannerUrl,
    this.genres = const [],
    this.totalStories = 0,
    this.totalFollowers = 0,
    this.totalReads = 0,
    this.averageRating = 0.0,
    this.achievements = const [],
    required this.joinedAt,
    this.socialLinks = const {},
  });

  factory Author.fromJson(Map<String, dynamic> json) {
    return Author(
      id: json['id'] as String,
      userId: json['userId'] as String,
      penName: json['penName'] as String,
      bio: json['bio'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      bannerUrl: json['bannerUrl'] as String?,
      genres: List<String>.from(json['genres'] ?? []),
      totalStories: json['totalStories'] as int? ?? 0,
      totalFollowers: json['totalFollowers'] as int? ?? 0,
      totalReads: json['totalReads'] as int? ?? 0,
      averageRating: (json['averageRating'] as num?)?.toDouble() ?? 0.0,
      achievements: List<String>.from(json['achievements'] ?? []),
      joinedAt: DateTime.parse(json['joinedAt'] as String),
      socialLinks: json['socialLinks'] as Map<String, dynamic>? ?? {},
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'penName': penName,
      'bio': bio,
      'avatarUrl': avatarUrl,
      'bannerUrl': bannerUrl,
      'genres': genres,
      'totalStories': totalStories,
      'totalFollowers': totalFollowers,
      'totalReads': totalReads,
      'averageRating': averageRating,
      'achievements': achievements,
      'joinedAt': joinedAt.toIso8601String(),
      'socialLinks': socialLinks,
    };
  }

  @override
  List<Object?> get props => [id, userId, penName, totalStories, totalFollowers];
}

/// Story Entity
class Story extends Equatable {
  final String id;
  final String title;
  final String description;
  final String authorId;
  final String authorName;
  final String coverImageUrl;
  final String leagueId;
  final List<String> genres;
  final List<String> tags;
  final int totalChapters;
  final int totalWords;
  final int estimatedReadingTimeMinutes;
  final bool isCompleted;
  final bool isPremium;
  final double rating;
  final int totalRatings;
  final int totalReads;
  final int totalComments;
  final int totalBookmarks;
  final double completionRate;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? lastPublishedAt;
  final Map<String, dynamic> statistics;

  const Story({
    required this.id,
    required this.title,
    required this.description,
    required this.authorId,
    required this.authorName,
    required this.coverImageUrl,
    required this.leagueId,
    this.genres = const [],
    this.tags = const [],
    this.totalChapters = 0,
    this.totalWords = 0,
    this.estimatedReadingTimeMinutes = 0,
    this.isCompleted = false,
    this.isPremium = false,
    this.rating = 0.0,
    this.totalRatings = 0,
    this.totalReads = 0,
    this.totalComments = 0,
    this.totalBookmarks = 0,
    this.completionRate = 0.0,
    required this.createdAt,
    required this.updatedAt,
    this.lastPublishedAt,
    this.statistics = const {},
  });

  bool get isInArchive => leagueId == 'archive';
  
  bool get isPremiumLeague => [
        'celebrated',
        'distinguished',
        'masterwork',
        'legendary',
        'hall_of_fame',
        'heritage',
        'classic',
        'timeless',
        'immortal',
      ].contains(leagueId);

  factory Story.fromJson(Map<String, dynamic> json) {
    return Story(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      authorId: json['authorId'] as String,
      authorName: json['authorName'] as String,
      coverImageUrl: json['coverImageUrl'] as String,
      leagueId: json['leagueId'] as String,
      genres: List<String>.from(json['genres'] ?? []),
      tags: List<String>.from(json['tags'] ?? []),
      totalChapters: json['totalChapters'] as int? ?? 0,
      totalWords: json['totalWords'] as int? ?? 0,
      estimatedReadingTimeMinutes: json['estimatedReadingTimeMinutes'] as int? ?? 0,
      isCompleted: json['isCompleted'] as bool? ?? false,
      isPremium: json['isPremium'] as bool? ?? false,
      rating: (json['rating'] as num?)?.toDouble() ?? 0.0,
      totalRatings: json['totalRatings'] as int? ?? 0,
      totalReads: json['totalReads'] as int? ?? 0,
      totalComments: json['totalComments'] as int? ?? 0,
      totalBookmarks: json['totalBookmarks'] as int? ?? 0,
      completionRate: (json['completionRate'] as num?)?.toDouble() ?? 0.0,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      lastPublishedAt: json['lastPublishedAt'] != null
          ? DateTime.parse(json['lastPublishedAt'] as String)
          : null,
      statistics: json['statistics'] as Map<String, dynamic>? ?? {},
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'authorId': authorId,
      'authorName': authorName,
      'coverImageUrl': coverImageUrl,
      'leagueId': leagueId,
      'genres': genres,
      'tags': tags,
      'totalChapters': totalChapters,
      'totalWords': totalWords,
      'estimatedReadingTimeMinutes': estimatedReadingTimeMinutes,
      'isCompleted': isCompleted,
      'isPremium': isPremium,
      'rating': rating,
      'totalRatings': totalRatings,
      'totalReads': totalReads,
      'totalComments': totalComments,
      'totalBookmarks': totalBookmarks,
      'completionRate': completionRate,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'lastPublishedAt': lastPublishedAt?.toIso8601String(),
      'statistics': statistics,
    };
  }

  @override
  List<Object?> get props => [
        id,
        title,
        authorId,
        leagueId,
        isCompleted,
        rating,
        totalReads,
      ];
}

/// Chapter Entity
class Chapter extends Equatable {
  final String id;
  final String storyId;
  final String title;
  final int chapterNumber;
  final String content;
  final int wordCount;
  final int estimatedReadingTimeMinutes;
  final bool isFree;
  final bool isPublished;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? publishedAt;
  final Map<String, dynamic> statistics;

  const Chapter({
    required this.id,
    required this.storyId,
    required this.title,
    required this.chapterNumber,
    required this.content,
    this.wordCount = 0,
    this.estimatedReadingTimeMinutes = 0,
    this.isFree = true,
    this.isPublished = false,
    required this.createdAt,
    required this.updatedAt,
    this.publishedAt,
    this.statistics = const {},
  });

  factory Chapter.fromJson(Map<String, dynamic> json) {
    return Chapter(
      id: json['id'] as String,
      storyId: json['storyId'] as String,
      title: json['title'] as String,
      chapterNumber: json['chapterNumber'] as int,
      content: json['content'] as String,
      wordCount: json['wordCount'] as int? ?? 0,
      estimatedReadingTimeMinutes: json['estimatedReadingTimeMinutes'] as int? ?? 0,
      isFree: json['isFree'] as bool? ?? true,
      isPublished: json['isPublished'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      publishedAt: json['publishedAt'] != null
          ? DateTime.parse(json['publishedAt'] as String)
          : null,
      statistics: json['statistics'] as Map<String, dynamic>? ?? {},
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'storyId': storyId,
      'title': title,
      'chapterNumber': chapterNumber,
      'content': content,
      'wordCount': wordCount,
      'estimatedReadingTimeMinutes': estimatedReadingTimeMinutes,
      'isFree': isFree,
      'isPublished': isPublished,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'publishedAt': publishedAt?.toIso8601String(),
      'statistics': statistics,
    };
  }

  @override
  List<Object?> get props => [id, storyId, chapterNumber, title, isPublished];
}

/// Review Entity
class Review extends Equatable {
  final String id;
  final String storyId;
  final String userId;
  final String userName;
  final String? userAvatarUrl;
  final double rating;
  final String content;
  final Map<String, int> reactions;
  final int helpfulCount;
  final bool isVerifiedPurchase;
  final double storyCompletionAtReview;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Review({
    required this.id,
    required this.storyId,
    required this.userId,
    required this.userName,
    this.userAvatarUrl,
    required this.rating,
    required this.content,
    this.reactions = const {},
    this.helpfulCount = 0,
    this.isVerifiedPurchase = false,
    this.storyCompletionAtReview = 0.0,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      id: json['id'] as String,
      storyId: json['storyId'] as String,
      userId: json['userId'] as String,
      userName: json['userName'] as String,
      userAvatarUrl: json['userAvatarUrl'] as String?,
      rating: (json['rating'] as num).toDouble(),
      content: json['content'] as String,
      reactions: Map<String, int>.from(json['reactions'] ?? {}),
      helpfulCount: json['helpfulCount'] as int? ?? 0,
      isVerifiedPurchase: json['isVerifiedPurchase'] as bool? ?? false,
      storyCompletionAtReview: (json['storyCompletionAtReview'] as num?)?.toDouble() ?? 0.0,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'storyId': storyId,
      'userId': userId,
      'userName': userName,
      'userAvatarUrl': userAvatarUrl,
      'rating': rating,
      'content': content,
      'reactions': reactions,
      'helpfulCount': helpfulCount,
      'isVerifiedPurchase': isVerifiedPurchase,
      'storyCompletionAtReview': storyCompletionAtReview,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  @override
  List<Object?> get props => [id, storyId, userId, rating, createdAt];
}

/// Comment Entity
class Comment extends Equatable {
  final String id;
  final String storyId;
  final String? chapterId;
  final String userId;
  final String userName;
  final String? userAvatarUrl;
  final String content;
  final Map<String, int> reactions;
  final int replyCount;
  final String? parentCommentId;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Comment({
    required this.id,
    required this.storyId,
    this.chapterId,
    required this.userId,
    required this.userName,
    this.userAvatarUrl,
    required this.content,
    this.reactions = const {},
    this.replyCount = 0,
    this.parentCommentId,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Comment.fromJson(Map<String, dynamic> json) {
    return Comment(
      id: json['id'] as String,
      storyId: json['storyId'] as String,
      chapterId: json['chapterId'] as String?,
      userId: json['userId'] as String,
      userName: json['userName'] as String,
      userAvatarUrl: json['userAvatarUrl'] as String?,
      content: json['content'] as String,
      reactions: Map<String, int>.from(json['reactions'] ?? {}),
      replyCount: json['replyCount'] as int? ?? 0,
      parentCommentId: json['parentCommentId'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'storyId': storyId,
      'chapterId': chapterId,
      'userId': userId,
      'userName': userName,
      'userAvatarUrl': userAvatarUrl,
      'content': content,
      'reactions': reactions,
      'replyCount': replyCount,
      'parentCommentId': parentCommentId,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  @override
  List<Object?> get props => [id, storyId, userId, createdAt];
}

/// Reading Progress Entity
class ReadingProgress extends Equatable {
  final String userId;
  final String storyId;
  final String? lastChapterId;
  final int lastChapterNumber;
  final double chapterProgress;
  final int totalChaptersRead;
  final double overallProgress;
  final int timeSpentSeconds;
  final DateTime startedAt;
  final DateTime lastReadAt;
  final DateTime? completedAt;

  const ReadingProgress({
    required this.userId,
    required this.storyId,
    this.lastChapterId,
    this.lastChapterNumber = 0,
    this.chapterProgress = 0.0,
    this.totalChaptersRead = 0,
    this.overallProgress = 0.0,
    this.timeSpentSeconds = 0,
    required this.startedAt,
    required this.lastReadAt,
    this.completedAt,
  });

  bool get isCompleted => completedAt != null;

  factory ReadingProgress.fromJson(Map<String, dynamic> json) {
    return ReadingProgress(
      userId: json['userId'] as String,
      storyId: json['storyId'] as String,
      lastChapterId: json['lastChapterId'] as String?,
      lastChapterNumber: json['lastChapterNumber'] as int? ?? 0,
      chapterProgress: (json['chapterProgress'] as num?)?.toDouble() ?? 0.0,
      totalChaptersRead: json['totalChaptersRead'] as int? ?? 0,
      overallProgress: (json['overallProgress'] as num?)?.toDouble() ?? 0.0,
      timeSpentSeconds: json['timeSpentSeconds'] as int? ?? 0,
      startedAt: DateTime.parse(json['startedAt'] as String),
      lastReadAt: DateTime.parse(json['lastReadAt'] as String),
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'storyId': storyId,
      'lastChapterId': lastChapterId,
      'lastChapterNumber': lastChapterNumber,
      'chapterProgress': chapterProgress,
      'totalChaptersRead': totalChaptersRead,
      'overallProgress': overallProgress,
      'timeSpentSeconds': timeSpentSeconds,
      'startedAt': startedAt.toIso8601String(),
      'lastReadAt': lastReadAt.toIso8601String(),
      'completedAt': completedAt?.toIso8601String(),
    };
  }

  @override
  List<Object?> get props => [userId, storyId, lastChapterId, overallProgress];
}
