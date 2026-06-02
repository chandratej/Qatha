import 'package:equatable/equatable.dart';

class ReadingProgress extends Equatable {
  final String id;
  final String userId;
  final String storyId;
  final String chapterId;
  final int chapterNumber;
  final double progress;
  final int lastReadPosition;
  final int totalChapters;
  final List<int> completedChapters;
  final DateTime startedAt;
  final DateTime lastReadAt;
  final DateTime? completedAt;
  final bool isCompleted;
  final int sessionCount;
  final int totalReadingTime;
  final List<Map<String, dynamic>> highlights;
  final List<Map<String, dynamic>> bookmarks;
  final List<Map<String, dynamic>> notes;

  const ReadingProgress({
    required this.id,
    required this.userId,
    required this.storyId,
    required this.chapterId,
    required this.chapterNumber,
    required this.progress,
    required this.lastReadPosition,
    required this.totalChapters,
    required this.completedChapters,
    required this.startedAt,
    required this.lastReadAt,
    required this.completedAt,
    required this.isCompleted,
    required this.sessionCount,
    required this.totalReadingTime,
    required this.highlights,
    required this.bookmarks,
    required this.notes,
  });

  @override
  List<Object?> get props => [
        id,
        userId,
        storyId,
        chapterId,
        chapterNumber,
        progress,
        lastReadPosition,
        totalChapters,
        completedChapters,
        startedAt,
        lastReadAt,
        completedAt,
        isCompleted,
        sessionCount,
        totalReadingTime,
        highlights,
        bookmarks,
        notes,
      ];

  double get completionPercentage => 
      totalChapters > 0 ? (completedChapters.length / totalChapters) * 100 : 0;
  
  bool get shouldPromptForReview => progress >= 0.3 && !isCompleted;
  
  bool get isActive => !isCompleted && lastReadAt.difference(DateTime.now()).inDays <= 30;
}
