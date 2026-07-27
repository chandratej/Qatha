import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// Katha Brand Identity System v1.0 — sync with packages/shared/brand-tokens.css

/// Bundled Telugu stack (assets/fonts/NotoSansTelugu-*.ttf). Used when
/// GoogleFonts runtime fetch is disabled for offline-first reading.
TextStyle _bundledTelugu({
  double? fontSize,
  FontWeight? fontWeight,
  Color? color,
  double? height,
  double? letterSpacing,
}) {
  return TextStyle(
    fontFamily: 'NotoSansTelugu',
    fontSize: fontSize,
    fontWeight: fontWeight,
    color: color,
    height: height,
    letterSpacing: letterSpacing,
  );
}

TextStyle _teluguStyle({
  double? fontSize,
  FontWeight? fontWeight,
  Color? color,
  double? height,
  double? letterSpacing,
}) {
  // Prefer bundled face always — avoid CDN dependency even if fetch is re-enabled.
  return _bundledTelugu(
    fontSize: fontSize,
    fontWeight: fontWeight,
    color: color,
    height: height,
    letterSpacing: letterSpacing,
  );
}

class KathaColors {
  static const gold = Color(0xFFC4A052);
  static const goldLight = Color(0xFFE8D5A3);
  static const goldDark = Color(0xFF9A7B3A);
  static const ember = Color(0xFF8B3A62);
  static const maroon = Color(0xFF6B2338);
  static const paper = Color(0xFFFAF8F5);
  static const paperWarm = Color(0xFFF5F0E8);
  static const ink = Color(0xFF1A1814);
  static const inkSoft = Color(0xFF4A4540);
  // Default muted ink, raised from the old 0xFF8A847C (~3.5:1 on paper) to
  // ~4.9:1 against `paper`/white surfaces — was previously AA-passing only
  // behind the high-contrast toggle; now the global default per contrast audit.
  static const inkMuted = Color(0xFF726C63);
  // Pre-audit value, kept only for surfaces with a dark/near-black background
  // (inkMuted is ~5.3:1 there already; darkening it further would *reduce*
  // dark-mode contrast, so dark chrome keeps this lighter tone instead).
  static const inkMutedOnDark = Color(0xFF8A847C);
  static const darkBg = Color(0xFF0D0D0F);
  static const darkSurface = Color(0xFF1A1A1E);
  static const darkElevated = Color(0xFF222228);
  // Reading-canvas sepia — warmer/deeper than paperWarm so it reads as a
  // deliberate "old manuscript" tone, not a washed-out paper variant.
  static const sepia = Color(0xFFF1E5C7);
  static const sepiaSurface = Color(0xFFECDCB4);
  static const sepiaInk = Color(0xFF4A3624);
  // Raised from 0xFF8A7355 (~3.7:1 on sepia) to ~5.1:1, same audit as inkMuted.
  static const sepiaMuted = Color(0xFF6E5C44);
}

/// The chapter reading canvas's own color mode — deliberately independent of
/// [ThemeMode]/app brightness, matching the Kindle/Apple Books convention
/// that a book's page tone is a per-reader choice, not tied to system theme.
enum ReadingTone { paper, sepia, night }

class KathaTheme {
  /// Instant route transitions for the calm-motion comfort setting.
  static const _instantTransitions = PageTransitionsTheme(
    builders: {
      TargetPlatform.android: _NoTransitionsBuilder(),
      TargetPlatform.iOS: _NoTransitionsBuilder(),
      TargetPlatform.windows: _NoTransitionsBuilder(),
      TargetPlatform.macOS: _NoTransitionsBuilder(),
      TargetPlatform.linux: _NoTransitionsBuilder(),
    },
  );

  static ThemeData light({
    int fontScale = 2,
    bool highContrast = false,
    bool calmMotion = false,
  }) {
    final baseSize = 16.0 + (fontScale - 2) * 2;
    final ink = highContrast ? const Color(0xFF0F0E0C) : KathaColors.ink;
    final borderAlpha = highContrast ? 0.22 : 0.08;
    // Follows 04_JUL_Visual_UX_Framework_Selection_Katha.md
    // Material Design 3 + Custom Minimalist Layer for Katha
    return ThemeData(
      useMaterial3: true, // MD3 enabled
      brightness: Brightness.light,
      scaffoldBackgroundColor: KathaColors.paper,
      colorScheme: ColorScheme.light(
        primary: KathaColors.gold,
        secondary: KathaColors.ember,
        surface: Colors.white,
        onSurface: ink,
      ),
      textTheme: _textTheme(ink, baseSize, highContrast: highContrast),
      pageTransitionsTheme: calmMotion ? _instantTransitions : null,
      appBarTheme: AppBarTheme(
        backgroundColor: KathaColors.paper,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.outfit(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: ink,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 1, // MD3 elevation
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12), // MD3 rounded
          side: BorderSide(color: ink.withValues(alpha: borderAlpha)),
        ),
      ),
    );
  }

  static ThemeData dark({
    int fontScale = 2,
    bool highContrast = false,
    bool calmMotion = false,
  }) {
    final baseSize = 16.0 + (fontScale - 2) * 2;
    final ink = highContrast
        ? const Color(0xFFF5F3F0)
        : const Color(0xFFE8E6E3);
    final borderAlpha = highContrast ? 0.26 : 0.08;
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: KathaColors.darkBg,
      colorScheme: ColorScheme.dark(
        primary: KathaColors.gold,
        secondary: KathaColors.ember,
        surface: KathaColors.darkSurface,
        onSurface: ink,
      ),
      textTheme: _textTheme(ink, baseSize, highContrast: highContrast),
      pageTransitionsTheme: calmMotion ? _instantTransitions : null,
      appBarTheme: AppBarTheme(
        backgroundColor: KathaColors.darkBg,
        elevation: 0,
        titleTextStyle: GoogleFonts.outfit(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: ink,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 1,
        color: KathaColors.darkSurface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: Colors.white.withValues(alpha: borderAlpha)),
        ),
      ),
    );
  }

  static TextTheme _textTheme(
    Color color,
    double baseSize, {
    bool highContrast = false,
  }) {
    return TextTheme(
      displayLarge: _teluguStyle(
        fontSize: baseSize + 12,
        fontWeight: FontWeight.w600,
        color: color,
        height: 1.4,
      ),
      headlineMedium: GoogleFonts.outfit(
        fontSize: baseSize + 8,
        fontWeight: FontWeight.w600,
        color: color,
        letterSpacing: -0.5,
      ),
      titleLarge: GoogleFonts.outfit(
        fontSize: baseSize + 4,
        fontWeight: FontWeight.w600,
        color: color,
      ),
      bodyLarge: _teluguStyle(
        fontSize: baseSize + 2,
        color: color,
        height:
            1.82, // per decisions: generous for long-form Telugu reading comfort
      ),
      bodyMedium: GoogleFonts.outfit(
        fontSize: baseSize,
        color: color.withValues(alpha: highContrast ? 1.0 : 0.8),
      ),
      labelMedium: GoogleFonts.outfit(
        fontSize: baseSize - 2,
        color: color.withValues(alpha: highContrast ? 0.9 : 0.6),
        fontWeight: FontWeight.w500,
      ),
    );
  }

  static TextStyle readingStyle({
    required ReadingTone tone,
    required int fontScale,
    double lineHeight =
        1.82, // MD3 per 04_JUL_Visual_UX_Framework_Selection_Katha.md
    bool easyReading = false,
  }) {
    // Material Design 3 + Minimalist: generous line height for Telugu long-form comfort
    final size = 18.0 + (fontScale - 2) * 3;
    return _teluguStyle(
      fontSize: size,
      height: lineHeight,
      color: readingInk(tone),
      // Easy Reading (§2.8): wider letter spacing + a touch more weight on
      // the same Noto Sans Telugu stack, since no open-license dyslexia
      // font with reasonable Telugu coverage exists to swap in.
      letterSpacing: easyReading ? 0.6 : 0.15,
      fontWeight: easyReading ? FontWeight.w500 : null,
    );
  }

  /// Reading-canvas background — the chapter scroll area, app bar, and nav bar.
  static Color readingBackground(ReadingTone tone) => switch (tone) {
    ReadingTone.paper => KathaColors.paper,
    ReadingTone.sepia => KathaColors.sepia,
    ReadingTone.night => KathaColors.darkBg,
  };

  /// Reading-canvas elevated surface (nav bar, sheets) — slightly deeper than background.
  static Color readingSurface(ReadingTone tone) => switch (tone) {
    ReadingTone.paper => Colors.white,
    ReadingTone.sepia => KathaColors.sepiaSurface,
    ReadingTone.night => KathaColors.darkSurface,
  };

  static Color readingInk(ReadingTone tone) => switch (tone) {
    ReadingTone.paper => KathaColors.ink,
    ReadingTone.sepia => KathaColors.sepiaInk,
    ReadingTone.night => const Color(0xFFE8E6E3),
  };

  static Color readingMuted(ReadingTone tone) => switch (tone) {
    ReadingTone.paper => KathaColors.inkMuted,
    ReadingTone.sepia => KathaColors.sepiaMuted,
    // white30 measured ~2.7:1 on darkBg — bumped to white60 (~4.6:1).
    ReadingTone.night => Colors.white60,
  };

  /// Muted/secondary ink for app chrome (icons, unselected labels, dividers)
  /// — brightness-aware so the light-mode contrast fix doesn't wash out on
  /// dark backgrounds, where the pre-audit tone already reads correctly.
  static Color mutedInk(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark
          ? KathaColors.inkMutedOnDark
          : KathaColors.inkMuted;

  static bool isDarkTone(ReadingTone tone) => tone == ReadingTone.night;

  static String readingToneLabel(ReadingTone tone) => switch (tone) {
    ReadingTone.paper => 'Paper',
    ReadingTone.sepia => 'Sepia',
    ReadingTone.night => 'Night',
  };

  // Helper for paragraph container alignment + max width (line length ~45-55 chars mobile)
  static TextAlign getTextAlign(String pref) =>
      pref == 'justify' ? TextAlign.justify : TextAlign.left;
}

class _NoTransitionsBuilder extends PageTransitionsBuilder {
  const _NoTransitionsBuilder();

  @override
  Widget buildTransitions<T>(
    PageRoute<T> route,
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    return child;
  }
}
