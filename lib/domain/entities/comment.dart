import 'package:equatable/equatable.dart';

class Comment extends Equatable {
  final String id;
  final String storyId;
  final String chapterId;
  final String userId;
  final String userName;
  final String userPhotoUrl;
  final String content;
  final String? parentId;
  final int replyCount;
  final Map<String, int> reactions;
  final bool isAuthorReply;
  final bool isEdited;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Comment({
    required this.id,
    required this.storyId,
    required this.chapterId,
    required this.userId,
    required this.userName,
    required this.userPhotoUrl,
    required this.content,
    this.parentId,
    required this.replyCount,
    required this.reactions,
    required this.isAuthorReply,
    required this.isEdited,
    required this.createdAt,
    required this.updatedAt,
  });

  @override
  List<Object?> get props => [
        id,
        storyId,
        chapterId,
        userId,
        userName,
        userPhotoUrl,
        content,
        parentId,
        replyCount,
        reactions,
        isAuthorReply,
        isEdited,
        createdAt,
        updatedAt,
      ];

  bool get isReply => parentId != null;
  
  bool get hasReactions => reactions.values.fold(0, (a, b) => a + b) > 0;
}
