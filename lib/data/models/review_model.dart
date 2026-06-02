import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../domain/entities/review.dart';

class ReviewModel extends Review {
  const ReviewModel({
    required super.id,
    required super.storyId,
    required super.userId,
    required super.userName,
    required super.userPhotoUrl,
    required super.rating,
    required super.title,
    required super.content,
    required super.reactions,
    required super.replyCount,
    required super.helpfulCount,
    required super.createdAt,
    required super.updatedAt,
    required super.isVerifiedPurchase,
    required super.readingProgress,
  });

  factory ReviewModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return ReviewModel(
      id: doc.id,
      storyId: data['storyId'] ?? '',
      userId: data['userId'] ?? '',
      userName: data['userName'] ?? 'Anonymous',
      userPhotoUrl: data['userPhotoUrl'] ?? '',
      rating: (data['rating'] ?? 0).toInt(),
      title: data['title'] ?? '',
      content: data['content'] ?? '',
      reactions: Map<String, int>.from(data['reactions'] ?? {}),
      replyCount: data['replyCount'] ?? 0,
      helpfulCount: data['helpfulCount'] ?? 0,
      createdAt: (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      updatedAt: (data['updatedAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      isVerifiedPurchase: data['isVerifiedPurchase'] ?? false,
      readingProgress: (data['readingProgress'] ?? 0.0).toDouble(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'storyId': storyId,
      'userId': userId,
      'userName': userName,
      'userPhotoUrl': userPhotoUrl,
      'rating': rating,
      'title': title,
      'content': content,
      'reactions': reactions,
      'replyCount': replyCount,
      'helpfulCount': helpfulCount,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
      'isVerifiedPurchase': isVerifiedPurchase,
      'readingProgress': readingProgress,
    };
  }

  ReviewModel copyWith({
    String? id,
    String? storyId,
    String? userId,
    String? userName,
    String? userPhotoUrl,
    int? rating,
    String? title,
    String? content,
    Map<String, int>? reactions,
    int? replyCount,
    int? helpfulCount,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? isVerifiedPurchase,
    double? readingProgress,
  }) {
    return ReviewModel(
      id: id ?? this.id,
      storyId: storyId ?? this.storyId,
      userId: userId ?? this.userId,
      userName: userName ?? this.userName,
      userPhotoUrl: userPhotoUrl ?? this.userPhotoUrl,
      rating: rating ?? this.rating,
      title: title ?? this.title,
      content: content ?? this.content,
      reactions: reactions ?? this.reactions,
      replyCount: replyCount ?? this.replyCount,
      helpfulCount: helpfulCount ?? this.helpfulCount,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isVerifiedPurchase: isVerifiedPurchase ?? this.isVerifiedPurchase,
      readingProgress: readingProgress ?? this.readingProgress,
    );
  }

  static ReviewModel fromEntity(Review review) {
    return ReviewModel(
      id: review.id,
      storyId: review.storyId,
      userId: review.userId,
      userName: review.userName,
      userPhotoUrl: review.userPhotoUrl,
      rating: review.rating,
      title: review.title,
      content: review.content,
      reactions: review.reactions,
      replyCount: review.replyCount,
      helpfulCount: review.helpfulCount,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      isVerifiedPurchase: review.isVerifiedPurchase,
      readingProgress: review.readingProgress,
    );
  }

  bool get isEligible => readingProgress >= 0.3;
}
