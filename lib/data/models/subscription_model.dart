import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../domain/entities/subscription.dart';

class SubscriptionModel extends Subscription {
  const SubscriptionModel({
    required super.id,
    required super.userId,
    required super.planType,
    required super.status,
    required super.startDate,
    required super.endDate,
    required super.trialEndDate,
    required super.cancelDate,
    required super.autoRenew,
    required super.paymentProvider,
    required super.productId,
    required super.receiptData,
    required super.price,
    required super.currency,
    required super.billingCycle,
    required super.gracePeriodEndsAt,
    required super.pausedAt,
    required super.resumedAt,
  });

  factory SubscriptionModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return SubscriptionModel(
      id: doc.id,
      userId: data['userId'] ?? '',
      planType: SubscriptionPlan.values.firstWhere(
        (e) => e.name == data['planType'],
        orElse: () => SubscriptionPlan.monthly,
      ),
      status: SubscriptionStatus.values.firstWhere(
        (e) => e.name == data['status'],
        orElse: () => SubscriptionStatus.inactive,
      ),
      startDate: (data['startDate'] as Timestamp?)?.toDate() ?? DateTime.now(),
      endDate: (data['endDate'] as Timestamp?)?.toDate(),
      trialEndDate: (data['trialEndDate'] as Timestamp?)?.toDate(),
      cancelDate: (data['cancelDate'] as Timestamp?)?.toDate(),
      autoRenew: data['autoRenew'] ?? true,
      paymentProvider: PaymentProvider.values.firstWhere(
        (e) => e.name == data['paymentProvider'],
        orElse: () => PaymentProvider.googlePlay,
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
      'id': id,
      'userId': userId,
      'planType': planType.name,
      'status': status.name,
      'startDate': Timestamp.fromDate(startDate),
      'endDate': endDate != null ? Timestamp.fromDate(endDate!) : null,
      'trialEndDate': trialEndDate != null ? Timestamp.fromDate(trialEndDate!) : null,
      'cancelDate': cancelDate != null ? Timestamp.fromDate(cancelDate!) : null,
      'autoRenew': autoRenew,
      'paymentProvider': paymentProvider.name,
      'productId': productId,
      'receiptData': receiptData,
      'price': price,
      'currency': currency,
      'billingCycle': billingCycle,
      'gracePeriodEndsAt': gracePeriodEndsAt != null 
          ? Timestamp.fromDate(gracePeriodEndsAt!) 
          : null,
      'pausedAt': pausedAt != null ? Timestamp.fromDate(pausedAt!) : null,
      'resumedAt': resumedAt != null ? Timestamp.fromDate(resumedAt!) : null,
    };
  }

  SubscriptionModel copyWith({
    String? id,
    String? userId,
    SubscriptionPlan? planType,
    SubscriptionStatus? status,
    DateTime? startDate,
    DateTime? endDate,
    DateTime? trialEndDate,
    DateTime? cancelDate,
    bool? autoRenew,
    PaymentProvider? paymentProvider,
    String? productId,
    String? receiptData,
    double? price,
    String? currency,
    int? billingCycle,
    DateTime? gracePeriodEndsAt,
    DateTime? pausedAt,
    DateTime? resumedAt,
  }) {
    return SubscriptionModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      planType: planType ?? this.planType,
      status: status ?? this.status,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      trialEndDate: trialEndDate ?? this.trialEndDate,
      cancelDate: cancelDate ?? this.cancelDate,
      autoRenew: autoRenew ?? this.autoRenew,
      paymentProvider: paymentProvider ?? this.paymentProvider,
      productId: productId ?? this.productId,
      receiptData: receiptData ?? this.receiptData,
      price: price ?? this.price,
      currency: currency ?? this.currency,
      billingCycle: billingCycle ?? this.billingCycle,
      gracePeriodEndsAt: gracePeriodEndsAt ?? this.gracePeriodEndsAt,
      pausedAt: pausedAt ?? this.pausedAt,
      resumedAt: resumedAt ?? this.resumedAt,
    );
  }

  static SubscriptionModel fromEntity(Subscription subscription) {
    return SubscriptionModel(
      id: subscription.id,
      userId: subscription.userId,
      planType: subscription.planType,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      trialEndDate: subscription.trialEndDate,
      cancelDate: subscription.cancelDate,
      autoRenew: subscription.autoRenew,
      paymentProvider: subscription.paymentProvider,
      productId: subscription.productId,
      receiptData: subscription.receiptData,
      price: subscription.price,
      currency: subscription.currency,
      billingCycle: subscription.billingCycle,
      gracePeriodEndsAt: subscription.gracePeriodEndsAt,
      pausedAt: subscription.pausedAt,
      resumedAt: subscription.resumedAt,
    );
  }

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
}
