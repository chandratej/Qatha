import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:equatable/equatable.dart';

enum SubscriptionPlan {
  monthly,
  quarterly,
  yearly,
}

enum SubscriptionStatus {
  inactive,
  trial,
  active,
  expired,
  cancelled,
  paused,
}

enum PaymentProvider {
  googlePlay,
  appleAppStore,
  razorpay,
  stripe,
  web,
}

class Subscription extends Equatable {
  final String id;
  final String userId;
  final SubscriptionPlan planType;
  final SubscriptionStatus status;
  final DateTime startDate;
  final DateTime? endDate;
  final DateTime? trialEndDate;
  final DateTime? cancelDate;
  final bool autoRenew;
  final PaymentProvider paymentProvider;
  final String productId;
  final String receiptData;
  final double price;
  final String currency;
  final int billingCycle;
  final DateTime? gracePeriodEndsAt;
  final DateTime? pausedAt;
  final DateTime? resumedAt;

  const Subscription({
    required this.id,
    required this.userId,
    required this.planType,
    required this.status,
    required this.startDate,
    this.endDate,
    this.trialEndDate,
    this.cancelDate,
    required this.autoRenew,
    required this.paymentProvider,
    required this.productId,
    required this.receiptData,
    required this.price,
    required this.currency,
    required this.billingCycle,
    this.gracePeriodEndsAt,
    this.pausedAt,
    this.resumedAt,
  });

  @override
  List<Object?> get props => [
        id,
        userId,
        planType,
        status,
        startDate,
        endDate,
        trialEndDate,
        cancelDate,
        autoRenew,
        paymentProvider,
        productId,
        receiptData,
        price,
        currency,
        billingCycle,
        gracePeriodEndsAt,
        pausedAt,
        resumedAt,
      ];

  bool get isActive => status == SubscriptionStatus.active;
  
  bool get isTrial => 
      trialEndDate != null && 
      trialEndDate!.isAfter(DateTime.now()) &&
      status == SubscriptionStatus.trial;
  
  bool get willExpireSoon {
    if (endDate == null) return false;
    return endDate!.difference(DateTime.now()).inDays <= 3;
  }
  
  bool get isInGracePeriod {
    if (gracePeriodEndsAt == null) return false;
    return gracePeriodEndsAt!.isAfter(DateTime.now());
  }
  
  bool get canAccessPremium => isActive || isTrial || isInGracePeriod;
  
  factory Subscription.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Subscription(
      id: doc.id,
      userId: data['userId'] ?? '',
      planType: SubscriptionPlan.values.firstWhere(
        (e) => e.toString().split('.').last == data['planType'],
        orElse: () => SubscriptionPlan.monthly,
      ),
      status: SubscriptionStatus.values.firstWhere(
        (e) => e.toString().split('.').last == data['status'],
        orElse: () => SubscriptionStatus.inactive,
      ),
      startDate: (data['startDate'] as Timestamp?)?.toDate() ?? DateTime.now(),
      endDate: (data['endDate'] as Timestamp?)?.toDate(),
      trialEndDate: (data['trialEndDate'] as Timestamp?)?.toDate(),
      cancelDate: (data['cancelDate'] as Timestamp?)?.toDate(),
      autoRenew: data['autoRenew'] ?? false,
      paymentProvider: PaymentProvider.values.firstWhere(
        (e) => e.toString().split('.').last == data['paymentProvider'],
        orElse: () => PaymentProvider.web,
      ),
      productId: data['productId'] ?? '',
      receiptData: data['receiptData'] ?? '',
      price: (data['price'] ?? 0.0).toDouble(),
      currency: data['currency'] ?? 'USD',
      billingCycle: data['billingCycle'] ?? 1,
      gracePeriodEndsAt: (data['gracePeriodEndsAt'] as Timestamp?)?.toDate(),
      pausedAt: (data['pausedAt'] as Timestamp?)?.toDate(),
      resumedAt: (data['resumedAt'] as Timestamp?)?.toDate(),
    );
  }
  
  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'planType': planType.toString().split('.').last,
      'status': status.toString().split('.').last,
      'startDate': Timestamp.fromDate(startDate),
      'endDate': endDate != null ? Timestamp.fromDate(endDate!) : null,
      'trialEndDate': trialEndDate != null ? Timestamp.fromDate(trialEndDate!) : null,
      'cancelDate': cancelDate != null ? Timestamp.fromDate(cancelDate!) : null,
      'autoRenew': autoRenew,
      'paymentProvider': paymentProvider.toString().split('.').last,
      'productId': productId,
      'receiptData': receiptData,
      'price': price,
      'currency': currency,
      'billingCycle': billingCycle,
      'gracePeriodEndsAt': gracePeriodEndsAt != null ? Timestamp.fromDate(gracePeriodEndsAt!) : null,
      'pausedAt': pausedAt != null ? Timestamp.fromDate(pausedAt!) : null,
      'resumedAt': resumedAt != null ? Timestamp.fromDate(resumedAt!) : null,
    };
  }
}
