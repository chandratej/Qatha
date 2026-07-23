import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/katha_theme.dart';

class AppState extends ChangeNotifier {
  static const _prefTheme = 'katha_theme_dark';
  static const _prefFont = 'katha_font_scale';
  static const _prefLineHeight = 'katha_line_height';
  static const _prefAlign = 'katha_text_align';
  static const _prefReadingTone = 'katha_reading_tone';
  static const _prefStoryId = 'katha_continue_story_id';
  static const _prefStoryTitle = 'katha_continue_story_title';
  static const _prefChapter = 'katha_continue_chapter';
  static const _prefGenre = 'katha_last_genre';
  static const _prefNotifyChapters = 'katha_notify_chapters';
  static const _prefNotifySub = 'katha_notify_sub';
  static const _prefNotifyTrend = 'katha_notify_trend';
  static const _prefCalmMotion = 'katha_calm_motion';
  static const _prefHighContrast = 'katha_high_contrast';
  static const _prefEasyReading = 'katha_easy_reading';
  static const _prefEyeBreakMinutes = 'katha_eye_break_minutes';
  static const _prefNotificationPromptShown = 'katha_notification_prompt_shown';

  ThemeMode _themeMode = ThemeMode.system;
  int _fontScale = 2; // 1-5 per world-class standards
  int _lineHeightScale = 2; // 1=compact 1.6, 2=comfort 1.8, 3=spacious 1.95
  String _textAlign =
      'left'; // left | justify (default left for readability/dyslexia)
  // Reading canvas tone — independent of app-wide themeMode, matching the
  // Kindle/Apple Books convention that a book's page color is its own choice.
  ReadingTone _readingTone = ReadingTone.paper;
  String? _continueReadingStoryId;
  String? _continueReadingTitle;
  int _continueReadingChapter = 1;
  String _lastGenre = 'romance';
  bool _notifyNewChapters = true;
  bool _notifySubscription = true;
  bool _notifyTrending = true;
  bool _calmMotion = false;
  bool _highContrast = false;
  // "Easy Reading" preset (2.8): no open-license font covering Telugu script
  // reads as genuinely dyslexia-friendly, so this widens letter/line spacing
  // and steps up weight on the existing Noto Sans Telugu stack instead of
  // swapping fonts — see katha-reader-app-completion-and-beautification-prompt.md §2.8.
  bool _easyReading = false;
  // Eye-break reminder (§2.5) — 0 means off (the default). Opt-in only; never
  // interrupts mid-chapter, only checked at chapter boundaries (see reader_screen.dart).
  int _eyeBreakMinutes = 0;
  // §2.3 — whether the app has ever shown its own pre-permission explainer /
  // requested the OS notification permission. Never re-shown once true, even
  // if the OS permission was denied — a one-time gentle Settings reminder
  // (see settings_screen.dart) replaces any further prompting.
  bool _notificationPromptShown = false;
  bool _hydrated = false;

  ThemeMode get themeMode => _themeMode;
  int get fontScale => _fontScale;
  int get lineHeightScale => _lineHeightScale;
  String get textAlign => _textAlign;
  bool get isLeftAlign => _textAlign == 'left';
  ReadingTone get readingTone => _readingTone;
  String? get continueReadingStoryId => _continueReadingStoryId;
  String? get continueReadingTitle => _continueReadingTitle;
  int get continueReadingChapter => _continueReadingChapter;
  String get lastGenre => _lastGenre;
  bool get hasContinueReading => _continueReadingStoryId != null;
  bool get notifyNewChapters => _notifyNewChapters;
  bool get notifySubscription => _notifySubscription;
  bool get notifyTrending => _notifyTrending;

  /// Suppress decorative animation app-wide, independent of the OS setting.
  bool get calmMotion => _calmMotion;

  /// Stronger text and border contrast for tired eyes / bright light.
  bool get highContrast => _highContrast;

  /// Easy Reading preset — wider letter/line spacing + heavier weight for
  /// dyslexia-friendlier reading, on the existing Telugu font (see field doc above).
  bool get easyReading => _easyReading;

  /// 0 = off, otherwise the reminder interval in minutes (90 or 120).
  int get eyeBreakMinutes => _eyeBreakMinutes;

  /// Whether the app has already shown its notification-permission explainer once.
  bool get notificationPromptShown => _notificationPromptShown;
  bool get isHydrated => _hydrated;

  static const _prefThemeMode = 'katha_theme_mode';

  Future<void> hydrate() async {
    final prefs = await SharedPreferences.getInstance();
    // Tri-state ('system'|'light'|'dark'); falls back to the legacy bool key.
    final mode = prefs.getString(_prefThemeMode);
    if (mode != null) {
      _themeMode = switch (mode) {
        'dark' => ThemeMode.dark,
        'light' => ThemeMode.light,
        _ => ThemeMode.system,
      };
    } else {
      final isDark = prefs.getBool(_prefTheme);
      _themeMode = isDark == null
          ? ThemeMode.system
          : (isDark ? ThemeMode.dark : ThemeMode.light);
    }
    _fontScale = prefs.getInt(_prefFont) ?? 2;
    _lineHeightScale = prefs.getInt(_prefLineHeight) ?? 2;
    _textAlign = prefs.getString(_prefAlign) ?? 'left';
    _readingTone = switch (prefs.getString(_prefReadingTone)) {
      'sepia' => ReadingTone.sepia,
      'night' => ReadingTone.night,
      _ => ReadingTone.paper,
    };
    _continueReadingStoryId = prefs.getString(_prefStoryId);
    _continueReadingTitle = prefs.getString(_prefStoryTitle);
    _continueReadingChapter = prefs.getInt(_prefChapter) ?? 1;
    _lastGenre = prefs.getString(_prefGenre) ?? 'romance';
    _notifyNewChapters = prefs.getBool(_prefNotifyChapters) ?? true;
    _notifySubscription = prefs.getBool(_prefNotifySub) ?? true;
    _notifyTrending = prefs.getBool(_prefNotifyTrend) ?? true;
    _calmMotion = prefs.getBool(_prefCalmMotion) ?? false;
    _highContrast = prefs.getBool(_prefHighContrast) ?? false;
    _easyReading = prefs.getBool(_prefEasyReading) ?? false;
    _eyeBreakMinutes = prefs.getInt(_prefEyeBreakMinutes) ?? 0;
    _notificationPromptShown = prefs.getBool(_prefNotificationPromptShown) ?? false;
    _hydrated = true;
    notifyListeners();
  }

  Future<void> _persist() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_prefTheme, _themeMode == ThemeMode.dark);
    await prefs.setString(_prefThemeMode, switch (_themeMode) {
      ThemeMode.dark => 'dark',
      ThemeMode.light => 'light',
      ThemeMode.system => 'system',
    });
    await prefs.setInt(_prefFont, _fontScale);
    await prefs.setInt(_prefLineHeight, _lineHeightScale);
    await prefs.setString(_prefAlign, _textAlign);
    await prefs.setString(_prefReadingTone, _readingTone.name);
    if (_continueReadingStoryId != null) {
      await prefs.setString(_prefStoryId, _continueReadingStoryId!);
      await prefs.setString(_prefStoryTitle, _continueReadingTitle ?? '');
      await prefs.setInt(_prefChapter, _continueReadingChapter);
    }
    await prefs.setString(_prefGenre, _lastGenre);
    await prefs.setBool(_prefNotifyChapters, _notifyNewChapters);
    await prefs.setBool(_prefNotifySub, _notifySubscription);
    await prefs.setBool(_prefNotifyTrend, _notifyTrending);
    await prefs.setBool(_prefCalmMotion, _calmMotion);
    await prefs.setBool(_prefHighContrast, _highContrast);
    await prefs.setBool(_prefEasyReading, _easyReading);
    await prefs.setInt(_prefEyeBreakMinutes, _eyeBreakMinutes);
    await prefs.setBool(_prefNotificationPromptShown, _notificationPromptShown);
  }

  void setThemeMode(ThemeMode mode) {
    _themeMode = mode;
    _persist();
    notifyListeners();
  }

  void toggleTheme() {
    _themeMode = _themeMode == ThemeMode.dark
        ? ThemeMode.light
        : ThemeMode.dark;
    _persist();
    notifyListeners();
  }

  void setFontScale(int scale) {
    _fontScale = scale.clamp(
      1,
      5,
    ); // expanded to 5 levels for world-class comfort
    _persist();
    notifyListeners();
  }

  void setLineHeightScale(int scale) {
    _lineHeightScale = scale.clamp(1, 3);
    _persist();
    notifyListeners();
  }

  void setTextAlign(String align) {
    if (align == 'left' || align == 'justify') {
      _textAlign = align;
      _persist();
      notifyListeners();
    }
  }

  void setReadingTone(ReadingTone tone) {
    _readingTone = tone;
    _persist();
    notifyListeners();
  }

  double get effectiveLineHeight {
    if (_easyReading) return 2.05; // Easy Reading overrides the manual slider
    // Per decisions (Katha UI/UX): generous 1.75–1.95 line height recommended for long-form Telugu reading comfort
    switch (_lineHeightScale) {
      case 1:
        return 1.65;
      case 3:
        return 1.95;
      default:
        return 1.88; // slightly more generous default for visible improvement
    }
  }

  void setContinueReading({
    required String storyId,
    required String title,
    required int chapter,
  }) {
    _continueReadingStoryId = storyId;
    _continueReadingTitle = title;
    _continueReadingChapter = chapter;
    _persist();
    notifyListeners();
  }

  void setLastGenre(String genre) {
    _lastGenre = genre;
    _persist();
    notifyListeners();
  }

  void setNotifyNewChapters(bool v) {
    _notifyNewChapters = v;
    _persist();
    notifyListeners();
  }

  void setNotifySubscription(bool v) {
    _notifySubscription = v;
    _persist();
    notifyListeners();
  }

  void setNotifyTrending(bool v) {
    _notifyTrending = v;
    _persist();
    notifyListeners();
  }

  void setCalmMotion(bool v) {
    _calmMotion = v;
    _persist();
    notifyListeners();
  }

  void setHighContrast(bool v) {
    _highContrast = v;
    _persist();
    notifyListeners();
  }

  void setEasyReading(bool v) {
    _easyReading = v;
    _persist();
    notifyListeners();
  }

  void setEyeBreakMinutes(int v) {
    _eyeBreakMinutes = (v == 90 || v == 120) ? v : 0;
    _persist();
    notifyListeners();
  }

  /// Marks the one-time notification explainer/permission-request as shown.
  /// Idempotent — safe to call more than once, never re-triggers a prompt.
  void markNotificationPromptShown() {
    if (_notificationPromptShown) return;
    _notificationPromptShown = true;
    _persist();
    notifyListeners();
  }
}
