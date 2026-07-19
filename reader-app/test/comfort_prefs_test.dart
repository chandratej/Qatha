import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:katha_reader/core/providers/app_state.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('comfort prefs default off and persist round-trip', () async {
    SharedPreferences.setMockInitialValues({});
    final state = AppState();
    await state.hydrate();
    expect(state.calmMotion, isFalse);
    expect(state.highContrast, isFalse);

    state.setCalmMotion(true);
    state.setHighContrast(true);
    // _persist is fire-and-forget; let it complete.
    await Future<void>.delayed(Duration.zero);

    final restored = AppState();
    await restored.hydrate();
    expect(restored.calmMotion, isTrue);
    expect(restored.highContrast, isTrue);
  });

  test('ThemeMode.system survives restart (tri-state persistence)', () async {
    SharedPreferences.setMockInitialValues({});
    final state = AppState();
    await state.hydrate();

    // Choose dark, then explicitly return to system.
    state.setThemeMode(ThemeMode.dark);
    await Future<void>.delayed(Duration.zero);
    state.setThemeMode(ThemeMode.system);
    await Future<void>.delayed(Duration.zero);

    final restored = AppState();
    await restored.hydrate();
    expect(restored.themeMode, ThemeMode.system);
  });

  test('legacy bool theme key still honored when tri-state key absent',
      () async {
    SharedPreferences.setMockInitialValues({'katha_theme_dark': true});
    final state = AppState();
    await state.hydrate();
    expect(state.themeMode, ThemeMode.dark);
  });
}
