import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class SubscriptionCheckout {
  final String? razorpayKey;
  final bool paymentsReady;
  final String mode;
  final int amountPaise;
  final String currency;
  final String planName;
  final String description;
  final int creatorSharePct;
  final int baseCreatorSharePct;
  final int maxCreatorSharePct;
  final String? orderId;
  final String? orderError;
  final Map<String, dynamic>? storyTrust;
  final Map<String, dynamic>? notes;
  final Map<String, dynamic> raw;

  const SubscriptionCheckout({
    required this.razorpayKey,
    required this.paymentsReady,
    required this.mode,
    required this.amountPaise,
    required this.currency,
    required this.planName,
    required this.description,
    required this.creatorSharePct,
    required this.baseCreatorSharePct,
    required this.maxCreatorSharePct,
    this.orderId,
    this.orderError,
    this.storyTrust,
    this.notes,
    required this.raw,
  });

  factory SubscriptionCheckout.fromJson(Map<String, dynamic> data) {
    return SubscriptionCheckout(
      razorpayKey: data['razorpay_key'] as String?,
      paymentsReady: data['payments_ready'] as bool? ?? false,
      mode: data['mode'] as String? ?? 'unconfigured',
      amountPaise: data['amount'] as int? ?? AppConfig.priceMonthly * 100,
      currency: data['currency'] as String? ?? 'INR',
      planName: data['plan_name'] as String? ?? 'Katha Unlimited',
      description: data['description'] as String? ?? '',
      creatorSharePct: data['creator_share_pct'] as int? ?? AppConfig.creatorSharePct,
      baseCreatorSharePct: data['base_creator_share_pct'] as int? ?? 40,
      maxCreatorSharePct: data['max_creator_share_pct'] as int? ?? 60,
      orderId: data['order_id'] as String?,
      orderError: data['order_error'] as String?,
      storyTrust: data['story_trust'] as Map<String, dynamic>?,
      notes: data['notes'] is Map
          ? Map<String, dynamic>.from(data['notes'] as Map)
          : null,
      raw: data,
    );
  }

  String get shareLabel =>
      '$baseCreatorSharePct% base · up to $maxCreatorSharePct% at Apex Story Trust';

  bool get canOpenNativeCheckout =>
      paymentsReady &&
      razorpayKey != null &&
      razorpayKey!.isNotEmpty &&
      orderId != null &&
      orderId!.isNotEmpty;
}

class SubscriptionService {
  SubscriptionService({
    String? baseUrl,
    this.userId,
    this.subscriptionStatus,
    this.accessToken,
  }) : baseUrl = baseUrl ?? AppConfig.apiBase;

  final String baseUrl;
  final String? userId;
  final String? subscriptionStatus;
  final String? accessToken;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (accessToken != null && accessToken!.isNotEmpty)
          'Authorization': 'Bearer $accessToken',
        if (userId != null) 'x-user-id': userId!,
        if (subscriptionStatus != null) 'x-subscription-status': subscriptionStatus!,
      };

  Future<SubscriptionCheckout> createCheckout({
    String? storyId,
    String? creatorId,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/subscriptions/create'),
      headers: _headers,
      body: jsonEncode({
        if (storyId != null) 'story_id_source': storyId,
        if (creatorId != null) 'creator_id_source': creatorId,
      }),
    );
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode != 200) {
      throw Exception(data['user_message'] ?? data['error'] ?? 'Checkout failed');
    }
    return SubscriptionCheckout.fromJson(data);
  }

  /// Confirms against server ledger / verified signature. Never invents active status.
  Future<Map<String, dynamic>> confirmSubscription({
    String? storyId,
    String? creatorId,
    String? razorpayPaymentId,
    String? razorpaySubscriptionId,
    String? razorpayOrderId,
    String? razorpaySignature,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/subscriptions/confirm'),
      headers: _headers,
      body: jsonEncode({
        if (storyId != null) 'story_id_source': storyId,
        if (creatorId != null) 'creator_id_source': creatorId,
        if (razorpayPaymentId != null) 'razorpay_payment_id': razorpayPaymentId,
        if (razorpaySubscriptionId != null)
          'razorpay_subscription_id': razorpaySubscriptionId,
        if (razorpayOrderId != null) 'razorpay_order_id': razorpayOrderId,
        if (razorpaySignature != null) 'razorpay_signature': razorpaySignature,
      }),
    );
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode != 200) {
      throw Exception(data['user_message'] ?? data['error'] ?? 'Payment confirmation failed');
    }
    return data;
  }

  Future<Map<String, dynamic>> fetchStatus() async {
    final res = await http.get(
      Uri.parse('$baseUrl/subscriptions/status'),
      headers: _headers,
    );
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode != 200) {
      throw Exception(data['user_message'] ?? data['error'] ?? 'Status failed');
    }
    return data;
  }
}
