import 'package:equatable/equatable.dart';

class Chapter extends Equatable {
  final String id;
  final String storyId;
  final String title;
  final String content;
  final int chapterNumber;
  final int wordCount;
  final int readingTime;
  final bool isPremium;
  final double unlockPrice;
  final String audioUrl;
  final int audioDuration;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? publishedAt;
  final int viewCount;
  final int completionCount;
  final double averageRating;
  final int commentCount;

  const Chapter({
    required this.id,
    required this.storyId,
    required this.title,
    required this.content,
    required this.chapterNumber,
    required this.wordCount,
    required this.readingTime,
    required this.isPremium,
    required this.unlockPrice,
    required this.audioUrl,
    required this.audioDuration,
    required this.createdAt,
    required this.updatedAt,
    required this.publishedAt,
    required this.viewCount,
    required this.completionCount,
    required this.averageRating,
    required this.commentCount,
  });

  @override
  List<Object?> get props => [
        id,
        storyId,
        title,
        content,
        chapterNumber,
        wordCount,
        readingTime,
        isPremium,
        unlockPrice,
        audioUrl,
        audioDuration,
        createdAt,
        updatedAt,
        publishedAt,
        viewCount,
        completionCount,
        averageRating,
        commentCount,
      ];

  bool get isPublished => publishedAt != null;
  
  bool get hasAudio => audioUrl.isNotEmpty;
  
  double get estimatedReadingTimeMinutes => readingTime / 200;
  
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
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'publishedAt': publishedAt?.toIso8601String(),
      'viewCount': viewCount,
      'completionCount': completionCount,
      'averageRating': averageRating,
      'commentCount': commentCount,
    };
  }
  
  factory Chapter.fromMap(Map<String, dynamic> map, {String? documentId}) {
    return Chapter(
      id: documentId ?? map['id'] as String,
      storyId: map['storyId'] as String,
      title: map['title'] as String,
      content: map['content'] as String,
      chapterNumber: map['chapterNumber'] as int,
      wordCount: map['wordCount'] as int,
      readingTime: map['readingTime'] as int,
      isPremium: map['isPremium'] as bool? ?? false,
      unlockPrice: (map['unlockPrice'] as num?)?.toDouble() ?? 0.0,
      audioUrl: map['audioUrl'] as String? ?? '',
      audioDuration: map['audioDuration'] as int? ?? 0,
      createdAt: DateTime.parse(map['createdAt'] as String),
      updatedAt: DateTime.parse(map['updatedAt'] as String),
      publishedAt: map['publishedAt'] != null 
          ? DateTime.parse(map['publishedAt'] as String) 
          : null,
      viewCount: map['viewCount'] as int? ?? 0,
      completionCount: map['completionCount'] as int? ?? 0,
      averageRating: (map['averageRating'] as num?)?.toDouble() ?? 0.0,
      commentCount: map['commentCount'] as int? ?? 0,
    );
  }
  
  Chapter copyWith({
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
    return Chapter(
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
}
