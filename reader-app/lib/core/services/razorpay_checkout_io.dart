import 'dart:async';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'subscription_service.dart';

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

/// Native Razorpay Standard Checkout (UPI / cards) for Android & iOS.
class KathaRazorpayCheckout {
  Razorpay? _razorpay;
  Completer<RazorpayPaymentResult>? _pending;

  Future<RazorpayPaymentResult> open({
    required SubscriptionCheckout checkout,
    String? email,
    String? contact,
    String? name,
  }) async {
    if (checkout.razorpayKey == null || checkout.razorpayKey!.isEmpty) {
      return RazorpayPaymentResult.failed('Razorpay key missing');
    }
    if (checkout.orderId == null || checkout.orderId!.isEmpty) {
      return RazorpayPaymentResult.failed(
        checkout.orderError ?? 'Payment order not ready. Try again shortly.',
      );
    }

    _pending?.complete(
      RazorpayPaymentResult.failed('Another checkout is in progress'),
    );
    _pending = Completer<RazorpayPaymentResult>();

    _razorpay?.clear();
    _razorpay = Razorpay();
    _razorpay!.on(Razorpay.EVENT_PAYMENT_SUCCESS, _onSuccess);
    _razorpay!.on(Razorpay.EVENT_PAYMENT_ERROR, _onError);
    _razorpay!.on(Razorpay.EVENT_EXTERNAL_WALLET, _onExternalWallet);

    final options = <String, dynamic>{
      'key': checkout.razorpayKey,
      'amount': checkout.amountPaise,
      'currency': checkout.currency,
      'name': 'Katha',
      'description': checkout.description,
      'order_id': checkout.orderId,
      'timeout': 300,
      'prefill': {
        if (email != null && email.isNotEmpty) 'email': email,
        if (contact != null && contact.isNotEmpty) 'contact': contact,
        if (name != null && name.isNotEmpty) 'name': name,
      },
      'notes': {
        'product': 'katha_unlimited',
        'share': checkout.shareLabel,
      },
      'theme': {'color': '#C4A052'},
    };

    try {
      _razorpay!.open(options);
    } catch (e) {
      return RazorpayPaymentResult.failed('Payment could not be started. Please try again.');
    }

    return _pending!.future.timeout(
      const Duration(minutes: 6),
      onTimeout: () => RazorpayPaymentResult.failed('Payment timed out'),
    );
  }

  void _onSuccess(PaymentSuccessResponse response) {
    _complete(
      RazorpayPaymentResult(
        success: true,
        paymentId: response.paymentId,
        orderId: response.orderId,
        signature: response.signature,
      ),
    );
  }

  void _onError(PaymentFailureResponse response) {
    final code = response.code;
    final msg = response.message ?? 'Payment failed';
    _complete(RazorpayPaymentResult.failed(code != null ? '[$code] $msg' : msg));
  }

  void _onExternalWallet(ExternalWalletResponse response) {
    // User selected external wallet — wait for success/error events
  }

  void _complete(RazorpayPaymentResult result) {
    if (_pending != null && !_pending!.isCompleted) {
      _pending!.complete(result);
    }
  }

  void dispose() {
    _razorpay?.clear();
    _razorpay = null;
    if (_pending != null && !_pending!.isCompleted) {
      _pending!.complete(RazorpayPaymentResult.failed('Checkout cancelled'));
    }
    _pending = null;
  }
}
