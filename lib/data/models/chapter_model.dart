import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../domain/entities/chapter.dart';

class ChapterModel extends Chapter {
  const ChapterModel({
    required super.id,
    required super.storyId,
    required super.title,
    required super.content,
    required super.chapterNumber,
    required super.wordCount,
    required super.readingTime,
    required super.isPremium,
    required super.unlockPrice,
    required super.audioUrl,
    required super.audioDuration,
    required super.createdAt,
    required super.updatedAt,
    required super.publishedAt,
    required super.viewCount,
    required super.completionCount,
    required super.averageRating,
    required super.commentCount,
  });

  factory ChapterModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return ChapterModel(
      id: doc.id,
      storyId: data['storyId'] ?? '',
      title: data['title'] ?? 'Untitled Chapter',
      content: data['content'] ?? '',
      chapterNumber: data['chapterNumber'] ?? 0,
      wordCount: data['wordCount'] ?? 0,
      readingTime: data['readingTime'] ?? 0,
      isPremium: data['isPremium'] ?? false,
      unlockPrice: data['unlockPrice'] ?? 0.0,
      audioUrl: data['audioUrl'] ?? '',
      audioDuration: data['audioDuration'] ?? 0,
      createdAt: (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      updatedAt: (data['updatedAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      publishedAt: (data['publishedAt'] as Timestamp?)?.toDate(),
      viewCount: data['viewCount'] ?? 0,
      completionCount: data['completionCount'] ?? 0,
      averageRating: (data['averageRating'] ?? 0.0).toDouble(),
      commentCount: data['commentCount'] ?? 0,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'storyId': storyId,
      'title': title,
      'content': content,
      'chapterNumber': chapterNumber,
      'wordCount': wordCount,
      'readingTime': readingTime,
      'isPremium': isPremium,
      'unlockPrice': unlockPrice,
      'audioUrl': audioUrl,
      'audioDuration': audioDuration,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
      'publishedAt': publishedAt != null ? Timestamp.fromDate(publishedAt!) : null,
      'viewCount': viewCount,
      'completionCount': completionCount,
      'averageRating': averageRating,
      'commentCount': commentCount,
    };
  }

  ChapterModel copyWith({
    String? id,
    String? storyId,
    String? title,
    String? content,
    int? chapterNumber,
    int? wordCount,
    int? readingTime,
    bool? isPremium,
    double? unlockPrice,
    String? audioUrl,
    int? audioDuration,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? publishedAt,
    int? viewCount,
    int? completionCount,
    double? averageRating,
    int? commentCount,
  }) {
    return ChapterModel(
      id: id ?? this.id,
      storyId: storyId ?? this.storyId,
      title: title ?? this.title,
      content: content ?? this.content,
      chapterNumber: chapterNumber ?? this.chapterNumber,
      wordCount: wordCount ?? this.wordCount,
      readingTime: readingTime ?? this.readingTime,
      isPremium: isPremium ?? this.isPremium,
      unlockPrice: unlockPrice ?? this.unlockPrice,
      audioUrl: audioUrl ?? this.audioUrl,
      audioDuration: audioDuration ?? this.audioDuration,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      publishedAt: publishedAt ?? this.publishedAt,
      viewCount: viewCount ?? this.viewCount,
      completionCount: completionCount ?? this.completionCount,
      averageRating: averageRating ?? this.averageRating,
      commentCount: commentCount ?? this.commentCount,
    );
  }

  static ChapterModel fromEntity(Chapter chapter) {
    return ChapterModel(
      id: chapter.id,
      storyId: chapter.storyId,
      title: chapter.title,
      content: chapter.content,
      chapterNumber: chapter.chapterNumber,
      wordCount: chapter.wordCount,
      readingTime: chapter.readingTime,
      isPremium: chapter.isPremium,
      unlockPrice: chapter.unlockPrice,
      audioUrl: chapter.audioUrl,
      audioDuration: chapter.audioDuration,
      createdAt: chapter.createdAt,
      updatedAt: chapter.updatedAt,
      publishedAt: chapter.publishedAt,
      viewCount: chapter.viewCount,
      completionCount: chapter.completionCount,
      averageRating: chapter.averageRating,
      commentCount: chapter.commentCount,
    );
  }
}
