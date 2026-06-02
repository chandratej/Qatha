import 'package:equatable/equatable.dart';

enum StoryStatus {
  draft,
  ongoing,
  completed,
  hiatus,
  archived,
}

class StoryMetrics extends Equatable {
  final double completionRate;
  final double readerRetention;
  final int reReads;
  final double sessionDuration;
  final int uniqueReaders;
  final double growthRate;
  final Map<String, dynamic> engagementData;

  const StoryMetrics({
    required this.completionRate,
    required this.readerRetention,
    required this.reReads,
    required this.sessionDuration,
    required this.uniqueReaders,
    required this.growthRate,
    required this.engagementData,
  });

  factory StoryMetrics.empty() {
    return const StoryMetrics(
      completionRate: 0.0,
      readerRetention: 0.0,
      reReads: 0,
      sessionDuration: 0.0,
      uniqueReaders: 0,
      growthRate: 0.0,
      engagementData: {},
    );
  }

  factory StoryMetrics.fromMap(Map<String, dynamic> map) {
    return StoryMetrics(
      completionRate: (map['completionRate'] ?? 0.0).toDouble(),
      readerRetention: (map['readerRetention'] ?? 0.0).toDouble(),
      reReads: map['reReads'] ?? 0,
      sessionDuration: (map['sessionDuration'] ?? 0.0).toDouble(),
      uniqueReaders: map['uniqueReaders'] ?? 0,
      growthRate: (map['growthRate'] ?? 0.0).toDouble(),
      engagementData: Map<String, dynamic>.from(map['engagementData'] ?? {}),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'completionRate': completionRate,
      'readerRetention': readerRetention,
      'reReads': reReads,
      'sessionDuration': sessionDuration,
      'uniqueReaders': uniqueReaders,
      'growthRate': growthRate,
      'engagementData': engagementData,
    };
  }

  @override
  List<Object?> get props => [
        completionRate,
        readerRetention,
        reReads,
        sessionDuration,
        uniqueReaders,
        growthRate,
        engagementData,
      ];
}

class Story extends Equatable {
  final String id;
  final String title;
  final String description;
  final String authorId;
  final String authorName;
  final String coverUrl;
  final List<String> genres;
  final List<String> tags;
  final String league;
  final StoryStatus status;
  final String language;
  final int wordCount;
  final int chapterCount;
  final int readerCount;
  final double completionRate;
  final double averageRating;
  final int ratingCount;
  final int reviewCount;
  final int favoriteCount;
  final int commentCount;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? publishedAt;
  final DateTime? lastReadAt;
  final bool isPremium;
  final double unlockPrice;
  final bool audioAvailable;
  final double qualityScore;
  final List<String> promotionHistory;
  final StoryMetrics metrics;

  const Story({
    required this.id,
    required this.title,
    required this.description,
    required this.authorId,
    required this.authorName,
    required this.coverUrl,
    required this.genres,
    required this.tags,
    required this.league,
    required this.status,
    required this.language,
    required this.wordCount,
    required this.chapterCount,
    required this.readerCount,
    required this.completionRate,
    required this.averageRating,
    required this.ratingCount,
    required this.reviewCount,
    required this.favoriteCount,
    required this.commentCount,
    required this.createdAt,
    required this.updatedAt,
    required this.publishedAt,
    required this.lastReadAt,
    required this.isPremium,
    required this.unlockPrice,
    required this.audioAvailable,
    required this.qualityScore,
    required this.promotionHistory,
    required this.metrics,
  });

  @override
  List<Object?> get props => [
        id,
        title,
        description,
        authorId,
        authorName,
        coverUrl,
        genres,
        tags,
        league,
        status,
        language,
        wordCount,
        chapterCount,
        readerCount,
        completionRate,
        averageRating,
        ratingCount,
        reviewCount,
        favoriteCount,
        commentCount,
        createdAt,
        updatedAt,
        publishedAt,
        lastReadAt,
        isPremium,
        unlockPrice,
        audioAvailable,
        qualityScore,
        promotionHistory,
        metrics,
      ];

  bool get isPublished => status == StoryStatus.ongoing || 
                          status == StoryStatus.completed;
  
  bool get isInArchive => league == 'archive';
  
  bool get hasAudio => audioAvailable;
  
  int get estimatedReadingTimeMinutes => (wordCount / 200).round();
  
  String get readingTimeText {
    final minutes = estimatedReadingTimeMinutes;
    if (minutes < 60) return '$minutes min read';
    final hours = minutes ~/ 60;
    final remainingMinutes = minutes % 60;
    return '$hours hr ${remainingMinutes > 0 ? '$remainingMinutes min' : ''} read';
  }
}
