import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:storyverse/domain/entities/user.dart' as domain;
import '../../../core/constants/app_constants.dart';

/// Remote data source for user operations
abstract class UserRemoteDataSource {
  /// Gets user by ID from Firestore
  Future<domain.User?> getUserById(String userId);

  /// Creates a new user in Firestore
  Future<void> createUser(domain.User user);

  /// Updates user data in Firestore
  Future<void> updateUser(domain.User user);

  /// Searches users by query
  Future<List<domain.User>> searchUsers(String query);

  /// Gets user by email
  Future<domain.User?> getUserByEmail(String email);

  /// Deletes user from Firestore
  Future<void> deleteUser(String userId);
}

class UserRemoteDataSourceImpl implements UserRemoteDataSource {
  final FirebaseFirestore firestore;

  UserRemoteDataSourceImpl({required this.firestore});

  @override
  Future<domain.User?> getUserById(String userId) async {
    try {
      final doc = await firestore
          .collection(AppConstants.firestoreUsers)
          .doc(userId)
          .get();

      if (!doc.exists) return null;

      return domain.User.fromFirestore(doc);
    } catch (e) {
      throw Exception('Failed to get user: $e');
    }
  }

  @override
  Future<void> createUser(domain.User user) async {
    try {
      await firestore
          .collection(AppConstants.firestoreUsers)
          .doc(user.id)
          .set(user.toMap());
    } catch (e) {
      throw Exception('Failed to create user: $e');
    }
  }

  @override
  Future<void> updateUser(domain.User user) async {
    try {
      await firestore
          .collection(AppConstants.firestoreUsers)
          .doc(user.id)
          .update(user.toMap());
    } catch (e) {
      throw Exception('Failed to update user: $e');
    }
  }

  @override
  Future<List<domain.User>> searchUsers(String query) async {
    try {
      // Basic search - in production, use Algolia or Elasticsearch
      final snapshot = await firestore
          .collection(AppConstants.firestoreUsers)
          .where('displayName', isGreaterThanOrEqualTo: query)
          .where('displayName', isLessThanOrEqualTo: '$query\uf8ff')
          .limit(20)
          .get();

      return snapshot.docs
          .map((doc) => domain.User.fromFirestore(doc))
          .toList();
    } catch (e) {
      return [];
    }
  }

  @override
  Future<domain.User?> getUserByEmail(String email) async {
    try {
      final snapshot = await firestore
          .collection(AppConstants.firestoreUsers)
          .where('email', isEqualTo: email)
          .limit(1)
          .get();

      if (snapshot.docs.isEmpty) return null;

      return domain.User.fromFirestore(snapshot.docs.first);
    } catch (e) {
      throw Exception('Failed to get user by email: $e');
    }
  }

  @override
  Future<void> deleteUser(String userId) async {
    try {
      await firestore.collection(AppConstants.firestoreUsers).doc(userId).delete();
    } catch (e) {
      throw Exception('Failed to delete user: $e');
    }
  }
}
