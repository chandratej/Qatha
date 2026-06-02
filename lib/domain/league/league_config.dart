/// StoryVerse League System
/// 
/// Complete league configuration and rule engine

import '../../domain/entities/entities.dart';

/// League Configuration - All leagues in the system
class LeagueConfig {
  LeagueConfig._();

  static const List<League> allLeagues = [
    League(
      id: 'archive',
      name: 'Archive',
      description: 'Stories awaiting rediscovery or permanent rest',
      order: 0,
      isPremium: false,
      promotionRequirements: {
        'minCompletionRate': 0.0,
        'minRating': 0.0,
        'minReads': 0,
        'minComments': 0,
        'qualityScore': 0,
      },
    ),
    League(
      id: 'manuscript',
      name: 'Manuscript',
      description: 'Fresh stories beginning their journey',
      order: 1,
      isPremium: false,
      promotionRequirements: {
        'minCompletionRate': 0.40,
        'minRating': 3.5,
        'minReads': 50,
        'minComments': 5,
        'qualityScore': 40,
      },
    ),
    League(
      id: 'published',
      name: 'Published',
      description: 'Stories that have found their audience',
      order: 2,
      isPremium: false,
      promotionRequirements: {
        'minCompletionRate': 0.50,
        'minRating': 3.8,
        'minReads': 200,
        'minComments': 20,
        'qualityScore': 50,
      },
    ),
    League(
      id: 'acclaimed',
      name: 'Acclaimed',
      description: 'Stories gaining recognition',
      order: 3,
      isPremium: false,
      promotionRequirements: {
        'minCompletionRate': 0.55,
        'minRating': 4.0,
        'minReads': 500,
        'minComments': 50,
        'qualityScore': 60,
      },
    ),
    League(
      id: 'celebrated',
      name: 'Celebrated',
      description: 'Popular stories with strong engagement',
      order: 4,
      isPremium: true,
      promotionRequirements: {
        'minCompletionRate': 0.60,
        'minRating': 4.2,
        'minReads': 1000,
        'minComments': 100,
        'qualityScore': 70,
      },
    ),
    League(
      id: 'distinguished',
      name: 'Distinguished',
      description: 'Notable works of exceptional quality',
      order: 5,
      isPremium: true,
      promotionRequirements: {
        'minCompletionRate': 0.65,
        'minRating': 4.4,
        'minReads': 2500,
        'minComments': 250,
        'qualityScore': 75,
      },
    ),
    League(
      id: 'masterwork',
      name: 'Masterwork',
      description: 'Masterful storytelling at its finest',
      order: 6,
      isPremium: true,
      promotionRequirements: {
        'minCompletionRate': 0.70,
        'minRating': 4.5,
        'minReads': 5000,
        'minComments': 500,
        'qualityScore': 80,
      },
    ),
    League(
      id: 'legendary',
      name: 'Legendary',
      description: 'Stories that define genres',
      order: 7,
      isPremium: true,
      promotionRequirements: {
        'minCompletionRate': 0.75,
        'minRating': 4.6,
        'minReads': 10000,
        'minComments': 1000,
        'qualityScore': 85,
      },
    ),
    League(
      id: 'hall_of_fame',
      name: 'Hall of Fame',
      description: 'Elite stories recognized by the community',
      order: 8,
      isPremium: true,
      promotionRequirements: {
        'minCompletionRate': 0.78,
        'minRating': 4.7,
        'minReads': 25000,
        'minComments': 2500,
        'qualityScore': 88,
      },
    ),
    League(
      id: 'heritage',
      name: 'Heritage',
      description: 'Timeless classics with historical significance',
      order: 9,
      isPremium: true,
      promotionRequirements: {
        'minCompletionRate': 0.80,
        'minRating': 4.8,
        'minReads': 50000,
        'minComments': 5000,
        'qualityScore': 90,
        'minDaysInPreviousLeague': 90,
      },
    ),
    League(
      id: 'classic',
      name: 'Classic',
      description: 'Enduring masterpieces loved across generations',
      order: 10,
      isPremium: true,
      promotionRequirements: {
        'minCompletionRate': 0.82,
        'minRating': 4.85,
        'minReads': 100000,
        'minComments': 10000,
        'qualityScore': 93,
        'minDaysInPreviousLeague': 180,
      },
    ),
    League(
      id: 'timeless',
      name: 'Timeless',
      description: 'Eternal stories that transcend time',
      order: 11,
      isPremium: true,
      promotionRequirements: {
        'minCompletionRate': 0.85,
        'minRating': 4.9,
        'minReads': 250000,
        'minComments': 25000,
        'qualityScore': 96,
        'minDaysInPreviousLeague': 365,
      },
    ),
    League(
      id: 'immortal',
      name: 'Immortal',
      description: 'The pinnacle of literary achievement',
      order: 12,
      isPremium: true,
      promotionRequirements: {
        'minCompletionRate': 0.88,
        'minRating': 4.95,
        'minReads': 500000,
        'minComments': 50000,
        'qualityScore': 98,
        'minDaysInPreviousLeague': 730,
      },
    ),
  ];

  /// Get league by ID
  static League? getLeagueById(String id) {
    try {
      return allLeagues.firstWhere((league) => league.id == id);
    } catch (e) {
      return null;
    }
  }

  /// Get league by order
  static League? getLeagueByOrder(int order) {
    try {
      return allLeagues.firstWhere((league) => league.order == order);
    } catch (e) {
      return null;
    }
  }

  /// Get next league for promotion
  static League? getNextLeague(String currentLeagueId) {
    final currentLeague = getLeagueById(currentLeagueId);
    if (currentLeague == null) return null;

    try {
      return allLeagues.firstWhere(
        (league) => league.order == currentLeague.order + 1,
      );
    } catch (e) {
      return null; // Already at highest league
    }
  }

  /// Check if league is premium
  static bool isPremiumLeague(String leagueId) {
    final league = getLeagueById(leagueId);
    return league?.isPremium ?? false;
  }

  /// Get all free leagues
  static List<League> getFreeLeagues() {
    return allLeagues.where((league) => !league.isPremium).toList();
  }

  /// Get all premium leagues
  static List<League> getPremiumLeagues() {
    return allLeagues.where((league) => league.isPremium).toList();
  }

  /// Archive league
  static League get archive => allLeagues[0];

  /// Highest league
  static League get immortal => allLeagues.last;
}

/// Quality Score Calculator
/// Calculates composite quality score based on multiple metrics
class QualityScoreCalculator {
  QualityScoreCalculator._();

  /// Metric weights (configurable by admin)
  static Map<String, double> defaultWeights = {
    'completionRate': 0.25,
    'readerRetention': 0.20,
    'rating': 0.20,
    'comments': 0.10,
    'favorites': 0.10,
    'reReads': 0.10,
    'sessionDuration': 0.05,
  };

  /// Calculate composite quality score (0-100)
  static double calculate({
    required double completionRate,
    required double readerRetention,
    required double rating,
    required int comments,
    required int favorites,
    required int reReads,
    required double sessionDurationMinutes,
    required int uniqueReaders,
    Map<String, double>? customWeights,
  }) {
    final weights = customWeights ?? defaultWeights;

    // Normalize each metric to 0-100 scale
    final normalizedCompletionRate = completionRate * 100;
    final normalizedRetention = readerRetention * 100;
    final normalizedRating = (rating / 5.0) * 100;
    
    // Comments per reader (normalized)
    final commentsPerReader = uniqueReaders > 0 ? comments / uniqueReaders : 0;
    final normalizedComments = (commentsPerReader * 100).clamp(0, 100);
    
    // Favorites per reader (normalized)
    final favoritesPerReader = uniqueReaders > 0 ? favorites / uniqueReaders : 0;
    final normalizedFavorites = (favoritesPerReader * 100).clamp(0, 100);
    
    // Re-read rate (normalized)
    final reReadRate = uniqueReaders > 0 ? reReads / uniqueReaders : 0;
    final normalizedReReads = (reReadRate * 100).clamp(0, 100);
    
    // Session duration (assuming 10+ minutes is excellent)
    final normalizedSessionDuration = (sessionDurationMinutes / 10.0 * 100).clamp(0, 100);

    // Calculate weighted score
    double score = 0;
    score += normalizedCompletionRate * (weights['completionRate'] ?? 0);
    score += normalizedRetention * (weights['readerRetention'] ?? 0);
    score += normalizedRating * (weights['rating'] ?? 0);
    score += normalizedComments * (weights['comments'] ?? 0);
    score += normalizedFavorites * (weights['favorites'] ?? 0);
    score += normalizedReReads * (weights['reReads'] ?? 0);
    score += normalizedSessionDuration * (weights['sessionDuration'] ?? 0);

    return score.clamp(0, 100);
  }

  /// Check if story meets promotion requirements
  static PromotionResult checkPromotionEligibility({
    required Story story,
    required League currentLeague,
    required int uniqueReaders,
    required double readerRetention,
    required int favorites,
    required int reReads,
    required double sessionDurationMinutes,
    required int daysInCurrentLeague,
  }) {
    final nextLeague = LeagueConfig.getNextLeague(currentLeague.id);
    
    if (nextLeague == null) {
      return PromotionResult(
        eligible: false,
        reason: 'Already in highest league',
        currentScore: 0,
        requiredScore: 0,
        missingMetrics: [],
      );
    }

    final qualityScore = calculate(
      completionRate: story.completionRate,
      readerRetention: readerRetention,
      rating: story.rating,
      comments: story.totalComments,
      favorites: favorites,
      reReads: reReads,
      sessionDurationMinutes: sessionDurationMinutes,
      uniqueReaders: uniqueReaders,
    );

    final requirements = nextLeague.promotionRequirements;
    final missingMetrics = <String>[];

    // Check each requirement
    if (story.completionRate < (requirements['minCompletionRate'] ?? 0)) {
      missingMetrics.add('completion_rate');
    }

    if (story.rating < (requirements['minRating'] ?? 0)) {
      missingMetrics.add('rating');
    }

    if (story.totalReads < (requirements['minReads'] ?? 0)) {
      missingMetrics.add('reads');
    }

    if (story.totalComments < (requirements['minComments'] ?? 0)) {
      missingMetrics.add('comments');
    }

    if (qualityScore < (requirements['qualityScore'] ?? 0)) {
      missingMetrics.add('quality_score');
    }

    if ((requirements['minDaysInPreviousLeague'] ?? 0) > 0 &&
        daysInCurrentLeague < (requirements['minDaysInPreviousLeague'] ?? 0)) {
      missingMetrics.add('time_in_league');
    }

    return PromotionResult(
      eligible: missingMetrics.isEmpty,
      reason: missingMetrics.isEmpty 
          ? 'Ready for promotion' 
          : 'Missing: ${missingMetrics.join(", ")}',
      currentScore: qualityScore,
      requiredScore: requirements['qualityScore'] ?? 0,
      missingMetrics: missingMetrics,
      nextLeague: nextLeague,
    );
  }
}

/// Result of promotion eligibility check
class PromotionResult {
  final bool eligible;
  final String reason;
  final double currentScore;
  final double requiredScore;
  final List<String> missingMetrics;
  final League? nextLeague;

  const PromotionResult({
    required this.eligible,
    required this.reason,
    required this.currentScore,
    required this.requiredScore,
    required this.missingMetrics,
    this.nextLeague,
  });

  Map<String, dynamic> toJson() {
    return {
      'eligible': eligible,
      'reason': reason,
      'currentScore': currentScore,
      'requiredScore': requiredScore,
      'missingMetrics': missingMetrics,
      'nextLeagueId': nextLeague?.id,
    };
  }
}

/// Archive Rules and Configuration
class ArchiveConfig {
  ArchiveConfig._();

  /// Stories are archived if they fail to meet minimum thresholds
  static const double minCompletionRateForArchive = 0.20;
  static const double minRatingForArchive = 2.5;
  static const int minReadsBeforeArchiveDecision = 100;
  static const int daysBeforeArchiveEvaluation = 90;

  /// Rediscovery event configuration
  static const Duration rediscoveryEventDuration = Duration(days: 30);
  static const int maxStoriesPerRediscoveryEvent = 50;
  static const double minQualityScoreForRediscovery = 30;

  /// Check if story should be moved to archive
  static bool shouldBeArchived({
    required Story story,
    required int daysSincePublication,
    required double readerRetention,
  }) {
    if (daysSincePublication < daysBeforeArchiveDecision) {
      return false; // Not enough time has passed
    }

    if (story.totalReads < minReadsBeforeArchiveDecision) {
      return false; // Not enough data
    }

    // Archive if both completion rate and rating are below threshold
    return story.completionRate < minCompletionRateForArchive &&
           story.rating < minRatingForArchive;
  }

  /// Check if story is eligible for rediscovery event
  static bool isEligibleForRediscovery({
    required Story story,
    required DateTime lastRediscoveryAttempt,
    required double qualityScore,
  }) {
    // Must be in archive
    if (!story.isInArchive) return false;

    // Must meet minimum quality score
    if (qualityScore < minQualityScoreForRediscovery) return false;

    // Can only participate once per year
    final daysSinceLastAttempt = DateTime.now().difference(lastRediscoveryAttempt).inDays;
    if (daysSinceLastAttempt < 365) return false;

    return true;
  }
}

/// League Badge Configuration
class LeagueBadge {
  LeagueBadge._();

  static const Map<String, String> badgeIcons = {
    'archive': '📦',
    'manuscript': '📝',
    'published': '📖',
    'acclaimed': '👏',
    'celebrated': '🎉',
    'distinguished': '⭐',
    'masterwork': '🏆',
    'legendary': '🌟',
    'hall_of_fame': '🏛️',
    'heritage': '🏺',
    'classic': '📚',
    'timeless': '⏳',
    'immortal': '👑',
  };

  static String getBadgeIcon(String leagueId) {
    return badgeIcons[leagueId] ?? '📖';
  }

  static String getBadgeEmoji(String leagueId) {
    return badgeIcons[leagueId] ?? '📖';
  }

  /// Get prestige level (0-12)
  static int getPrestigeLevel(String leagueId) {
    final league = LeagueConfig.getLeagueById(leagueId);
    return league?.order ?? 0;
  }

  /// Check if league is considered prestigious (top tier)
  static bool isPrestigious(String leagueId) {
    final prestigeLevel = getPrestigeLevel(leagueId);
    return prestigeLevel >= 8; // Hall of Fame and above
  }
}
