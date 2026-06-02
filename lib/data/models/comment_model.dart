import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../domain/entities/comment.dart';

class CommentModel extends Comment {
  const CommentModel({
    required super.id,
    required super.storyId,
    required super.chapterId,
    required super.userId,
    required super.userName,
    required super.userPhotoUrl,
    required super.content,
    required super.parentId,
    required super.replyCount,
    required super.reactions,
    required super.isAuthorReply,
    required super.isEdited,
    required super.createdAt,
    required super.updatedAt,
  });

  factory CommentModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return CommentModel(
      id: doc.id,
      storyId: data['storyId'] ?? '',
      chapterId: data['chapterId'] ?? '',
      userId: data['userId'] ?? '',
      userName: data['userName'] ?? 'Anonymous',
      userPhotoUrl: data['userPhotoUrl'] ?? '',
      content: data['content'] ?? '',
      parentId: data['parentId'],
      replyCount: data['replyCount'] ?? 0,
      reactions: Map<String, int>.from(data['reactions'] ?? {}),
      isAuthorReply: data['isAuthorReply'] ?? false,
      isEdited: data['isEdited'] ?? false,
      createdAt: (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      updatedAt: (data['updatedAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'storyId': storyId,
      'chapterId': chapterId,
      'userId': userId,
      'userName': userName,
      'userPhotoUrl': userPhotoUrl,
      'content': content,
      'parentId': parentId,
      'replyCount': replyCount,
      'reactions': reactions,
      'isAuthorReply': isAuthorReply,
      'isEdited': isEdited,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }

  CommentModel copyWith({
    String? id,
    String? storyId,
    String? chapterId,
    String? userId,
    String? userName,
    String? userPhotoUrl,
    String? content,
    String? parentId,
    int? replyCount,
    Map<String, int>? reactions,
    bool? isAuthorReply,
    bool? isEdited,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return CommentModel(
      id: id ?? this.id,
      storyId: storyId ?? this.storyId,
      chapterId: chapterId ?? this.chapterId,
      userId: userId ?? this.userId,
      userName: userName ?? this.userName,
      userPhotoUrl: userPhotoUrl ?? this.userPhotoUrl,
      content: content ?? this.content,
      parentId: parentId ?? this.parentId,
      replyCount: replyCount ?? this.replyCount,
      reactions: reactions ?? this.reactions,
      isAuthorReply: isAuthorReply ?? this.isAuthorReply,
      isEdited: isEdited ?? this.isEdited,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  static CommentModel fromEntity(Comment comment) {
    return CommentModel(
      id: comment.id,
      storyId: comment.storyId,
      chapterId: comment.chapterId,
      userId: comment.userId,
      userName: comment.userName,
      userPhotoUrl: comment.userPhotoUrl,
      content: comment.content,
      parentId: comment.parentId,
      replyCount: comment.replyCount,
      reactions: comment.reactions,
      isAuthorReply: comment.isAuthorReply,
      isEdited: comment.isEdited,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    );
  }

  bool get isReply => parentId != null;
}
