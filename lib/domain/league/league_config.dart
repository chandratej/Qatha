/// StoryVerse League System Configuration
/// Defines all 13 leagues with their properties, promotion rules, and visual identity

import 'package:flutter/material.dart';

enum LeagueTier {
  archive(-1),
  manuscript(0),
  published(1),
  acclaimed(2),
  celebrated(3),
  distinguished(4),
  masterwork(5),
  legendary(6),
  hallOfFame(7),
  heritage(8),
  classic(9),
  timeless(10),
  immortal(11);

  final int index;
  const LeagueTier(this.index);

  static LeagueTier fromString(String value) {
    return LeagueTier.values.firstWhere(
      (e) => e.name == value.toLowerCase().replaceAll(' ', '_'),
      orElse: () => LeagueTier.archive,
    );
  }
}

class LeagueConfig {
  final LeagueTier tier;
  final String id;
  final String name;
  final String description;
  final Color primaryColor;
  final Color secondaryColor;
  final LinearGradient gradient;
  final IconData icon;
  final int minReaders;
  final double minCompletionRate;
  final double minAverageRating;
  final int minComments;
  final int minFavorites;
  final int minReReads;
  final double minQualityScore;
  final int daysInLeagueBeforePromotion;
  final bool isPremium;
  final bool canEarnRevenue;
  final bool canBeFeatured;
  final String badgeAsset;
  final List<String> privileges;

  const LeagueConfig({
    required this.tier,
    required this.id,
    required this.name,
    required this.description,
    required this.primaryColor,
    required this.secondaryColor,
    required this.gradient,
    required this.icon,
    required this.minReaders,
    required this.minCompletionRate,
    required this.minAverageRating,
    required this.minComments,
    required this.minFavorites,
    required this.minReReads,
    required this.minQualityScore,
    required this.daysInLeagueBeforePromotion,
    required this.isPremium,
    required this.canEarnRevenue,
    required this.canBeFeatured,
    required this.badgeAsset,
    required this.privileges,
  });

  factory LeagueConfig.fromJson(Map<String, dynamic> json) {
    return LeagueConfig(
      tier: LeagueTier.fromString(json['tier'] as String),
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      primaryColor: Color(json['primaryColor'] as int),
      secondaryColor: Color(json['secondaryColor'] as int),
      gradient: json['gradient'] as LinearGradient,
      icon: IconData(json['iconCodePoint'] as int, fontFamily: 'MaterialIcons'),
      minReaders: json['minReaders'] as int,
      minCompletionRate: (json['minCompletionRate'] as num).toDouble(),
      minAverageRating: (json['minAverageRating'] as num).toDouble(),
      minComments: json['minComments'] as int,
      minFavorites: json['minFavorites'] as int,
      minReReads: json['minReReads'] as int,
      minQualityScore: (json['minQualityScore'] as num).toDouble(),
      daysInLeagueBeforePromotion: json['daysInLeagueBeforePromotion'] as int,
      isPremium: json['isPremium'] as bool,
      canEarnRevenue: json['canEarnRevenue'] as bool,
      canBeFeatured: json['canBeFeatured'] as bool,
      badgeAsset: json['badgeAsset'] as String,
      privileges: List<String>.from(json['privileges'] ?? []),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'tier': tier.name,
      'id': id,
      'name': name,
      'description': description,
      'primaryColor': primaryColor.value,
      'secondaryColor': secondaryColor.value,
      'gradient': gradient,
      'iconCodePoint': icon.codePoint,
      'minReaders': minReaders,
      'minCompletionRate': minCompletionRate,
      'minAverageRating': minAverageRating,
      'minComments': minComments,
      'minFavorites': minFavorites,
      'minReReads': minReReads,
      'minQualityScore': minQualityScore,
      'daysInLeagueBeforePromotion': daysInLeagueBeforePromotion,
      'isPremium': isPremium,
      'canEarnRevenue': canEarnRevenue,
      'canBeFeatured': canBeFeatured,
      'badgeAsset': badgeAsset,
      'privileges': privileges,
    };
  }
}

class LeagueSystem {
  LeagueSystem._();

  static final Map<LeagueTier, LeagueConfig> _leagues = {
    LeagueTier.archive: const LeagueConfig(
      tier: LeagueTier.archive,
      id: 'archive',
      name: 'Archive',
      description: 'Stories awaiting rediscovery. Every story deserves a second chance.',
      primaryColor: Color(0xFF9E9E9E),
      secondaryColor: Color(0xFF757575),
      gradient: LinearGradient(colors: [Color(0xFF9E9E9E), Color(0xFF757575)]),
      icon: Icons.archive_outlined,
      minReaders: 0,
      minCompletionRate: 0.0,
      minAverageRating: 0.0,
      minComments: 0,
      minFavorites: 0,
      minReReads: 0,
      minQualityScore: 0.0,
      daysInLeagueBeforePromotion: 0,
      isPremium: false,
      canEarnRevenue: false,
      canBeFeatured: false,
      badgeAsset: 'assets/icons/leagues/archive.svg',
      privileges: ['read', 'comment', 'review'],
    ),
    LeagueTier.manuscript: const LeagueConfig(
      tier: LeagueTier.manuscript,
      id: 'manuscript',
      name: 'Manuscript',
      description: 'Fresh stories beginning their journey. The first step to greatness.',
      primaryColor: Color(0xFF8D6E63),
      secondaryColor: Color(0xFF5D4037),
      gradient: LinearGradient(colors: [Color(0xFF8D6E63), Color(0xFF5D4037)]),
      icon: Icons.menu_book_outlined,
      minReaders: 10,
      minCompletionRate: 0.40,
      minAverageRating: 3.0,
      minComments: 5,
      minFavorites: 3,
      minReReads: 1,
      minQualityScore: 30.0,
      daysInLeagueBeforePromotion: 3,
      isPremium: false,
      canEarnRevenue: false,
      canBeFeatured: false,
      badgeAsset: 'assets/icons/leagues/manuscript.svg',
      privileges: ['read', 'comment', 'review'],
    ),
    LeagueTier.published: const LeagueConfig(
      tier: LeagueTier.published,
      id: 'published',
      name: 'Published',
      description: 'Stories gaining traction. Recognition for emerging talent.',
      primaryColor: Color(0xFF4FC3F7),
      secondaryColor: Color(0xFF0288D1),
      gradient: LinearGradient(colors: [Color(0xFF4FC3F7), Color(0xFF0288D1)]),
      icon: Icons.auto_stories,
      minReaders: 50,
      minCompletionRate: 0.50,
      minAverageRating: 3.5,
      minComments: 15,
      minFavorites: 10,
      minReReads: 3,
      minQualityScore: 45.0,
      daysInLeagueBeforePromotion: 5,
      isPremium: false,
      canEarnRevenue: true,
      canBeFeatured: false,
      badgeAsset: 'assets/icons/leagues/published.svg',
      privileges: ['read', 'comment', 'review', 'earn'],
    ),
    LeagueTier.acclaimed: const LeagueConfig(
      tier: LeagueTier.acclaimed,
      id: 'acclaimed',
      name: 'Acclaimed',
      description: 'Critically appreciated stories. Building a dedicated readership.',
      primaryColor: Color(0xFF81C784),
      secondaryColor: Color(0xFF388E3C),
      gradient: LinearGradient(colors: [Color(0xFF81C784), Color(0xFF388E3C)]),
      icon: Icons.star_outline,
      minReaders: 100,
      minCompletionRate: 0.55,
      minAverageRating: 4.0,
      minComments: 30,
      minFavorites: 25,
      minReReads: 5,
      minQualityScore: 55.0,
      daysInLeagueBeforePromotion: 7,
      isPremium: false,
      canEarnRevenue: true,
      canBeFeatured: true,
      badgeAsset: 'assets/icons/leagues/acclaimed.svg',
      privileges: ['read', 'comment', 'review', 'earn', 'feature'],
    ),
    LeagueTier.celebrated: const LeagueConfig(
      tier: LeagueTier.celebrated,
      id: 'celebrated',
      name: 'Celebrated',
      description: 'Widely recognized stories. Premium content for discerning readers.',
      primaryColor: Color(0xFFFFB74D),
      secondaryColor: Color(0xFFF57C00),
      gradient: LinearGradient(colors: [Color(0xFFFFB74D), Color(0xFFF57C00)]),
      icon: Icons.emoji_events_outlined,
      minReaders: 250,
      minCompletionRate: 0.60,
      minAverageRating: 4.2,
      minComments: 50,
      minFavorites: 50,
      minReReads: 10,
      minQualityScore: 65.0,
      daysInLeagueBeforePromotion: 10,
      isPremium: true,
      canEarnRevenue: true,
      canBeFeatured: true,
      badgeAsset: 'assets/icons/leagues/celebrated.svg',
      privileges: ['read', 'comment', 'review', 'earn', 'feature', 'premium'],
    ),
    LeagueTier.distinguished: const LeagueConfig(
      tier: LeagueTier.distinguished,
      id: 'distinguished',
      name: 'Distinguished',
      description: 'Exceptional stories standing out. A mark of literary excellence.',
      primaryColor: Color(0xFFBA68C8),
      secondaryColor: Color(0xFF7B1FA2),
      gradient: LinearGradient(colors: [Color(0xFFBA68C8), Color(0xFF7B1FA2)]),
      icon: Icons.workspace_premium_outlined,
      minReaders: 500,
      minCompletionRate: 0.65,
      minAverageRating: 4.4,
      minComments: 80,
      minFavorites: 100,
      minReReads: 15,
      minQualityScore: 72.0,
      daysInLeagueBeforePromotion: 14,
      isPremium: true,
      canEarnRevenue: true,
      canBeFeatured: true,
      badgeAsset: 'assets/icons/leagues/distinguished.svg',
      privileges: ['read', 'comment', 'review', 'earn', 'feature', 'premium', 'analytics'],
    ),
    LeagueTier.masterwork: const LeagueConfig(
      tier: LeagueTier.masterwork,
      id: 'masterwork',
      name: 'Masterwork',
      description: 'Stories of exceptional quality. Crafted with mastery and vision.',
      primaryColor: Color(0xFF64B5F6),
      secondaryColor: Color(0xFF1976D2),
      gradient: LinearGradient(colors: [Color(0xFF64B5F6), Color(0xFF1976D2)]),
      icon: Icons.school_outlined,
      minReaders: 1000,
      minCompletionRate: 0.70,
      minAverageRating: 4.5,
      minComments: 120,
      minFavorites: 200,
      minReReads: 25,
      minQualityScore: 80.0,
      daysInLeagueBeforePromotion: 21,
      isPremium: true,
      canEarnRevenue: true,
      canBeFeatured: true,
      badgeAsset: 'assets/icons/leagues/masterwork.svg',
      privileges: ['read', 'comment', 'review', 'earn', 'feature', 'premium', 'analytics', 'priority_support'],
    ),
    LeagueTier.legendary: const LeagueConfig(
      tier: LeagueTier.legendary,
      id: 'legendary',
      name: 'Legendary',
      description: 'Stories that define genres. Unforgettable narratives.',
      primaryColor: Color(0xFFFF7043),
      secondaryColor: Color(0xFFD84315),
      gradient: LinearGradient(colors: [Color(0xFFFF7043), Color(0xFFD84315)]),
      icon: Icons.local_fire_department_outlined,
      minReaders: 2500,
      minCompletionRate: 0.75,
      minAverageRating: 4.6,
      minComments: 200,
      minFavorites: 400,
      minReReads: 40,
      minQualityScore: 87.0,
      daysInLeagueBeforePromotion: 30,
      isPremium: true,
      canEarnRevenue: true,
      canBeFeatured: true,
      badgeAsset: 'assets/icons/leagues/legendary.svg',
      privileges: ['read', 'comment', 'review', 'earn', 'feature', 'premium', 'analytics', 'priority_support', 'verified_author'],
    ),
    LeagueTier.hallOfFame: const LeagueConfig(
      tier: LeagueTier.hallOfFame,
      id: 'hall_of_fame',
      name: 'Hall of Fame',
      description: 'Elite stories honored by the community. The pinnacle of achievement.',
      primaryColor: Color(0xFFFFD700),
      secondaryColor: Color(0xFFFF8F00),
      gradient: LinearGradient(colors: [Color(0xFFFFD700), Color(0xFFFF8F00)]),
      icon: Icons.stars_outlined,
      minReaders: 5000,
      minCompletionRate: 0.80,
      minAverageRating: 4.7,
      minComments: 350,
      minFavorites: 750,
      minReReads: 60,
      minQualityScore: 92.0,
      daysInLeagueBeforePromotion: 45,
      isPremium: true,
      canEarnRevenue: true,
      canBeFeatured: true,
      badgeAsset: 'assets/icons/leagues/hall_of_fame.svg',
      privileges: ['read', 'comment', 'review', 'earn', 'feature', 'premium', 'analytics', 'priority_support', 'verified_author', 'hall_of_fame_badge'],
    ),
    LeagueTier.heritage: const LeagueConfig(
      tier: LeagueTier.heritage,
      id: 'heritage',
      name: 'Heritage',
      description: 'Timeless classics preserved. Stories that shaped literature.',
      primaryColor: Color(0xFFCD7F32),
      secondaryColor: Color(0xFF8D6E63),
      gradient: LinearGradient(colors: [Color(0xFFCD7F32), Color(0xFF8D6E63)]),
      icon: Icons.account_balance_outlined,
      minReaders: 10000,
      minCompletionRate: 0.82,
      minAverageRating: 4.75,
      minComments: 500,
      minFavorites: 1200,
      minReReads: 100,
      minQualityScore: 94.0,
      daysInLeagueBeforePromotion: 60,
      isPremium: true,
      canEarnRevenue: true,
      canBeFeatured: true,
      badgeAsset: 'assets/icons/leagues/heritage.svg',
      privileges: ['read', 'comment', 'review', 'earn', 'feature', 'premium', 'analytics', 'priority_support', 'verified_author', 'hall_of_fame_badge', 'heritage_status'],
    ),
    LeagueTier.classic: const LeagueConfig(
      tier: LeagueTier.classic,
      id: 'classic',
      name: 'Classic',
      description: 'Enduring masterpieces. Stories that transcend time.',
      primaryColor: Color(0xFFE0E0E0),
      secondaryColor: Color(0xFF9E9E9E),
      gradient: LinearGradient(colors: [Color(0xFFE0E0E0), Color(0xFF9E9E9E)]),
      icon: Icons.auto_awesome_outlined,
      minReaders: 25000,
      minCompletionRate: 0.85,
      minAverageRating: 4.8,
      minComments: 800,
      minFavorites: 2000,
      minReReads: 150,
      minQualityScore: 96.0,
      daysInLeagueBeforePromotion: 90,
      isPremium: true,
      canEarnRevenue: true,
      canBeFeatured: true,
      badgeAsset: 'assets/icons/leagues/classic.svg',
      privileges: ['read', 'comment', 'review', 'earn', 'feature', 'premium', 'analytics', 'priority_support', 'verified_author', 'hall_of_fame_badge', 'heritage_status', 'classic_status'],
    ),
    LeagueTier.timeless: const LeagueConfig(
      tier: LeagueTier.timeless,
      id: 'timeless',
      name: 'Timeless',
      description: 'Eternal stories. Literature that will be read for generations.',
      primaryColor: Color(0xFF9FA8DA),
      secondaryColor: Color(0xFF3F51B5),
      gradient: LinearGradient(colors: [Color(0xFF9FA8DA), Color(0xFF3F51B5)]),
      icon: Icons.schedule_outlined,
      minReaders: 50000,
      minCompletionRate: 0.88,
      minAverageRating: 4.85,
      minComments: 1200,
      minFavorites: 3500,
      minReReads: 250,
      minQualityScore: 98.0,
      daysInLeagueBeforePromotion: 120,
      isPremium: true,
      canEarnRevenue: true,
      canBeFeatured: true,
      badgeAsset: 'assets/icons/leagues/timeless.svg',
      privileges: ['read', 'comment', 'review', 'earn', 'feature', 'premium', 'analytics', 'priority_support', 'verified_author', 'hall_of_fame_badge', 'heritage_status', 'classic_status', 'timeless_status'],
    ),
    LeagueTier.immortal: const LeagueConfig(
      tier: LeagueTier.immortal,
      id: 'immortal',
      name: 'Immortal',
      description: 'The ultimate honor. Stories that become part of literary history.',
      primaryColor: Color(0xFFFFD700),
      secondaryColor: Color(0xFFB8941F),
      gradient: LinearGradient(colors: [Color(0xFFFFD700), Color(0xFFB8941F), Color(0xFFFFE082)]),
      icon: Icons.verified_outlined,
      minReaders: 100000,
      minCompletionRate: 0.90,
      minAverageRating: 4.9,
      minComments: 2000,
      minFavorites: 5000,
      minReReads: 500,
      minQualityScore: 99.0,
      daysInLeagueBeforePromotion: 180,
      isPremium: true,
      canEarnRevenue: true,
      canBeFeatured: true,
      badgeAsset: 'assets/icons/leagues/immortal.svg',
      privileges: ['read', 'comment', 'review', 'earn', 'feature', 'premium', 'analytics', 'priority_support', 'verified_author', 'hall_of_fame_badge', 'heritage_status', 'classic_status', 'timeless_status', 'immortal_status', 'lifetime_royalties'],
    ),
  };

  static LeagueConfig getLeague(LeagueTier tier) {
    return _leagues[tier]!;
  }

  static LeagueConfig getLeagueByTier(LeagueTier tier) {
    return _leagues[tier]!;
  }
  }

  static LeagueConfig getLeagueById(String id) {
    return _leagues.values.firstWhere(
      (league) => league.id == id,
      orElse: () => _leagues[LeagueTier.archive]!,
    );
  }

  static List<LeagueConfig> getAllLeagues() {
    return _leagues.values.toList();
  }

  static List<LeagueConfig> getPremiumLeagues() {
    return _leagues.values.where((league) => league.isPremium).toList();
  }

  static List<LeagueConfig> getFreeLeagues() {
    return _leagues.values.where((league) => !league.isPremium).toList();
  }

  static LeagueTier getNextLeague(LeagueTier current) {
    if (current == LeagueTier.immortal) {
      return LeagueTier.immortal;
    }
    return LeagueTier.values[current.index + 1];
  }

  static LeagueTier getPreviousLeague(LeagueTier current) {
    if (current == LeagueTier.archive) {
      return LeagueTier.archive;
    }
    return LeagueTier.values[current.index - 1];
  }

  static bool canPromote(LeagueTier current) {
    return current != LeagueTier.immortal;
  }

  static bool isArchive(LeagueTier tier) {
    return tier == LeagueTier.archive;
  }

  static bool isPremium(LeagueTier tier) {
    return _leagues[tier]?.isPremium ?? false;
  }
}

/// Quality Score Calculator
/// Computes composite quality score based on weighted metrics
class QualityScoreCalculator {
  QualityScoreCalculator._();

  // Metric weights (configurable by admin)
  static const double completionRateWeight = 0.25;
  static const double readerRetentionWeight = 0.20;
  static const double ratingsWeight = 0.20;
  static const double commentsWeight = 0.10;
  static const double favoritesWeight = 0.10;
  static const double reReadsWeight = 0.10;
  static const double sessionDurationWeight = 0.05;

  /// Calculate composite quality score (0-100)
  static double calculate({
    required double completionRate, // 0.0 - 1.0
    required double readerRetention, // 0.0 - 1.0
    required double averageRating, // 1.0 - 5.0
    required int comments,
    required int favorites,
    required int reReads,
    required double avgSessionDuration, // in minutes
    required int totalReaders,
  }) {
    // Normalize each metric to 0-100 scale
    final completionScore = completionRate * 100;
    final retentionScore = readerRetention * 100;
    final ratingScore = ((averageRating - 1.0) / 4.0) * 100; // Convert 1-5 to 0-100
    
    // Engagement metrics normalized based on league expectations
    final commentScore = _normalizeEngagement(comments, totalReaders, 0.10); // 10% comment rate ideal
    final favoriteScore = _normalizeEngagement(favorites, totalReaders, 0.20); // 20% favorite rate ideal
    final reReadScore = _normalizeEngagement(reReads, totalReaders, 0.30); // 30% re-read rate ideal
    
    // Session duration normalized (ideal: 15+ minutes)
    final sessionScore = (avgSessionDuration / 15.0).clamp(0.0, 1.0) * 100;

    // Weighted sum
    final qualityScore = 
        (completionScore * completionRateWeight) +
        (retentionScore * readerRetentionWeight) +
        (ratingScore * ratingsWeight) +
        (commentScore * commentsWeight) +
        (favoriteScore * favoritesWeight) +
        (reReadScore * reReadsWeight) +
        (sessionScore * sessionDurationWeight);

    return qualityScore.clamp(0.0, 100.0);
  }

  static double _normalizeEngagement(int metricValue, int totalReaders, double idealRate) {
    if (totalReaders == 0) return 0.0;
    final actualRate = metricValue / totalReaders;
    return (actualRate / idealRate).clamp(0.0, 1.0) * 100;
  }

  /// Check if story meets promotion requirements for target league
  static PromotionResult checkPromotionEligibility({
    required LeagueTier currentLeague,
    required double qualityScore,
    required int uniqueReaders,
    required double completionRate,
    required double averageRating,
    required int comments,
    required int favorites,
    required int reReads,
    required int daysInCurrentLeague,
  }) {
    if (currentLeague == LeagueTier.immortal) {
      return PromotionResult(
        eligible: false,
        reason: 'Already at maximum league',
        missingRequirements: [],
      );
    }

    final targetLeague = LeagueSystem.getNextLeague(currentLeague);
    final config = LeagueConfig.getLeague(targetLeague);
    final currentConfig = LeagueConfig.getLeague(currentLeague);

    final missingRequirements = <String>[];

    if (uniqueReaders < config.minReaders) {
      missingRequirements.add('${config.minReaders} readers (currently $uniqueReaders)');
    }

    if (completionRate < config.minCompletionRate) {
      missingRequirements.add('${(config.minCompletionRate * 100).toInt()}% completion rate (currently ${(completionRate * 100).toInt()}%)');
    }

    if (averageRating < config.minAverageRating) {
      missingRequirements.add('${config.minAverageRating}★ rating (currently ${averageRating.toStringAsFixed(1)}★)');
    }

    if (comments < config.minComments) {
      missingRequirements.add('${config.minComments} comments (currently $comments)');
    }

    if (favorites < config.minFavorites) {
      missingRequirements.add('${config.minFavorites} favorites (currently $favorites)');
    }

    if (reReads < config.minReReads) {
      missingRequirements.add('${config.minReReads} re-reads (currently $reReads)');
    }

    if (qualityScore < config.minQualityScore) {
      missingRequirements.add('${config.minQualityScore.toInt()} quality score (currently ${qualityScore.toInt()})');
    }

    if (daysInCurrentLeague < currentConfig.daysInLeagueBeforePromotion) {
      missingRequirements.add('${currentConfig.daysInLeagueBeforePromotion} days in current league (currently $daysInCurrentLeague)');
    }

    return PromotionResult(
      eligible: missingRequirements.isEmpty,
      reason: missingRequirements.isEmpty ? 'Ready for promotion!' : 'Not yet eligible',
      missingRequirements: missingRequirements,
      targetLeague: targetLeague,
      progress: _calculateProgress(currentLeague, config, uniqueReaders, completionRate, averageRating, comments, favorites, reReads, qualityScore, daysInCurrentLeague),
    );
  }

  static double _calculateProgress(
    LeagueTier current,
    LeagueConfig target,
    int readers,
    double completion,
    double rating,
    int comments,
    int favorites,
    int reReads,
    double quality,
    int days,
  ) {
    final currentConfig = LeagueConfig.getLeague(current);
    
    final readerProgress = readers / target.minReaders;
    final completionProgress = completion / target.minCompletionRate;
    final ratingProgress = rating / target.minAverageRating;
    final commentsProgress = comments / target.minComments;
    final favoritesProgress = favorites / target.minFavorites;
    final reReadsProgress = reReads / target.minReReads;
    final qualityProgress = quality / target.minQualityScore;
    final daysProgress = days / currentConfig.daysInLeagueBeforePromotion;

    final totalProgress = 
        readerProgress +
        completionProgress +
        ratingProgress +
        commentsProgress +
        favoritesProgress +
        reReadsProgress +
        qualityProgress +
        daysProgress;

    return (totalProgress / 8.0).clamp(0.0, 1.0) * 100;
  }
}

class PromotionResult {
  final bool eligible;
  final String reason;
  final List<String> missingRequirements;
  final LeagueTier? targetLeague;
  final double progress;

  PromotionResult({
    required this.eligible,
    required this.reason,
    required this.missingRequirements,
    this.targetLeague,
    this.progress = 0.0,
  });
}

/// Archive Rules Engine
class ArchiveRules {
  ArchiveRules._();

  static const int daysWithoutGrowth = 30;
  static const double minEngagementThreshold = 0.30;
  static const int minReadersForConsideration = 50;
  static const double minCompletionRateForConsideration = 0.40;

  static bool shouldMoveToArchive({
    required DateTime lastPromotionDate,
    required int daysSinceLastGrowth,
    required double engagementRate,
    required int totalReaders,
    required double completionRate,
    required LeagueTier currentLeague,
  }) {
    // Archive stories cannot be archived again
    if (currentLeague == LeagueTier.archive) {
      return false;
    }

    // Must have minimum readers before archive consideration
    if (totalReaders < minReadersForConsideration) {
      return false;
    }

    // Check if story has stagnated
    final hasStagnated = daysSinceLastGrowth >= daysWithoutGrowth;
    
    // Check if engagement is below threshold
    final lowEngagement = engagementRate < minEngagementThreshold;

    return hasStagnated && lowEngagement;
  }

  static bool canParticipateInRediscovery(LeagueTier currentLeague) {
    return currentLeague == LeagueTier.archive;
  }
}

/// Rediscovery Event Configuration
class RediscoveryEventConfig {
  RediscoveryEventConfig._();

  static const int frequencyDays = 90; // Quarterly
  static const int eventDurationDays = 14;
  static const int maxParticipatingStories = 100;
  static const int minVotesForReturn = 50;
  static const double minRatingForReturn = 3.5;

  static const List<String> eventNames = [
    'Spring Rediscovery',
    'Summer Rediscovery',
    'Autumn Rediscovery',
    'Winter Rediscovery',
  ];
}
