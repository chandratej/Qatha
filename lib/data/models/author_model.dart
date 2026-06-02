import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../domain/entities/author.dart';

class AuthorModel extends Author {
  const AuthorModel({
    required super.id,
    required super.userId,
    required super.penName,
    required super.bio,
    required super.photoUrl,
    required super.coverImageUrl,
    required super.genres,
    required super.storyCount,
    required super.followerCount,
    required super.totalReads,
    required super.averageRating,
    required super.totalRevenue,
    required super.achievements,
    required super.badges,
    required super.socialLinks,
    required super.isVerified,
    required super.joinedAt,
    required super.lastActiveAt,
    required super.isActive,
  });

  factory AuthorModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return AuthorModel(
      id: doc.id,
      userId: data['userId'] ?? '',
      penName: data['penName'] ?? 'Anonymous Author',
      bio: data['bio'] ?? '',
      photoUrl: data['photoUrl'] ?? '',
      coverImageUrl: data['coverImageUrl'] ?? '',
      genres: List<String>.from(data['genres'] ?? []),
      storyCount: data['storyCount'] ?? 0,
      followerCount: data['followerCount'] ?? 0,
      totalReads: data['totalReads'] ?? 0,
      averageRating: (data['averageRating'] ?? 0.0).toDouble(),
      totalRevenue: (data['totalRevenue'] ?? 0.0).toDouble(),
      achievements: List<String>.from(data['achievements'] ?? []),
      badges: List<String>.from(data['badges'] ?? []),
      socialLinks: Map<String, String>.from(data['socialLinks'] ?? {}),
      isVerified: data['isVerified'] ?? false,
      joinedAt: (data['joinedAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      lastActiveAt: (data['lastActiveAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      isActive: data['isActive'] ?? true,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'userId': userId,
      'penName': penName,
      'bio': bio,
      'photoUrl': photoUrl,
      'coverImageUrl': coverImageUrl,
      'genres': genres,
      'storyCount': storyCount,
      'followerCount': followerCount,
      'totalReads': totalReads,
      'averageRating': averageRating,
      'totalRevenue': totalRevenue,
      'achievements': achievements,
      'badges': badges,
      'socialLinks': socialLinks,
      'isVerified': isVerified,
      'joinedAt': Timestamp.fromDate(joinedAt),
      'lastActiveAt': Timestamp.fromDate(lastActiveAt),
      'isActive': isActive,
    };
  }

  AuthorModel copyWith({
    String? id,
    String? userId,
    String? penName,
    String? bio,
    String? photoUrl,
    String? coverImageUrl,
    List<String>? genres,
    int? storyCount,
    int? followerCount,
    int? totalReads,
    double? averageRating,
    double? totalRevenue,
    List<String>? achievements,
    List<String>? badges,
    Map<String, String>? socialLinks,
    bool? isVerified,
    DateTime? joinedAt,
    DateTime? lastActiveAt,
    bool? isActive,
  }) {
    return AuthorModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      penName: penName ?? this.penName,
      bio: bio ?? this.bio,
      photoUrl: photoUrl ?? this.photoUrl,
      coverImageUrl: coverImageUrl ?? this.coverImageUrl,
      genres: genres ?? this.genres,
      storyCount: storyCount ?? this.storyCount,
      followerCount: followerCount ?? this.followerCount,
      totalReads: totalReads ?? this.totalReads,
      averageRating: averageRating ?? this.averageRating,
      totalRevenue: totalRevenue ?? this.totalRevenue,
      achievements: achievements ?? this.achievements,
      badges: badges ?? this.badges,
      socialLinks: socialLinks ?? this.socialLinks,
      isVerified: isVerified ?? this.isVerified,
      joinedAt: joinedAt ?? this.joinedAt,
      lastActiveAt: lastActiveAt ?? this.lastActiveAt,
      isActive: isActive ?? this.isActive,
    );
  }

  static AuthorModel fromEntity(Author author) {
    return AuthorModel(
      id: author.id,
      userId: author.userId,
      penName: author.penName,
      bio: author.bio,
      photoUrl: author.photoUrl,
      coverImageUrl: author.coverImageUrl,
      genres: author.genres,
      storyCount: author.storyCount,
      followerCount: author.followerCount,
      totalReads: author.totalReads,
      averageRating: author.averageRating,
      totalRevenue: author.totalRevenue,
      achievements: author.achievements,
      badges: author.badges,
      socialLinks: author.socialLinks,
      isVerified: author.isVerified,
      joinedAt: author.joinedAt,
      lastActiveAt: author.lastActiveAt,
      isActive: author.isActive,
    );
  }

  String get displayGenres => genres.take(3).join(', ');
  
  bool get hasMultipleStories => storyCount > 1;
}
