import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:katha_reader/core/providers/app_state.dart';
import 'package:katha_reader/core/theme/katha_theme.dart';
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

  test('easy reading preset defaults off, persists, and overrides line height',
      () async {
    SharedPreferences.setMockInitialValues({});
    final state = AppState();
    await state.hydrate();
    expect(state.easyReading, isFalse);
    final beforeLineHeight = state.effectiveLineHeight;

    state.setEasyReading(true);
    await Future<void>.delayed(Duration.zero);
    expect(state.effectiveLineHeight, greaterThan(beforeLineHeight));

    final restored = AppState();
    await restored.hydrate();
    expect(restored.easyReading, isTrue);
  });

  test('eye-break reminder defaults off, only accepts 90/120, and persists',
      () async {
    SharedPreferences.setMockInitialValues({});
    final state = AppState();
    await state.hydrate();
    expect(state.eyeBreakMinutes, 0);

    state.setEyeBreakMinutes(45); // not an allowed value
    expect(state.eyeBreakMinutes, 0);

    state.setEyeBreakMinutes(90);
    expect(state.eyeBreakMinutes, 90);
    await Future<void>.delayed(Duration.zero);

    final restored = AppState();
    await restored.hydrate();
    expect(restored.eyeBreakMinutes, 90);
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

  test('reading tone defaults to paper and persists independently of themeMode',
      () async {
    SharedPreferences.setMockInitialValues({});
    final state = AppState();
    await state.hydrate();
    expect(state.readingTone, ReadingTone.paper);

    // Reading tone and app theme are deliberately independent settings.
    state.setReadingTone(ReadingTone.sepia);
    state.setThemeMode(ThemeMode.dark);
    await Future<void>.delayed(Duration.zero);

    final restored = AppState();
    await restored.hydrate();
    expect(restored.readingTone, ReadingTone.sepia);
    expect(restored.themeMode, ThemeMode.dark);

    restored.setReadingTone(ReadingTone.night);
    await Future<void>.delayed(Duration.zero);
    final restored2 = AppState();
    await restored2.hydrate();
    expect(restored2.readingTone, ReadingTone.night);
  });

  test(
      'notification prompt defaults unshown, marks shown once, is idempotent, and persists',
      () async {
    SharedPreferences.setMockInitialValues({});
    final state = AppState();
    await state.hydrate();
    expect(state.notificationPromptShown, isFalse);

    var notifyCount = 0;
    state.addListener(() => notifyCount++);
    state.markNotificationPromptShown();
    expect(state.notificationPromptShown, isTrue);
    expect(notifyCount, 1);

    // Idempotent — never re-triggers once already shown.
    state.markNotificationPromptShown();
    expect(notifyCount, 1);
    await Future<void>.delayed(Duration.zero);

    final restored = AppState();
    await restored.hydrate();
    expect(restored.notificationPromptShown, isTrue);
  });
}
