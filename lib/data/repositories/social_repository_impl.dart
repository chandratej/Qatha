/// Social Repository Implementation
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:storyverse/domain/entities/review.dart';
import 'package:storyverse/domain/entities/comment.dart';
import 'package:storyverse/domain/repositories/social_repository.dart';
import 'package:storyverse/core/constants/app_constants.dart';

class SocialRepositoryImpl implements SocialRepository {
  final FirebaseFirestore _firestore;

  SocialRepositoryImpl({FirebaseFirestore? firestore})
      : _firestore = firestore ?? FirebaseFirestore.instance;

  @override
  Future<ReviewEntity?> getUserReview(String storyId, String userId) async {
    try {
      final doc = await _firestore
          .collection(AppConstants.firestoreReviews)
          .where('storyId', isEqualTo: storyId)
          .where('userId', isEqualTo: userId)
          .limit(1)
          .get();

      if (doc.docs.isEmpty) {
        return null;
      }

      return ReviewEntity.fromFirestore(doc.docs.first);
    } catch (e) {
      throw Exception('Failed to get review: $e');
    }
  }

  @override
  Future<List<ReviewEntity>> getStoryReviews(String storyId) async {
    try {
      final snapshot = await _firestore
          .collection(AppConstants.firestoreReviews)
          .where('storyId', isEqualTo: storyId)
          .orderBy('createdAt', descending: true)
          .get();

      return snapshot.docs
          .map((doc) => ReviewEntity.fromFirestore(doc))
          .toList();
    } catch (e) {
      throw Exception('Failed to get reviews: $e');
    }
  }

  @override
  Future<void> createReview(ReviewEntity review) async {
    try {
      await _firestore
          .collection(AppConstants.firestoreReviews)
          .add(review.toMap());
      
      // Update story rating
      await _updateStoryRating(review.storyId);
    } catch (e) {
      throw Exception('Failed to create review: $e');
    }
  }

  @override
  Future<void> updateReview(ReviewEntity review) async {
    try {
      await _firestore
          .collection(AppConstants.firestoreReviews)
          .doc(review.id)
          .update(review.toMap());
      
      // Update story rating
      await _updateStoryRating(review.storyId);
    } catch (e) {
      throw Exception('Failed to update review: $e');
    }
  }

  @override
  Future<void> deleteReview(String reviewId, String storyId) async {
    try {
      await _firestore
          .collection(AppConstants.firestoreReviews)
          .doc(reviewId)
          .delete();
      
      // Update story rating
      await _updateStoryRating(storyId);
    } catch (e) {
      throw Exception('Failed to delete review: $e');
    }
  }

  @override
  Future<List<CommentEntity>> getStoryComments(String storyId) async {
    try {
      final snapshot = await _firestore
          .collection(AppConstants.firestoreComments)
          .where('storyId', isEqualTo: storyId)
          .orderBy('createdAt', descending: true)
          .limit(AppConstants.commentsPerPage)
          .get();

      return snapshot.docs
          .map((doc) => CommentEntity.fromFirestore(doc))
          .toList();
    } catch (e) {
      throw Exception('Failed to get comments: $e');
    }
  }

  @override
  Future<List<CommentEntity>> getChapterComments(String chapterId) async {
    try {
      final snapshot = await _firestore
          .collection(AppConstants.firestoreComments)
          .where('chapterId', isEqualTo: chapterId)
          .orderBy('createdAt', descending: true)
          .limit(AppConstants.commentsPerPage)
          .get();

      return snapshot.docs
          .map((doc) => CommentEntity.fromFirestore(doc))
          .toList();
    } catch (e) {
      throw Exception('Failed to get chapter comments: $e');
    }
  }

  @override
  Future<void> createComment(CommentEntity comment) async {
    try {
      await _firestore
          .collection(AppConstants.firestoreComments)
          .add(comment.toMap());
    } catch (e) {
      throw Exception('Failed to create comment: $e');
    }
  }

  @override
  Future<void> updateComment(CommentEntity comment) async {
    try {
      await _firestore
          .collection(AppConstants.firestoreComments)
          .doc(comment.id)
          .update(comment.toMap());
    } catch (e) {
      throw Exception('Failed to update comment: $e');
    }
  }

  @override
  Future<void> deleteComment(String commentId) async {
    try {
      await _firestore
          .collection(AppConstants.firestoreComments)
          .doc(commentId)
          .delete();
    } catch (e) {
      throw Exception('Failed to delete comment: $e');
    }
  }

  @override
  Future<void> addReaction(String targetId, String type, String userId) async {
    try {
      await _firestore
          .collection(AppConstants.firestoreReactions)
          .add({
        'targetId': targetId,
        'type': type,
        'userId': userId,
        'createdAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      throw Exception('Failed to add reaction: $e');
    }
  }

  @override
  Future<Map<String, int>> getReactions(String targetId) async {
    try {
      final snapshot = await _firestore
          .collection(AppConstants.firestoreReactions)
          .where('targetId', isEqualTo: targetId)
          .get();

      final reactions = <String, int>{};
      for (final doc in snapshot.docs) {
        final type = doc['type'] as String;
        reactions[type] = (reactions[type] ?? 0) + 1;
      }

      return reactions;
    } catch (e) {
      throw Exception('Failed to get reactions: $e');
    }
  }

  Future<void> _updateStoryRating(String storyId) async {
    try {
      final reviews = await getStoryReviews(storyId);
      
      if (reviews.isEmpty) {
        await _firestore
            .collection(AppConstants.firestoreStories)
            .doc(storyId)
            .update({
          'averageRating': 0.0,
          'ratingCount': 0,
        });
        return;
      }

      double total = 0.0;
      for (final review in reviews) {
        total += review.rating;
      }

      final average = total / reviews.length;

      await _firestore
          .collection(AppConstants.firestoreStories)
          .doc(storyId)
          .update({
        'averageRating': average,
        'ratingCount': reviews.length,
      });
    } catch (e) {
      // Silently fail - rating update is not critical
    }
  }
}
