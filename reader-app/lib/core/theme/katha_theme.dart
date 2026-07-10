import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// Katha Brand Identity System v1.0 — sync with packages/shared/brand-tokens.css

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
  static const inkMuted = Color(0xFF8A847C);
  static const darkBg = Color(0xFF0D0D0F);
  static const darkSurface = Color(0xFF1A1A1E);
  static const darkElevated = Color(0xFF222228);
}

class KathaTheme {
  static ThemeData light({int fontScale = 2}) {
    final baseSize = 16.0 + (fontScale - 2) * 2;
    // Follows 04_JUL_Visual_UX_Framework_Selection_Katha.md
    // Material Design 3 + Custom Minimalist Layer for Katha
    return ThemeData(
      useMaterial3: true, // MD3 enabled
      brightness: Brightness.light,
      scaffoldBackgroundColor: KathaColors.paper,
      colorScheme: const ColorScheme.light(
        primary: KathaColors.gold,
        secondary: KathaColors.ember,
        surface: Colors.white,
        onSurface: KathaColors.ink,
      ),
      textTheme: _textTheme(KathaColors.ink, baseSize),
      appBarTheme: AppBarTheme(
        backgroundColor: KathaColors.paper,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.outfit(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: KathaColors.ink,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 1, // MD3 elevation
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12), // MD3 rounded
          side: BorderSide(color: KathaColors.ink.withValues(alpha: 0.08)),
        ),
      ),
    );
  }

  static ThemeData dark({int fontScale = 2}) {
    final baseSize = 16.0 + (fontScale - 2) * 2;
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: KathaColors.darkBg,
      colorScheme: const ColorScheme.dark(
        primary: KathaColors.gold,
        secondary: KathaColors.ember,
        surface: KathaColors.darkSurface,
        onSurface: Color(0xFFE8E6E3),
      ),
      textTheme: _textTheme(const Color(0xFFE8E6E3), baseSize),
      appBarTheme: AppBarTheme(
        backgroundColor: KathaColors.darkBg,
        elevation: 0,
        titleTextStyle: GoogleFonts.outfit(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: const Color(0xFFE8E6E3),
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 1,
        color: KathaColors.darkSurface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
        ),
      ),
    );
  }

  static TextTheme _textTheme(Color color, double baseSize) {
    return TextTheme(
      displayLarge: GoogleFonts.notoSansTelugu(
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
      bodyLarge: GoogleFonts.notoSansTelugu(
        fontSize: baseSize + 2,
        color: color,
        height: 1.82, // per decisions: generous for long-form Telugu reading comfort
      ),
      bodyMedium: GoogleFonts.outfit(
        fontSize: baseSize,
        color: color.withValues(alpha: 0.8),
      ),
      labelMedium: GoogleFonts.outfit(
        fontSize: baseSize - 2,
        color: color.withValues(alpha: 0.6),
        fontWeight: FontWeight.w500,
      ),
    );
  }

  static TextStyle readingStyle({
    required bool isDark,
    required int fontScale,
    double lineHeight = 1.82,  // MD3 per 04_JUL_Visual_UX_Framework_Selection_Katha.md
    TextAlign align = TextAlign.left,
  }) {
    // Material Design 3 + Minimalist: generous line height for Telugu long-form comfort
    final size = 18.0 + (fontScale - 2) * 3;
    return GoogleFonts.notoSansTelugu(
      fontSize: size,
      height: lineHeight,
      color: isDark ? const Color(0xFFE8E6E3) : KathaColors.ink,
      letterSpacing: 0.15,
    );
  }

  // Helper for paragraph container alignment + max width (line length ~45-55 chars mobile)
  static TextAlign getTextAlign(String pref) => pref == 'justify' ? TextAlign.justify : TextAlign.left;
}