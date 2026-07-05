import 'dart:convert';
import 'package:http/http.dart' as http;

class SubscriptionService {
  SubscriptionService({this.baseUrl = 'http://10.0.2.2:3001/api', this.userId, this.subscriptionStatus});

  final String baseUrl;
  final String? userId;
  final String? subscriptionStatus;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        'x-user-id': ?userId,
        'x-subscription-status': ?subscriptionStatus,
      };

  Future<Map<String, dynamic>> createCheckout({String? storyId}) async {
    final res = await http.post(
      Uri.parse('$baseUrl/subscriptions/create'),
      headers: _headers,
      body: jsonEncode({'story_id_source': storyId}),
    );
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode != 200) throw Exception(data['user_message'] ?? 'Checkout failed');
    return data;
  }

  Future<String> confirmSubscription(String checkoutId, {String? storyId}) async {
    final res = await http.post(
      Uri.parse('$baseUrl/subscriptions/confirm'),
      headers: _headers,
      body: jsonEncode({'checkout_id': checkoutId, 'story_id_source': storyId}),
    );
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode != 200) throw Exception(data['user_message'] ?? 'Payment failed');
    return data['subscription_status'] as String? ?? 'active';
  }
}