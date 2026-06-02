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
  final String leagueId;
  final StoryStatus status;
  final bool isCompleted;
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
    required this.leagueId,
    required this.status,
    required this.isCompleted,
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
  
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'authorId': authorId,
      'authorName': authorName,
      'coverUrl': coverUrl,
      'genres': genres,
      'tags': tags,
      'leagueId': leagueId,
      'status': status.name,
      'isCompleted': isCompleted,
      'language': language,
      'wordCount': wordCount,
      'chapterCount': chapterCount,
      'readerCount': readerCount,
      'completionRate': completionRate,
      'averageRating': averageRating,
      'ratingCount': ratingCount,
      'reviewCount': reviewCount,
      'favoriteCount': favoriteCount,
      'commentCount': commentCount,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'publishedAt': publishedAt?.toIso8601String(),
      'lastReadAt': lastReadAt?.toIso8601String(),
      'isPremium': isPremium,
      'unlockPrice': unlockPrice,
      'audioAvailable': audioAvailable,
      'qualityScore': qualityScore,
      'promotionHistory': promotionHistory,
      'metrics': metrics.toMap(),
    };
  }
  
  factory Story.fromMap(Map<String, dynamic> map, {String? documentId}) {
    return Story(
      id: documentId ?? map['id'] as String,
      title: map['title'] as String,
      description: map['description'] as String,
      authorId: map['authorId'] as String,
      authorName: map['authorName'] as String,
      coverUrl: map['coverUrl'] as String,
      genres: List<String>.from(map['genres'] ?? []),
      tags: List<String>.from(map['tags'] ?? []),
      leagueId: map['leagueId'] as String? ?? 'manuscript',
      status: StoryStatus.values.firstWhere(
        (e) => e.name == map['status'],
        orElse: () => StoryStatus.draft,
      ),
      isCompleted: map['isCompleted'] as bool? ?? false,
      language: map['language'] as String? ?? 'en',
      wordCount: map['wordCount'] as int? ?? 0,
      chapterCount: map['chapterCount'] as int? ?? 0,
      readerCount: map['readerCount'] as int? ?? 0,
      completionRate: (map['completionRate'] as num?)?.toDouble() ?? 0.0,
      averageRating: (map['averageRating'] as num?)?.toDouble() ?? 0.0,
      ratingCount: map['ratingCount'] as int? ?? 0,
      reviewCount: map['reviewCount'] as int? ?? 0,
      favoriteCount: map['favoriteCount'] as int? ?? 0,
      commentCount: map['commentCount'] as int? ?? 0,
      createdAt: DateTime.parse(map['createdAt'] as String),
      updatedAt: DateTime.parse(map['updatedAt'] as String),
      publishedAt: map['publishedAt'] != null 
          ? DateTime.parse(map['publishedAt'] as String) 
          : null,
      lastReadAt: map['lastReadAt'] != null 
          ? DateTime.parse(map['lastReadAt'] as String) 
          : null,
      isPremium: map['isPremium'] as bool? ?? false,
      unlockPrice: (map['unlockPrice'] as num?)?.toDouble() ?? 0.0,
      audioAvailable: map['audioAvailable'] as bool? ?? false,
      qualityScore: (map['qualityScore'] as num?)?.toDouble() ?? 0.0,
      promotionHistory: List<String>.from(map['promotionHistory'] ?? []),
      metrics: map['metrics'] != null 
          ? StoryMetrics.fromMap(map['metrics'] as Map<String, dynamic>)
          : StoryMetrics.empty(),
    );
  }
  
  Story copyWith({
    String? id,
    String? title,
    String? description,
    String? authorId,
    String? authorName,
    String? coverUrl,
    List<String>? genres,
    List<String>? tags,
    String? league,
    StoryStatus? status,
    String? language,
    int? wordCount,
    int? chapterCount,
    int? readerCount,
    double? completionRate,
    double? averageRating,
    int? ratingCount,
    int? reviewCount,
    int? favoriteCount,
    int? commentCount,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? publishedAt,
    DateTime? lastReadAt,
    bool? isPremium,
    double? unlockPrice,
    bool? audioAvailable,
    double? qualityScore,
    List<String>? promotionHistory,
    StoryMetrics? metrics,
  }) {
    return Story(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      authorId: authorId ?? this.authorId,
      authorName: authorName ?? this.authorName,
      coverUrl: coverUrl ?? this.coverUrl,
      genres: genres ?? this.genres,
      tags: tags ?? this.tags,
      league: league ?? this.league,
      status: status ?? this.status,
      language: language ?? this.language,
      wordCount: wordCount ?? this.wordCount,
      chapterCount: chapterCount ?? this.chapterCount,
      readerCount: readerCount ?? this.readerCount,
      completionRate: completionRate ?? this.completionRate,
      averageRating: averageRating ?? this.averageRating,
      ratingCount: ratingCount ?? this.ratingCount,
      reviewCount: reviewCount ?? this.reviewCount,
      favoriteCount: favoriteCount ?? this.favoriteCount,
      commentCount: commentCount ?? this.commentCount,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      publishedAt: publishedAt ?? this.publishedAt,
      lastReadAt: lastReadAt ?? this.lastReadAt,
      isPremium: isPremium ?? this.isPremium,
      unlockPrice: unlockPrice ?? this.unlockPrice,
      audioAvailable: audioAvailable ?? this.audioAvailable,
      qualityScore: qualityScore ?? this.qualityScore,
      promotionHistory: promotionHistory ?? this.promotionHistory,
      metrics: metrics ?? this.metrics,
    );
  }
  
  factory Story.fromFirestore(DocumentSnapshot doc) {
    return Story.fromMap(doc.data() as Map<String, dynamic>, documentId: doc.id);
  }
}
