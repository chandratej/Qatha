import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../domain/entities/reading_progress.dart';

class ReadingProgressModel extends ReadingProgress {
  const ReadingProgressModel({
    required super.id,
    required super.userId,
    required super.storyId,
    required super.chapterId,
    required super.chapterNumber,
    required super.progress,
    required super.lastReadPosition,
    required super.totalChapters,
    required super.completedChapters,
    required super.startedAt,
    required super.lastReadAt,
    required super.completedAt,
    required super.isCompleted,
    required super.sessionCount,
    required super.totalReadingTime,
    required super.highlights,
    required super.bookmarks,
    required super.notes,
  });

  factory ReadingProgressModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return ReadingProgressModel(
      id: doc.id,
      userId: data['userId'] ?? '',
      storyId: data['storyId'] ?? '',
      chapterId: data['chapterId'] ?? '',
      chapterNumber: data['chapterNumber'] ?? 0,
      progress: (data['progress'] ?? 0.0).toDouble(),
      lastReadPosition: data['lastReadPosition'] ?? 0,
      totalChapters: data['totalChapters'] ?? 0,
      completedChapters: List<int>.from(data['completedChapters'] ?? []),
      startedAt: (data['startedAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      lastReadAt: (data['lastReadAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      completedAt: (data['completedAt'] as Timestamp?)?.toDate(),
      isCompleted: data['isCompleted'] ?? false,
      sessionCount: data['sessionCount'] ?? 0,
      totalReadingTime: data['totalReadingTime'] ?? 0,
      highlights: List<Map<String, dynamic>>.from(data['highlights'] ?? []),
      bookmarks: List<Map<String, dynamic>>.from(data['bookmarks'] ?? []),
      notes: List<Map<String, dynamic>>.from(data['notes'] ?? []),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'userId': userId,
      'storyId': storyId,
      'chapterId': chapterId,
      'chapterNumber': chapterNumber,
      'progress': progress,
      'lastReadPosition': lastReadPosition,
      'totalChapters': totalChapters,
      'completedChapters': completedChapters,
      'startedAt': Timestamp.fromDate(startedAt),
      'lastReadAt': Timestamp.fromDate(lastReadAt),
      'completedAt': completedAt != null ? Timestamp.fromDate(completedAt!) : null,
      'isCompleted': isCompleted,
      'sessionCount': sessionCount,
      'totalReadingTime': totalReadingTime,
      'highlights': highlights,
      'bookmarks': bookmarks,
      'notes': notes,
    };
  }

  ReadingProgressModel copyWith({
    String? id,
    String? userId,
    String? storyId,
    String? chapterId,
    int? chapterNumber,
    double? progress,
    int? lastReadPosition,
    int? totalChapters,
    List<int>? completedChapters,
    DateTime? startedAt,
    DateTime? lastReadAt,
    DateTime? completedAt,
    bool? isCompleted,
    int? sessionCount,
    int? totalReadingTime,
    List<Map<String, dynamic>>? highlights,
    List<Map<String, dynamic>>? bookmarks,
    List<Map<String, dynamic>>? notes,
  }) {
    return ReadingProgressModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      storyId: storyId ?? this.storyId,
      chapterId: chapterId ?? this.chapterId,
      chapterNumber: chapterNumber ?? this.chapterNumber,
      progress: progress ?? this.progress,
      lastReadPosition: lastReadPosition ?? this.lastReadPosition,
      totalChapters: totalChapters ?? this.totalChapters,
      completedChapters: completedChapters ?? this.completedChapters,
      startedAt: startedAt ?? this.startedAt,
      lastReadAt: lastReadAt ?? this.lastReadAt,
      completedAt: completedAt ?? this.completedAt,
      isCompleted: isCompleted ?? this.isCompleted,
      sessionCount: sessionCount ?? this.sessionCount,
      totalReadingTime: totalReadingTime ?? this.totalReadingTime,
      highlights: highlights ?? this.highlights,
      bookmarks: bookmarks ?? this.bookmarks,
      notes: notes ?? this.notes,
    );
  }

  static ReadingProgressModel fromEntity(ReadingProgress progress) {
    return ReadingProgressModel(
      id: progress.id,
      userId: progress.userId,
      storyId: progress.storyId,
      chapterId: progress.chapterId,
      chapterNumber: progress.chapterNumber,
      progress: progress.progress,
      lastReadPosition: progress.lastReadPosition,
      totalChapters: progress.totalChapters,
      completedChapters: progress.completedChapters,
      startedAt: progress.startedAt,
      lastReadAt: progress.lastReadAt,
      completedAt: progress.completedAt,
      isCompleted: progress.isCompleted,
      sessionCount: progress.sessionCount,
      totalReadingTime: progress.totalReadingTime,
      highlights: progress.highlights,
      bookmarks: progress.bookmarks,
      notes: progress.notes,
    );
  }

  double get completionPercentage => (completedChapters.length / totalChapters) * 100;
  
  bool get shouldPromptForReview => progress >= 0.3 && !isCompleted;
}
