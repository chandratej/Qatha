import 'app_config.dart';

/// Ladder-honest paywall strings — DEC-006 / PAYWALL-SUBSCRIPTION-UX-PATTERNS.
class PaywallCopy {
  PaywallCopy._();

  static String get priceMonthlyLabel => '₹${AppConfig.priceMonthly}/month';

  static String get shareTransparency =>
      '${AppConfig.creatorSharePct}% base author share · up to ${AppConfig.maxCreatorSharePct}% at Apex Story Trust';

  static String get shareBullet =>
      'Up to ${AppConfig.maxCreatorSharePct}% of your ₹${AppConfig.priceMonthly} supports Telugu writers (Story Trust ladder)';

  static String subtitle({required bool hasLaunchTrial, required int trialDays}) {
    if (hasLaunchTrial) {
      return '₹${AppConfig.priceMonthly}/month after your $trialDays-day launch trial · No ads · No coins';
    }
    return '₹${AppConfig.priceMonthly}/month · No ads · No coins · $shareTransparency';
  }

  static const benefits = <String>[
    'Read every chapter the moment it drops',
    'Unlimited offline downloads',
    'Ad-free, distraction-free reading',
  ];

  static const trustLine = 'Cancel anytime · UPI auto-pay · Secure via Razorpay';
}
