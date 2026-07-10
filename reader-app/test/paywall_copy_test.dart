import 'package:flutter_test/flutter_test.dart';
import 'package:katha_reader/core/config/app_config.dart';
import 'package:katha_reader/core/config/paywall_copy.dart';

void main() {
  test('paywall copy uses ladder-honest share (DEC-006)', () {
    expect(AppConfig.creatorSharePct, 40);
    expect(AppConfig.maxCreatorSharePct, 60);
    expect(PaywallCopy.shareTransparency, contains('40%'));
    expect(PaywallCopy.shareTransparency, contains('60%'));
    expect(PaywallCopy.benefits, isNotEmpty);
    expect(PaywallCopy.priceMonthlyLabel, contains('99'));
  });
}
