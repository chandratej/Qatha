import 'subscription_service.dart';

/// Web / unsupported platforms — native Razorpay SDK unavailable.
class KathaRazorpayCheckout {
  Future<RazorpayPaymentResult> open({
    required SubscriptionCheckout checkout,
    String? email,
    String? contact,
    String? name,
  }) async {
    return RazorpayPaymentResult.failed(
      'In-app UPI checkout is available on Android and iOS. '
      'Use the Katha mobile app, or complete payment when payments are enabled on this platform.',
    );
  }

  void dispose() {}
}

class RazorpayPaymentResult {
  final bool success;
  final String? paymentId;
  final String? orderId;
  final String? signature;
  final String? errorMessage;

  const RazorpayPaymentResult({
    required this.success,
    this.paymentId,
    this.orderId,
    this.signature,
    this.errorMessage,
  });

  factory RazorpayPaymentResult.failed(String message) =>
      RazorpayPaymentResult(success: false, errorMessage: message);
}
