import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:equatable/equatable.dart';

class AudioTrack extends Equatable {
  final String id;
  final String storyId;
  final String chapterId;
  final String audioUrl;
  final String? storagePath;
  final int durationSeconds;
  final int chapterOrder;
  final String narratorName;
  final double playbackSpeed;
  final int playCount;
  final double completionRate;
  final bool isPremium;
  final String language;
  final DateTime createdAt;
  final DateTime updatedAt;

  const AudioTrack({
    required this.id,
    required this.storyId,
    required this.chapterId,
    required this.audioUrl,
    this.storagePath,
    required this.durationSeconds,
    required this.chapterOrder,
    required this.narratorName,
    this.playbackSpeed = 1.0,
    this.playCount = 0,
    this.completionRate = 0.0,
    this.isPremium = false,
    this.language = 'en',
    required this.createdAt,
    required this.updatedAt,
  });

  @override
  List<Object?> get props => [
        id,
        storyId,
        chapterId,
        audioUrl,
        storagePath,
        durationSeconds,
        chapterOrder,
        narratorName,
        playbackSpeed,
        playCount,
        completionRate,
        isPremium,
        language,
        createdAt,
        updatedAt,
      ];

  factory AudioTrack.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return AudioTrack(
      id: doc.id,
      storyId: data['storyId'] ?? '',
      chapterId: data['chapterId'] ?? '',
      audioUrl: data['audioUrl'] ?? '',
      storagePath: data['storagePath'],
      durationSeconds: data['durationSeconds'] ?? 0,
      chapterOrder: data['chapterOrder'] ?? 0,
      narratorName: data['narratorName'] ?? 'AI Narrator',
      playbackSpeed: (data['playbackSpeed'] ?? 1.0).toDouble(),
      playCount: data['playCount'] ?? 0,
      completionRate: (data['completionRate'] ?? 0.0).toDouble(),
      isPremium: data['isPremium'] ?? false,
      language: data['language'] ?? 'en',
      createdAt: (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      updatedAt: (data['updatedAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'storyId': storyId,
      'chapterId': chapterId,
      'audioUrl': audioUrl,
      'storagePath': storagePath,
      'durationSeconds': durationSeconds,
      'chapterOrder': chapterOrder,
      'narratorName': narratorName,
      'playbackSpeed': playbackSpeed,
      'playCount': playCount,
      'completionRate': completionRate,
      'isPremium': isPremium,
      'language': language,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }

  AudioTrack copyWith({
    String? id,
    String? storyId,
    String? chapterId,
    String? audioUrl,
    String? storagePath,
    int? durationSeconds,
    int? chapterOrder,
    String? narratorName,
    double? playbackSpeed,
    int? playCount,
    double? completionRate,
    bool? isPremium,
    String? language,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return AudioTrack(
      id: id ?? this.id,
      storyId: storyId ?? this.storyId,
      chapterId: chapterId ?? this.chapterId,
      audioUrl: audioUrl ?? this.audioUrl,
      storagePath: storagePath ?? this.storagePath,
      durationSeconds: durationSeconds ?? this.durationSeconds,
      chapterOrder: chapterOrder ?? this.chapterOrder,
      narratorName: narratorName ?? this.narratorName,
      playbackSpeed: playbackSpeed ?? this.playbackSpeed,
      playCount: playCount ?? this.playCount,
      completionRate: completionRate ?? this.completionRate,
      isPremium: isPremium ?? this.isPremium,
      language: language ?? this.language,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
