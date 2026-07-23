import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:katha_reader/core/config/app_config.dart';
import 'package:katha_reader/core/config/paywall_copy.dart';
import 'package:katha_reader/l10n/generated/app_localizations.dart';

void main() {
  testWidgets('paywall copy uses ladder-honest share (DEC-006)', (
    tester,
  ) async {
    late BuildContext capturedContext;
    await tester.pumpWidget(
      MaterialApp(
        locale: const Locale('te'),
        supportedLocales: AppLocalizations.supportedLocales,
        localizationsDelegates: const [
          AppLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        home: Builder(
          builder: (context) {
            capturedContext = context;
            return const SizedBox.shrink();
          },
        ),
      ),
    );

    expect(AppConfig.creatorSharePct, 40);
    expect(AppConfig.maxCreatorSharePct, 60);
    expect(PaywallCopy.shareTransparency(capturedContext), contains('40%'));
    expect(PaywallCopy.shareTransparency(capturedContext), contains('60%'));
    expect(PaywallCopy.benefits(capturedContext), isNotEmpty);
    expect(PaywallCopy.priceMonthlyLabel(capturedContext), contains('99'));
  });
}
