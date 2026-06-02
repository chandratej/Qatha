import 'package:equatable/equatable.dart';

class Review extends Equatable {
  final String id;
  final String storyId;
  final String userId;
  final String userName;
  final String userPhotoUrl;
  final int rating;
  final String title;
  final String content;
  final Map<String, int> reactions;
  final int replyCount;
  final int helpfulCount;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool isVerifiedPurchase;
  final double readingProgress;

  const Review({
    required this.id,
    required this.storyId,
    required this.userId,
    required this.userName,
    required this.userPhotoUrl,
    required this.rating,
    required this.title,
    required this.content,
    required this.reactions,
    required this.replyCount,
    required this.helpfulCount,
    required this.createdAt,
    required this.updatedAt,
    required this.isVerifiedPurchase,
    required this.readingProgress,
  });

  @override
  List<Object?> get props => [
        id,
        storyId,
        userId,
        userName,
        userPhotoUrl,
        rating,
        title,
        content,
        reactions,
        replyCount,
        helpfulCount,
        createdAt,
        updatedAt,
        isVerifiedPurchase,
        readingProgress,
      ];

  bool get isEligible => readingProgress >= 0.3;
  
  bool get hasReactions => reactions.values.fold(0, (a, b) => a + b) > 0;
}
