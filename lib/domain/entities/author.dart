import 'package:equatable/equatable.dart';

class Author extends Equatable {
  final String id;
  final String userId;
  final String penName;
  final String bio;
  final String photoUrl;
  final String coverImageUrl;
  final List<String> genres;
  final int storyCount;
  final int followerCount;
  final int totalReads;
  final double averageRating;
  final double totalRevenue;
  final List<String> achievements;
  final List<String> badges;
  final Map<String, String> socialLinks;
  final bool isVerified;
  final DateTime joinedAt;
  final DateTime lastActiveAt;
  final bool isActive;

  const Author({
    required this.id,
    required this.userId,
    required this.penName,
    required this.bio,
    required this.photoUrl,
    required this.coverImageUrl,
    required this.genres,
    required this.storyCount,
    required this.followerCount,
    required this.totalReads,
    required this.averageRating,
    required this.totalRevenue,
    required this.achievements,
    required this.badges,
    required this.socialLinks,
    required this.isVerified,
    required this.joinedAt,
    required this.lastActiveAt,
    required this.isActive,
  });

  @override
  List<Object?> get props => [
        id,
        userId,
        penName,
        bio,
        photoUrl,
        coverImageUrl,
        genres,
        storyCount,
        followerCount,
        totalReads,
        averageRating,
        totalRevenue,
        achievements,
        badges,
        socialLinks,
        isVerified,
        joinedAt,
        lastActiveAt,
        isActive,
      ];

  bool get isPopular => followerCount >= 1000;
  
  bool get isProlific => storyCount >= 5;
  
  bool get isTopRated => averageRating >= 4.5;
}
