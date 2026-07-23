import 'package:flutter/widgets.dart';
import '../../l10n/generated/app_localizations.dart';
import 'app_config.dart';

/// Ladder-honest paywall strings — DEC-006 / PAYWALL-SUBSCRIPTION-UX-PATTERNS.
///
/// Localized via [AppLocalizations] — every member takes a [BuildContext]
/// since the strings are resolved at call time from the active locale.
class PaywallCopy {
  PaywallCopy._();

  static String priceMonthlyLabel(BuildContext context) =>
      AppLocalizations.of(context)!
          .paywallPriceMonthly(AppConfig.priceMonthly.toString());

  static String shareTransparency(BuildContext context) =>
      AppLocalizations.of(context)!.paywallShareTransparency(
        AppConfig.creatorSharePct.toString(),
        AppConfig.maxCreatorSharePct.toString(),
      );

  static String shareBullet(BuildContext context) =>
      AppLocalizations.of(context)!.paywallShareBullet(
        AppConfig.maxCreatorSharePct.toString(),
        AppConfig.priceMonthly.toString(),
      );

  static String subtitle(
    BuildContext context, {
    required bool hasLaunchTrial,
    required int trialDays,
  }) {
    final l10n = AppLocalizations.of(context)!;
    if (hasLaunchTrial) {
      return l10n.paywallSubtitleWithTrial(
        AppConfig.priceMonthly.toString(),
        trialDays,
      );
    }
    return l10n.paywallSubtitleNoTrial(
      AppConfig.priceMonthly.toString(),
      shareTransparency(context),
    );
  }

  static List<String> benefits(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return [
      l10n.paywallBenefitNewChapters,
      l10n.paywallBenefitOffline,
      l10n.paywallBenefitAdFree,
    ];
  }

  static String trustLine(BuildContext context) =>
      AppLocalizations.of(context)!.paywallTrustLine;
}
