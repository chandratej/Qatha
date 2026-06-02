/// League Repository Implementation
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:storyverse/domain/entities/league.dart';
import 'package:storyverse/domain/repositories/league_repository.dart';
import 'package:storyverse/core/constants/app_constants.dart';

class LeagueRepositoryImpl implements LeagueRepository {
  final FirebaseFirestore _firestore;

  LeagueRepositoryImpl({FirebaseFirestore? firestore})
      : _firestore = firestore ?? FirebaseFirestore.instance;

  @override
  Future<LeagueEntity> getLeagueByTier(String tier) async {
    try {
      final doc = await _firestore
          .collection(AppConstants.firestoreLeagues)
          .doc(tier)
          .get();

      if (!doc.exists) {
        throw Exception('League not found');
      }

      return LeagueEntity.fromFirestore(doc);
    } catch (e) {
      throw Exception('Failed to get league: $e');
    }
  }

  @override
  Future<List<LeagueEntity>> getAllLeagues() async {
    try {
      final snapshot = await _firestore
          .collection(AppConstants.firestoreLeagues)
          .orderBy('tierOrder')
          .get();

      return snapshot.docs
          .map((doc) => LeagueEntity.fromFirestore(doc))
          .toList();
    } catch (e) {
      throw Exception('Failed to get leagues: $e');
    }
  }

  @override
  Future<void> updateStoryLeague(String storyId, String newTier) async {
    try {
      await _firestore
          .collection(AppConstants.firestoreStories)
          .doc(storyId)
          .update({
        'currentLeague': newTier,
        'lastPromotionDate': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      throw Exception('Failed to update story league: $e');
    }
  }

  @override
  Future<List<String>> getStoriesForPromotion(String currentTier) async {
    try {
      final league = await getLeagueByTier(currentTier);
      
      final snapshot = await _firestore
          .collection(AppConstants.firestoreStories)
          .where('currentLeague', isEqualTo: currentTier)
          .where('qualityScore', isGreaterThanOrEqualTo: league.promotionThreshold)
          .get();

      return snapshot.docs.map((doc) => doc.id).toList();
    } catch (e) {
      throw Exception('Failed to get stories for promotion: $e');
    }
  }

  @override
  Future<List<String>> getStoriesForArchive(String currentTier) async {
    try {
      final league = await getLeagueByTier(currentTier);
      
      final snapshot = await _firestore
          .collection(AppConstants.firestoreStories)
          .where('currentLeague', isEqualTo: currentTier)
          .where('qualityScore', isLessThan: league.archiveThreshold)
          .get();

      return snapshot.docs.map((doc) => doc.id).toList();
    } catch (e) {
      throw Exception('Failed to get stories for archive: $e');
    }
  }

  @override
  Future<Map<String, dynamic>> calculateQualityScore(String storyId) async {
    try {
      final doc = await _firestore
          .collection(AppConstants.firestoreStories)
          .doc(storyId)
          .get();

      if (!doc.exists) {
        throw Exception('Story not found');
      }

      final data = doc.data()!;
      final score = QualityScoreCalculator.calculate(
        completionRate: (data['completionRate'] as num?)?.toDouble() ?? 0.0,
        retentionRate: (data['retentionRate'] as num?)?.toDouble() ?? 0.0,
        averageRating: (data['averageRating'] as num?)?.toDouble() ?? 0.0,
        commentCount: data['commentCount'] as int? ?? 0,
        favoriteCount: data['favoriteCount'] as int? ?? 0,
        reReadRate: (data['reReadRate'] as num?)?.toDouble() ?? 0.0,
        sessionDuration: (data['avgSessionDuration'] as num?)?.toDouble() ?? 0.0,
        uniqueReaders: data['uniqueReaders'] as int? ?? 0,
        growthRate: (data['growthRate'] as num?)?.toDouble() ?? 0.0,
      );

      return score;
    } catch (e) {
      throw Exception('Failed to calculate quality score: $e');
    }
  }
}
