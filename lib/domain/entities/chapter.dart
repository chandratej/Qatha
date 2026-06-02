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
}
