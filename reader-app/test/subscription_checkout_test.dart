import 'package:flutter_test/flutter_test.dart';
import 'package:katha_reader/core/services/subscription_service.dart';

void main() {
  test('SubscriptionCheckout parses order fields for native Razorpay', () {
    final c = SubscriptionCheckout.fromJson({
      'razorpay_key': 'rzp_test_x',
      'payments_ready': true,
      'mode': 'test',
      'amount': 9900,
      'currency': 'INR',
      'plan_name': 'Katha Unlimited',
      'description': 'test',
      'creator_share_pct': 40,
      'base_creator_share_pct': 40,
      'max_creator_share_pct': 60,
      'order_id': 'order_abc',
      'notes': {'user_id': 'u1', 'story_id_source': 's1'},
    });
    expect(c.canOpenNativeCheckout, isTrue);
    expect(c.orderId, 'order_abc');
    expect(c.shareLabel, contains('40%'));
    expect(c.shareLabel, contains('60%'));
  });

  test('canOpenNativeCheckout false without order', () {
    final c = SubscriptionCheckout.fromJson({
      'razorpay_key': 'rzp_test_x',
      'payments_ready': false,
      'amount': 9900,
    });
    expect(c.canOpenNativeCheckout, isFalse);
  });
}
