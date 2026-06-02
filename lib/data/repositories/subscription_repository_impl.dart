/// Subscription Repository Implementation
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:storyverse/domain/entities/subscription.dart';
import 'package:storyverse/domain/repositories/subscription_repository.dart';
import 'package:storyverse/core/constants/app_constants.dart';

class SubscriptionRepositoryImpl implements SubscriptionRepository {
  final FirebaseFirestore _firestore;

  SubscriptionRepositoryImpl({FirebaseFirestore? firestore})
      : _firestore = firestore ?? FirebaseFirestore.instance;

  @override
  Future<SubscriptionEntity?> getUserSubscription(String userId) async {
    try {
      final doc = await _firestore
          .collection(AppConstants.firestoreSubscriptions)
          .doc(userId)
          .get();

      if (!doc.exists) {
        return null;
      }

      return SubscriptionEntity.fromFirestore(doc);
    } catch (e) {
      throw Exception('Failed to get subscription: $e');
    }
  }

  @override
  Future<void> createSubscription(SubscriptionEntity subscription) async {
    try {
      await _firestore
          .collection(AppConstants.firestoreSubscriptions)
          .doc(subscription.userId)
          .set(subscription.toMap());
    } catch (e) {
      throw Exception('Failed to create subscription: $e');
    }
  }

  @override
  Future<void> updateSubscription(SubscriptionEntity subscription) async {
    try {
      await _firestore
          .collection(AppConstants.firestoreSubscriptions)
          .doc(subscription.userId)
          .update(subscription.toMap());
    } catch (e) {
      throw Exception('Failed to update subscription: $e');
    }
  }

  @override
  Future<void> cancelSubscription(String userId) async {
    try {
      await _firestore
          .collection(AppConstants.firestoreSubscriptions)
          .doc(userId)
          .update({
        'status': 'cancelled',
        'cancelledAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      throw Exception('Failed to cancel subscription: $e');
    }
  }

  @override
  Future<bool> isPremiumUser(String userId) async {
    try {
      final subscription = await getUserSubscription(userId);
      
      if (subscription == null) {
        return false;
      }

      return subscription.status == 'active' &&
          subscription.expiryDate.isAfter(DateTime.now());
    } catch (e) {
      return false;
    }
  }

  @override
  Future<List<SubscriptionEntity>> getActiveSubscriptions() async {
    try {
      final snapshot = await _firestore
          .collection(AppConstants.firestoreSubscriptions)
          .where('status', isEqualTo: 'active')
          .where('expiryDate', isGreaterThan: Timestamp.now())
          .get();

      return snapshot.docs
          .map((doc) => SubscriptionEntity.fromFirestore(doc))
          .toList();
    } catch (e) {
      throw Exception('Failed to get active subscriptions: $e');
    }
  }

  @override
  Future<Map<String, dynamic>> getSubscriptionAnalytics() async {
    try {
      final snapshot = await _firestore
          .collection(AppConstants.firestoreSubscriptions)
          .get();

      final docs = snapshot.docs;
      final total = docs.length;
      final active = docs.where((d) => d['status'] == 'active').length;
      final cancelled = docs.where((d) => d['status'] == 'cancelled').length;
      
      final monthlyRevenue = docs.fold<double>(
        0.0,
        (sum, d) => sum + ((d['amount'] as num?)?.toDouble() ?? 0.0),
      );

      return {
        'totalSubscriptions': total,
        'activeSubscriptions': active,
        'cancelledSubscriptions': cancelled,
        'monthlyRevenue': monthlyRevenue,
        'conversionRate': total > 0 ? active / total : 0.0,
      };
    } catch (e) {
      throw Exception('Failed to get subscription analytics: $e');
    }
  }
}
