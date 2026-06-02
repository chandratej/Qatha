import 'package:cloud_firestore/cloud_firestore.dart';
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
  
  factory Review.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Review(
      id: doc.id,
      storyId: data['storyId'] ?? '',
      userId: data['userId'] ?? '',
      userName: data['userName'] ?? '',
      userPhotoUrl: data['userPhotoUrl'] ?? '',
      rating: data['rating'] ?? 5,
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
  
  Review copyWith({
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
    return Review(
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
}
