import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../domain/entities/league.dart';

class LeagueModel extends League {
  const LeagueModel({
    required super.id,
    required super.name,
    required super.displayName,
    required super.description,
    required super.badgeIcon,
    required super.colorHex,
    required super.minQualityScore,
    required super.maxQualityScore,
    required super.promotionRequirements,
    required super.demotionRequirements,
    required super.benefits,
    required super.visibility,
    required super.isPremium,
    required super.order,
    required super.createdAt,
    required super.updatedAt,
  });

  factory LeagueModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return LeagueModel(
      id: doc.id,
      name: data['name'] ?? '',
      displayName: data['displayName'] ?? '',
      description: data['description'] ?? '',
      badgeIcon: data['badgeIcon'] ?? '',
      colorHex: data['colorHex'] ?? '#808080',
      minQualityScore: (data['minQualityScore'] ?? 0.0).toDouble(),
      maxQualityScore: (data['maxQualityScore'] ?? 100.0).toDouble(),
      promotionRequirements: PromotionRequirements.fromMap(
        data['promotionRequirements'] ?? {},
      ),
      demotionRequirements: DemotionRequirements.fromMap(
        data['demotionRequirements'] ?? {},
      ),
      benefits: List<String>.from(data['benefits'] ?? []),
      visibility: LeagueVisibility.values.firstWhere(
        (e) => e.name == data['visibility'],
        orElse: () => LeagueVisibility.public,
      ),
      isPremium: data['isPremium'] ?? false,
      order: data['order'] ?? 0,
      createdAt: (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      updatedAt: (data['updatedAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'displayName': displayName,
      'description': description,
      'badgeIcon': badgeIcon,
      'colorHex': colorHex,
      'minQualityScore': minQualityScore,
      'maxQualityScore': maxQualityScore,
      'promotionRequirements': promotionRequirements.toMap(),
      'demotionRequirements': demotionRequirements.toMap(),
      'benefits': benefits,
      'visibility': visibility.name,
      'isPremium': isPremium,
      'order': order,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }

  LeagueModel copyWith({
    String? id,
    String? name,
    String? displayName,
    String? description,
    String? badgeIcon,
    String? colorHex,
    double? minQualityScore,
    double? maxQualityScore,
    PromotionRequirements? promotionRequirements,
    DemotionRequirements? demotionRequirements,
    List<String>? benefits,
    LeagueVisibility? visibility,
    bool? isPremium,
    int? order,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return LeagueModel(
      id: id ?? this.id,
      name: name ?? this.name,
      displayName: displayName ?? this.displayName,
      description: description ?? this.description,
      badgeIcon: badgeIcon ?? this.badgeIcon,
      colorHex: colorHex ?? this.colorHex,
      minQualityScore: minQualityScore ?? this.minQualityScore,
      maxQualityScore: maxQualityScore ?? this.maxQualityScore,
      promotionRequirements: 
          promotionRequirements ?? this.promotionRequirements,
      demotionRequirements: 
          demotionRequirements ?? this.demotionRequirements,
      benefits: benefits ?? this.benefits,
      visibility: visibility ?? this.visibility,
      isPremium: isPremium ?? this.isPremium,
      order: order ?? this.order,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  static LeagueModel fromEntity(League league) {
    return LeagueModel(
      id: league.id,
      name: league.name,
      displayName: league.displayName,
      description: league.description,
      badgeIcon: league.badgeIcon,
      colorHex: league.colorHex,
      minQualityScore: league.minQualityScore,
      maxQualityScore: league.maxQualityScore,
      promotionRequirements: league.promotionRequirements,
      demotionRequirements: league.demotionRequirements,
      benefits: league.benefits,
      visibility: league.visibility,
      isPremium: league.isPremium,
      order: league.order,
      createdAt: league.createdAt,
      updatedAt: league.updatedAt,
    );
  }

  bool get isArchive => name == 'archive';
  
  bool get isImmortal => name == 'immortal';
  
  bool get canBePromoted => maxQualityScore < 100;
  
  bool get isEntryLevel => order == 0;
}
