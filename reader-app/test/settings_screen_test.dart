import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:katha_reader/core/providers/app_state.dart';
import 'package:katha_reader/core/providers/auth_state.dart';
import 'package:katha_reader/core/theme/katha_theme.dart';
import 'package:katha_reader/screens/settings_screen.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  Future<AppState> hydratedAppState() async {
    SharedPreferences.setMockInitialValues({});
    final state = AppState();
    await state.hydrate();
    return state;
  }

  Widget host(AppState appState, {Size? surface}) => MultiProvider(
        providers: [
          ChangeNotifierProvider.value(value: appState),
          ChangeNotifierProvider(create: (_) => AuthState()),
        ],
        child: MaterialApp(
          theme: KathaTheme.light(),
          home: const SettingsScreen(),
        ),
      );

  Future<void> scrollTo(WidgetTester tester, Finder finder) async {
    await tester.scrollUntilVisible(finder, 200,
        scrollable: find.byType(Scrollable).first);
    await tester.pumpAndSettle();
  }

  testWidgets('settings screen renders without exceptions (phone width)',
      (tester) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    final appState = await hydratedAppState();
    await tester.pumpWidget(host(appState));
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    expect(find.text('Font size'), findsOneWidget);
    await scrollTo(tester, find.text('Calm motion'));
    expect(find.text('Calm motion'), findsOneWidget);
    await scrollTo(tester, find.text('High contrast'));
    expect(find.text('High contrast'), findsOneWidget);
  });

  testWidgets('settings interactions: theme segments and comfort switches',
      (tester) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    final appState = await hydratedAppState();
    await tester.pumpWidget(host(appState));
    await tester.pumpAndSettle();

    await scrollTo(tester, find.text('Dark'));
    await tester.tap(find.text('Dark'));
    await tester.pumpAndSettle();
    expect(appState.themeMode, ThemeMode.dark);

    await scrollTo(tester, find.text('Calm motion'));
    await tester.tap(find.byType(Switch).first, warnIfMissed: false);
    await tester.pumpAndSettle();
    expect(appState.calmMotion, isTrue);
    expect(tester.takeException(), isNull);
  });

  testWidgets('settings renders logged-in account section (trial user)',
      (tester) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    // Restore-from-prefs path: Supabase is uninitialized in tests, so
    // AuthState.init() falls back to the persisted user JSON.
    SharedPreferences.setMockInitialValues({
      'katha_user':
          '{"id":"u1","phone":"","email":"reader@katha.test","display_name":"పరీక్ష పాఠకుడు","subscription_status":"trial","trial_ends_at":"2027-01-01T00:00:00Z","launch_trial_granted":true,"launch_trial_days":30}',
      'katha_token': 'tok',
    });
    final appState = AppState();
    await appState.hydrate();
    final auth = AuthState();
    await auth.init();
    expect(auth.isLoggedIn, isTrue, reason: 'prefs restore should log in');

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider.value(value: appState),
          ChangeNotifierProvider.value(value: auth),
        ],
        child: MaterialApp(
          theme: KathaTheme.light(),
          home: const SettingsScreen(),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);

    await scrollTo(tester, find.text('పరీక్ష పాఠకుడు'));
    expect(find.text('Sign out'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('settings survives narrow width without overflow',
      (tester) async {
    await tester.binding.setSurfaceSize(const Size(320, 700));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    final appState = await hydratedAppState();
    await tester.pumpWidget(host(appState));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  });
}
