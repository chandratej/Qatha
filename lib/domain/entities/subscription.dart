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
}
