import 'package:equatable/equatable.dart';

enum LeagueVisibility {
  public,
  premium,
  hidden,
}

class PromotionRequirements extends Equatable {
  final double minQualityScore;
  final int minReaders;
  final double minCompletionRate;
  final double minAverageRating;
  final int minRatings;
  final int minDaysInLeague;
  final Map<String, dynamic> customCriteria;

  const PromotionRequirements({
    required this.minQualityScore,
    required this.minReaders,
    required this.minCompletionRate,
    required this.minAverageRating,
    required this.minRatings,
    required this.minDaysInLeague,
    this.customCriteria = const {},
  });

  factory PromotionRequirements.fromMap(Map<String, dynamic> map) {
    return PromotionRequirements(
      minQualityScore: (map['minQualityScore'] ?? 0.0).toDouble(),
      minReaders: map['minReaders'] ?? 0,
      minCompletionRate: (map['minCompletionRate'] ?? 0.0).toDouble(),
      minAverageRating: (map['minAverageRating'] ?? 0.0).toDouble(),
      minRatings: map['minRatings'] ?? 0,
      minDaysInLeague: map['minDaysInLeague'] ?? 0,
      customCriteria: Map<String, dynamic>.from(map['customCriteria'] ?? {}),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'minQualityScore': minQualityScore,
      'minReaders': minReaders,
      'minCompletionRate': minCompletionRate,
      'minAverageRating': minAverageRating,
      'minRatings': minRatings,
      'minDaysInLeague': minDaysInLeague,
      'customCriteria': customCriteria,
    };
  }

  @override
  List<Object?> get props => [
        minQualityScore,
        minReaders,
        minCompletionRate,
        minAverageRating,
        minRatings,
        minDaysInLeague,
        customCriteria,
      ];
}

class DemotionRequirements extends Equatable {
  final double maxQualityScore;
  final int maxDaysWithoutProgress;
  final double maxDropRate;

  const DemotionRequirements({
    required this.maxQualityScore,
    required this.maxDaysWithoutProgress,
    required this.maxDropRate,
  });

  factory DemotionRequirements.fromMap(Map<String, dynamic> map) {
    return DemotionRequirements(
      maxQualityScore: (map['maxQualityScore'] ?? 0.0).toDouble(),
      maxDaysWithoutProgress: map['maxDaysWithoutProgress'] ?? 30,
      maxDropRate: (map['maxDropRate'] ?? 0.0).toDouble(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'maxQualityScore': maxQualityScore,
      'maxDaysWithoutProgress': maxDaysWithoutProgress,
      'maxDropRate': maxDropRate,
    };
  }

  @override
  List<Object?> get props => [
        maxQualityScore,
        maxDaysWithoutProgress,
        maxDropRate,
      ];
}

class League extends Equatable {
  final String id;
  final String name;
  final String displayName;
  final String description;
  final String badgeIcon;
  final String colorHex;
  final double minQualityScore;
  final double maxQualityScore;
  final PromotionRequirements promotionRequirements;
  final DemotionRequirements demotionRequirements;
  final List<String> benefits;
  final LeagueVisibility visibility;
  final bool isPremium;
  final int order;
  final DateTime createdAt;
  final DateTime updatedAt;

  const League({
    required this.id,
    required this.name,
    required this.displayName,
    required this.description,
    required this.badgeIcon,
    required this.colorHex,
    required this.minQualityScore,
    required this.maxQualityScore,
    required this.promotionRequirements,
    required this.demotionRequirements,
    required this.benefits,
    required this.visibility,
    required this.isPremium,
    required this.order,
    required this.createdAt,
    required this.updatedAt,
  });

  @override
  List<Object?> get props => [
        id,
        name,
        displayName,
        description,
        badgeIcon,
        colorHex,
        minQualityScore,
        maxQualityScore,
        promotionRequirements,
        demotionRequirements,
        benefits,
        visibility,
        isPremium,
        order,
        createdAt,
        updatedAt,
      ];

  bool get isArchive => name == 'archive';
  
  bool get isImmortal => name == 'immortal';
  
  bool get canBePromoted => maxQualityScore < 100;
  
  bool get isEntryLevel => order == 0;
}
