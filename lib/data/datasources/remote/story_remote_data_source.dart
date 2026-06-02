import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:dio/dio.dart';
import '../../../domain/entities/story.dart';
import '../../../domain/entities/chapter.dart';
import '../../../domain/repositories/story_repository.dart';
import '../../../core/constants/app_constants.dart';

/// Remote data source for story-related operations
abstract class StoryRemoteDataSource {
  /// Fetches stories based on filters
  Future<List<Story>> getStories({
    String? genre,
    String? leagueId,
    bool? isCompleted,
    int limit = 20,
    DocumentSnapshot? lastDocument,
  });

  /// Fetches a single story by ID
  Future<Story> getStoryById(String storyId);

  /// Fetches chapters for a story
  Future<List<Chapter>> getChapters(String storyId);

  /// Fetches a single chapter
  Future<Chapter> getChapter(String storyId, String chapterId);

  /// Searches stories using Algolia-ready architecture
  Future<List<Story>> searchStories(String query, {Map<String, dynamic>? filters});

  /// Gets trending stories
  Future<List<Story>> getTrendingStories({int limit = 10});

  /// Gets recommended stories for a user
  Future<List<Story>> getRecommendedStories(String userId, {int limit = 10});

  /// Gets stories near promotion
  Future<List<Story>> getNearPromotionStories({int limit = 10});

  /// Gets recently promoted stories
  Future<List<Story>> getRecentlyPromotedStories({int limit = 10});

  /// Gets archive discoveries
  Future<List<Story>> getArchiveDiscoveries({int limit = 10});

  /// Gets premium spotlight stories
  Future<List<Story>> getPremiumSpotlight({int limit = 10});

  /// Gets immortal collection stories
  Future<List<Story>> getImmortalCollection({int limit = 10});

  /// Gets featured authors' stories
  Future<List<Story>> getFeaturedAuthorsStories({int limit = 10});

  /// Gets seasonal collection stories
  Future<List<Story>> getSeasonalCollection({String? season, int limit = 10});

  /// Gets daily literary pick
  Future<Story?> getDailyLiteraryPick();

  /// Increments story view count
  Future<void> incrementStoryViews(String storyId);

  /// Records reading progress
  Future<void> recordReadingProgress({
    required String userId,
    required String storyId,
    required String chapterId,
    required double progress,
  });
}

class StoryRemoteDataSourceImpl implements StoryRemoteDataSource {
  final FirebaseFirestore _firestore;
  final Dio _dio; // For Algolia or external APIs if needed

  StoryRemoteDataSourceImpl({
    required FirebaseFirestore firestore,
    required Dio dio,
  })  : _firestore = firestore,
        _dio = dio;

  @override
  Future<List<Story>> getStories({
    String? genre,
    String? leagueId,
    bool? isCompleted,
    int limit = 20,
    DocumentSnapshot? lastDocument,
  }) async {
    try {
      Query<Map<String, dynamic>> query = _firestore
          .collection(AppConstants.firestoreStories)
          .orderBy('createdAt', descending: true)
          .limit(limit);

      if (genre != null && genre.isNotEmpty) {
        query = query.where('genres', arrayContains: genre);
      }

      if (leagueId != null && leagueId.isNotEmpty) {
        query = query.where('leagueId', isEqualTo: leagueId);
      }

      if (isCompleted != null) {
        query = query.where('isCompleted', isEqualTo: isCompleted);
      }

      if (lastDocument != null) {
        query = query.startAfterDocument(lastDocument);
      }

      final snapshot = await query.get();

      return snapshot.docs
          .map((doc) => Story.fromFirestore(doc.data(), doc.id))
          .toList();
    } catch (e) {
      throw _handleException(e, 'getStories');
    }
  }

  @override
  Future<Story> getStoryById(String storyId) async {
    try {
      final doc = await _firestore
          .collection(AppConstants.firestoreStories)
          .doc(storyId)
          .get();

      if (!doc.exists) {
        throw Exception('Story not found');
      }

      return Story.fromFirestore(doc.data()!, doc.id);
    } catch (e) {
      throw _handleException(e, 'getStoryById');
    }
  }

  @override
  Future<List<Chapter>> getChapters(String storyId) async {
    try {
      final snapshot = await _firestore
          .collection(AppConstants.firestoreStories)
          .doc(storyId)
          .collection(AppConstants.firestoreChapters)
          .orderBy('chapterNumber', descending: false)
          .get();

      return snapshot.docs
          .map((doc) => Chapter.fromFirestore(doc.data(), doc.id))
          .toList();
    } catch (e) {
      throw _handleException(e, 'getChapters');
    }
  }

  @override
  Future<Chapter> getChapter(String storyId, String chapterId) async {
    try {
      final doc = await _firestore
          .collection(AppConstants.firestoreStories)
          .doc(storyId)
          .collection(AppConstants.firestoreChapters)
          .doc(chapterId)
          .get();

      if (!doc.exists) {
        throw Exception('Chapter not found');
      }

      return Chapter.fromFirestore(doc.data()!, doc.id);
    } catch (e) {
      throw _handleException(e, 'getChapter');
    }
  }

  @override
  Future<List<Story>> searchStories(String query,
      {Map<String, dynamic>? filters}) async {
    try {
      // Algolia-ready architecture
      // Currently using Firestore basic search
      // Replace with Algolia SDK integration when ready
      
      final lowercaseQuery = query.toLowerCase();
      
      final snapshot = await _firestore
          .collection(AppConstants.firestoreStories)
          .where('titleLowerCase', isGreaterThanOrEqualTo: lowercaseQuery)
          .where('titleLowerCase', isLessThanOrEqualTo: '$lowercaseQuery\uf8ff')
          .limit(20)
          .get();

      return snapshot.docs
          .map((doc) => Story.fromFirestore(doc.data(), doc.id))
          .toList();
    } catch (e) {
      throw _handleException(e, 'searchStories');
    }
  }

  @override
  Future<List<Story>> getTrendingStories({int limit = 10}) async {
    try {
      final snapshot = await _firestore
          .collection(AppConstants.firestoreStories)
          .orderBy('trendingScore', descending: true)
          .limit(limit)
          .get();

      return snapshot.docs
          .map((doc) => Story.fromFirestore(doc.data(), doc.id))
          .toList();
    } catch (e) {
      throw _handleException(e, 'getTrendingStories');
    }
  }

  @override
  Future<List<Story>> getRecommendedStories(String userId,
      {int limit = 10}) async {
    try {
      // AI recommendation engine ready architecture
      // Currently returns popular stories
      // Replace with ML-based recommendations when ready
      
      final snapshot = await _firestore
          .collection(AppConstants.firestoreStories)
          .orderBy('compositeQualityScore', descending: true)
          .limit(limit)
          .get();

      return snapshot.docs
          .map((doc) => Story.fromFirestore(doc.data(), doc.id))
          .toList();
    } catch (e) {
      throw _handleException(e, 'getRecommendedStories');
    }
  }

  @override
  Future<List<Story>> getNearPromotionStories({int limit = 10}) async {
    try {
      final snapshot = await _firestore
          .collection(AppConstants.firestoreStories)
          .where('isNearPromotion', isEqualTo: true)
          .orderBy('compositeQualityScore', descending: true)
          .limit(limit)
          .get();

      return snapshot.docs
          .map((doc) => Story.fromFirestore(doc.data(), doc.id))
          .toList();
    } catch (e) {
      throw _handleException(e, 'getNearPromotionStories');
    }
  }

  @override
  Future<List<Story>> getRecentlyPromotedStories({int limit = 10}) async {
    try {
      final now = DateTime.now();
      final thirtyDaysAgo = now.subtract(const Duration(days: 30));

      final snapshot = await _firestore
          .collection(AppConstants.firestoreStories)
          .where('lastPromotionDate', isGreaterThan: Timestamp.fromDate(thirtyDaysAgo))
          .orderBy('lastPromotionDate', descending: true)
          .limit(limit)
          .get();

      return snapshot.docs
          .map((doc) => Story.fromFirestore(doc.data(), doc.id))
          .toList();
    } catch (e) {
      throw _handleException(e, 'getRecentlyPromotedStories');
    }
  }

  @override
  Future<List<Story>> getArchiveDiscoveries({int limit = 10}) async {
    try {
      final snapshot = await _firestore
          .collection(AppConstants.firestoreStories)
          .where('leagueId', isEqualTo: 'archive')
          .orderBy('rediscoveryScore', descending: true)
          .limit(limit)
          .get();

      return snapshot.docs
          .map((doc) => Story.fromFirestore(doc.data(), doc.id))
          .toList();
    } catch (e) {
      throw _handleException(e, 'getArchiveDiscoveries');
    }
  }

  @override
  Future<List<Story>> getPremiumSpotlight({int limit = 10}) async {
    try {
      final snapshot = await _firestore
          .collection(AppConstants.firestoreStories)
          .where('isPremium', isEqualTo: true)
          .where('isFeatured', isEqualTo: true)
          .orderBy('compositeQualityScore', descending: true)
          .limit(limit)
          .get();

      return snapshot.docs
          .map((doc) => Story.fromFirestore(doc.data(), doc.id))
          .toList();
    } catch (e) {
      throw _handleException(e, 'getPremiumSpotlight');
    }
  }

  @override
  Future<List<Story>> getImmortalCollection({int limit = 10}) async {
    try {
      final snapshot = await _firestore
          .collection(AppConstants.firestoreStories)
          .where('leagueId', isEqualTo: 'immortal')
          .orderBy('compositeQualityScore', descending: true)
          .limit(limit)
          .get();

      return snapshot.docs
          .map((doc) => Story.fromFirestore(doc.data(), doc.id))
          .toList();
    } catch (e) {
      throw _handleException(e, 'getImmortalCollection');
    }
  }

  @override
  Future<List<Story>> getFeaturedAuthorsStories({int limit = 10}) async {
    try {
      final snapshot = await _firestore
          .collection(AppConstants.firestoreStories)
          .where('isAuthorFeatured', isEqualTo: true)
          .orderBy('compositeQualityScore', descending: true)
          .limit(limit)
          .get();

      return snapshot.docs
          .map((doc) => Story.fromFirestore(doc.data(), doc.id))
          .toList();
    } catch (e) {
      throw _handleException(e, 'getFeaturedAuthorsStories');
    }
  }

  @override
  Future<List<Story>> getSeasonalCollection({String? season, int limit = 10}) async {
    try {
      Query<Map<String, dynamic>> query = _firestore
          .collection(AppConstants.firestoreStories)
          .where('isSeasonal', isEqualTo: true)
          .orderBy('compositeQualityScore', descending: true)
          .limit(limit);

      if (season != null && season.isNotEmpty) {
        query = query.where('season', isEqualTo: season);
      }

      final snapshot = await query.get();

      return snapshot.docs
          .map((doc) => Story.fromFirestore(doc.data(), doc.id))
          .toList();
    } catch (e) {
      throw _handleException(e, 'getSeasonalCollection');
    }
  }

  @override
  Future<Story?> getDailyLiteraryPick() async {
    try {
      final today = DateTime.now();
      final startOfDay = DateTime(today.year, today.month, today.day);
      final endOfDay = startOfDay.add(const Duration(days: 1));

      final snapshot = await _firestore
          .collection(AppConstants.firestoreStories)
          .where('isDailyPick', isEqualTo: true)
          .where('dailyPickDate', isGreaterThanOrEqualTo: Timestamp.fromDate(startOfDay))
          .where('dailyPickDate', isLessThan: Timestamp.fromDate(endOfDay))
          .limit(1)
          .get();

      if (snapshot.docs.isEmpty) {
        return null;
      }

      return Story.fromFirestore(snapshot.docs.first.data(), snapshot.docs.first.id);
    } catch (e) {
      throw _handleException(e, 'getDailyLiteraryPick');
    }
  }

  @override
  Future<void> incrementStoryViews(String storyId) async {
    try {
      await _firestore
          .collection(AppConstants.firestoreStories)
          .doc(storyId)
          .update({
        'viewCount': FieldValue.increment(1),
        'lastViewedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      throw _handleException(e, 'incrementStoryViews');
    }
  }

  @override
  Future<void> recordReadingProgress({
    required String userId,
    required String storyId,
    required String chapterId,
    required double progress,
  }) async {
    try {
      await _firestore
          .collection(AppConstants.firestoreReadingProgress)
          .doc('${userId}_$storyId')
          .set({
        'userId': userId,
        'storyId': storyId,
        'currentChapterId': chapterId,
        'progress': progress,
        'lastReadAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));
    } catch (e) {
      throw _handleException(e, 'recordReadingProgress');
    }
  }

  Exception _handleException(dynamic error, String method) {
    if (error is DioException) {
      return Exception('Network error in $method: ${error.message}');
    }
    if (error is FirebaseException) {
      return Exception('Firebase error in $method: ${error.message}');
    }
    return Exception('Error in $method: $error');
  }
}
