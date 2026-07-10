class LaunchOfferConfig {
  final String mode;
  final String label;
  final String description;
  final int trialDays;
  final int? foundingLimit;
  final int subscriptionGateChapter;
  final int freeChapters;
  final int otpGateChapter;
  final int? foundingSlotsRemaining;
  final bool paywallActive;

  const LaunchOfferConfig({
    required this.mode,
    required this.label,
    required this.description,
    required this.trialDays,
    this.foundingLimit,
    required this.subscriptionGateChapter,
    required this.freeChapters,
    required this.otpGateChapter,
    this.foundingSlotsRemaining,
    required this.paywallActive,
  });

  bool get hasLaunchTrial => trialDays > 0 && mode != 'immediate';

  factory LaunchOfferConfig.fromJson(Map<String, dynamic> json) {
    return LaunchOfferConfig(
      mode: json['mode'] as String? ?? 'immediate',
      label: json['label'] as String? ?? 'Immediate paywall',
      description: json['description'] as String? ?? '',
      trialDays: json['trial_days'] as int? ?? 0,
      foundingLimit: json['founding_limit'] as int?,
      subscriptionGateChapter: json['subscription_gate_chapter'] as int? ?? 6,
      freeChapters: json['free_chapters'] as int? ?? 3,
      otpGateChapter: json['otp_gate_chapter'] as int? ?? 4,
      foundingSlotsRemaining: json['founding_slots_remaining'] as int?,
      paywallActive: json['paywall_active'] as bool? ?? true,
    );
  }

  static const fallback = LaunchOfferConfig(
    mode: 'immediate',
    label: 'Immediate paywall at subscription gate',
    description: 'Ch 1–3 free → Ch 4 OTP → paywall at Chapter 6.',
    trialDays: 0,
    subscriptionGateChapter: 6,
    freeChapters: 3,
    otpGateChapter: 4,
    paywallActive: true,
  );

  String get paywallSubtitle {
    // DEC-006 ladder honesty — see PaywallCopy for full benefit list
    if (hasLaunchTrial) {
      return '₹99/month after your $trialDays-day launch trial · No ads · No coins · up to 60% to writers';
    }
    return '₹99/month · No ads · No coins · 40% base · up to 60% at Apex';
  }
}