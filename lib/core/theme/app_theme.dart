/// StoryVerse Theme Configuration
/// 
/// Premium literary theme with warm palette and league-based colors

import 'package:flutter/material.dart';

class AppTheme {
  AppTheme._();

  // Brand Colors - Premium Literary Palette
  static const Color primaryGold = Color(0xFFD4AF37);
  static const Color primaryGoldLight = Color(0xFFFFD700);
  static const Color primaryGoldDark = Color(0xFFB8860B);
  
  static const Color deepPurple = Color(0xFF4A148C);
  static const Color richBurgundy = Color(0xFF722F37);
  static const Color midnightBlue = Color(0xFF191970);
  
  // Background Colors
  static const Color backgroundLight = Color(0xFFFAF9F6); // Off-white literary paper
  static const Color backgroundDark = Color(0xFF1A1A2E);
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color surfaceDark = Color(0xFF2D2D44);
  
  // Text Colors
  static const Color textPrimaryLight = Color(0xFF1A1A1A);
  static const Color textSecondaryLight = Color(0xFF666666);
  static const Color textTertiaryLight = Color(0xFF999999);
  
  static const Color textPrimaryDark = Color(0xFFF5F5F5);
  static const Color textSecondaryDark = Color(0xFFB0B0B0);
  static const Color textTertiaryDark = Color(0xFF808080);
  
  // Reading Mode Colors
  static const Color readingLight = Color(0xFFFAF9F6);
  static const Color readingSepia = Color(0xFFF4ECD8);
  static const Color readingDark = Color(0xFF2B2B2B);
  
  // Semantic Colors
  static const Color success = Color(0xFF4CAF50);
  static const Color error = Color(0xFFF44336);
  static const Color warning = Color(0xFFFF9800);
  static const Color info = Color(0xFF2196F3);
  
  // League Colors (Progressive prestige)
  static const Map<String, Color> leagueColors = {
    'archive': Color(0xFF9E9E9E),      // Grey - Respectful archival
    'manuscript': Color(0xFF607D8B),   // Blue Grey - Beginning
    'published': Color(0xFF4CAF50),    // Green - First milestone
    'acclaimed': Color(0xFF8BC34A),    // Light Green - Recognition
    'celebrated': Color(0xFFCDDC39),   // Lime - Growing fame
    'distinguished': Color(0xFFFFEB3B), // Yellow - Notable
    'masterwork': Color(0xFFFF9800),   // Orange - Master level
    'legendary': Color(0xFFFF5722),    // Deep Orange - Legend status
    'hall_of_fame': Color(0xFFE91E63), // Pink - Elite
    'heritage': Color(0xFF9C27B0),     // Purple - Historical significance
    'classic': Color(0xFF673AB7),      // Deep Purple - Timeless
    'timeless': Color(0xFF3F51B5),     // Indigo - Eternal
    'immortal': Color(0xFFD4AF37),     // Gold - Ultimate achievement
  };

  // Gradient Definitions
  static const LinearGradient premiumGradient = LinearGradient(
    colors: [primaryGold, primaryGoldLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient darkPremiumGradient = LinearGradient(
    colors: [Color(0xFFB8860B), Color(0xFFD4AF37)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient storyCardGradient = LinearGradient(
    colors: [Color(0xFF1A1A2E), Color(0xFF16213E)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  // Light Theme
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: primaryGold,
      scaffoldBackgroundColor: backgroundLight,
      colorScheme: const ColorScheme.light(
        primary: primaryGold,
        secondary: deepPurple,
        tertiary: richBurgundy,
        surface: surfaceLight,
        error: error,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: textPrimaryLight,
        onError: Colors.white,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: surfaceLight,
        foregroundColor: textPrimaryLight,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          color: textPrimaryLight,
          fontSize: 20,
          fontWeight: FontWeight.w600,
        ),
      ),
      cardTheme: CardTheme(
        color: surfaceLight,
        elevation: 2,
        shadowColor: Colors.black.withOpacity(0.1),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryGold,
          foregroundColor: Colors.white,
          elevation: 2,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primaryGold,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryGold,
          side: const BorderSide(color: primaryGold, width: 1.5),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceLight,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFFE0E0E0)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFFE0E0E0)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: primaryGold, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: error),
        ),
        hintStyle: const TextStyle(
          color: textTertiaryLight,
          fontSize: 14,
        ),
      ),
      textTheme: const TextTheme(
        displayLarge: TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: textPrimaryLight,
          letterSpacing: -0.5,
        ),
        displayMedium: TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.bold,
          color: textPrimaryLight,
          letterSpacing: -0.5,
        ),
        displaySmall: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.w600,
          color: textPrimaryLight,
        ),
        headlineLarge: TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          color: textPrimaryLight,
        ),
        headlineMedium: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: textPrimaryLight,
        ),
        headlineSmall: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: textPrimaryLight,
        ),
        titleLarge: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: textPrimaryLight,
        ),
        titleMedium: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: textPrimaryLight,
        ),
        titleSmall: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: textPrimaryLight,
        ),
        bodyLarge: TextStyle(
          fontSize: 16,
          color: textPrimaryLight,
          height: 1.5,
        ),
        bodyMedium: TextStyle(
          fontSize: 14,
          color: textSecondaryLight,
          height: 1.5,
        ),
        bodySmall: TextStyle(
          fontSize: 12,
          color: textTertiaryLight,
          height: 1.4,
        ),
        labelLarge: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: textPrimaryLight,
        ),
        labelMedium: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: textSecondaryLight,
        ),
        labelSmall: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w500,
          color: textTertiaryLight,
        ),
      ),
      iconTheme: const IconThemeData(
        color: textPrimaryLight,
        size: 24,
      ),
      dividerTheme: const DividerThemeData(
        color: Color(0xFFE0E0E0),
        thickness: 1,
        space: 1,
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: surfaceLight,
        selectedItemColor: primaryGold,
        unselectedItemColor: textTertiaryLight,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: surfaceLight,
        indicatorColor: primaryGold.withOpacity(0.2),
        labelTextStyle: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return const TextStyle(
              color: primaryGold,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            );
          }
          return const TextStyle(
            color: textTertiaryLight,
            fontSize: 12,
          );
        }),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: const Color(0xFF323232),
        contentTextStyle: const TextStyle(color: Colors.white),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        behavior: SnackBarBehavior.floating,
      ),
      dialogTheme: DialogTheme(
        backgroundColor: surfaceLight,
        elevation: 8,
        shadowColor: Colors.black.withOpacity(0.2),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        titleTextStyle: const TextStyle(
          color: textPrimaryLight,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
        contentTextStyle: const TextStyle(
          color: textSecondaryLight,
          fontSize: 14,
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: primaryGold.withOpacity(0.1),
        selectedColor: primaryGold,
        labelStyle: const TextStyle(color: textPrimaryLight),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: primaryGold,
        linearTrackColor: Color(0xFFE0E0E0),
      ),
      sliderTheme: SliderThemeData(
        activeTrackColor: primaryGold,
        inactiveTrackColor: const Color(0xFFE0E0E0),
        thumbColor: primaryGold,
        overlayColor: primaryGold.withOpacity(0.2),
      ),
      switchTheme: SwitchThemeData(
        thumbColor: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return primaryGold;
          }
          return const Color(0xFFBDBDBD);
        }),
        trackColor: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return primaryGold.withOpacity(0.5);
          }
          return const Color(0xFFE0E0E0);
        }),
      ),
      checkboxTheme: CheckboxThemeData(
        fillColor: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return primaryGold;
          }
          return Colors.transparent;
        }),
        checkColor: MaterialStateProperty.all(Colors.white),
      ),
      radioTheme: RadioThemeData(
        fillColor: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return primaryGold;
          }
          return const Color(0xFFBDBDBD);
        }),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: primaryGold,
        foregroundColor: Colors.white,
        elevation: 4,
      ),
      drawerTheme: const DrawerThemeData(
        backgroundColor: surfaceLight,
        scrimColor: Colors.black54,
      ),
      tabBarTheme: const TabBarTheme(
        labelColor: primaryGold,
        unselectedLabelColor: textTertiaryLight,
        indicatorColor: primaryGold,
        labelStyle: TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 14,
        ),
        unselectedLabelStyle: TextStyle(
          fontWeight: FontWeight.w500,
          fontSize: 14,
        ),
      ),
      listTileTheme: const ListTileThemeData(
        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        titleTextStyle: TextStyle(
          color: textPrimaryLight,
          fontSize: 16,
          fontWeight: FontWeight.w500,
        ),
        subtitleTextStyle: TextStyle(
          color: textSecondaryLight,
          fontSize: 14,
        ),
      ),
      expansionTileTheme: const ExpansionTileThemeData(
        iconColor: primaryGold,
        textColor: textPrimaryLight,
      ),
      badgeTheme: const BadgeThemeData(
        backgroundColor: primaryGold,
        textColor: Colors.white,
      ),
      tooltipTheme: TooltipThemeData(
        decoration: BoxDecoration(
          color: const Color(0xFF323232),
          borderRadius: BorderRadius.circular(8),
        ),
        textStyle: const TextStyle(
          color: Colors.white,
          fontSize: 12,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
    );
  }

  // Dark Theme
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      primaryColor: primaryGold,
      scaffoldBackgroundColor: backgroundDark,
      colorScheme: const ColorScheme.dark(
        primary: primaryGold,
        secondary: deepPurple,
        tertiary: richBurgundy,
        surface: surfaceDark,
        error: error,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: textPrimaryDark,
        onError: Colors.white,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: surfaceDark,
        foregroundColor: textPrimaryDark,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          color: textPrimaryDark,
          fontSize: 20,
          fontWeight: FontWeight.w600,
        ),
      ),
      cardTheme: CardTheme(
        color: surfaceDark,
        elevation: 2,
        shadowColor: Colors.black.withOpacity(0.3),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryGold,
          foregroundColor: Colors.white,
          elevation: 2,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primaryGold,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryGold,
          side: const BorderSide(color: primaryGold, width: 1.5),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceDark,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFF404040)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFF404040)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: primaryGold, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: error),
        ),
        hintStyle: const TextStyle(
          color: textTertiaryDark,
          fontSize: 14,
        ),
      ),
      textTheme: const TextTheme(
        displayLarge: TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: textPrimaryDark,
          letterSpacing: -0.5,
        ),
        displayMedium: TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.bold,
          color: textPrimaryDark,
          letterSpacing: -0.5,
        ),
        displaySmall: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.w600,
          color: textPrimaryDark,
        ),
        headlineLarge: TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          color: textPrimaryDark,
        ),
        headlineMedium: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: textPrimaryDark,
        ),
        headlineSmall: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: textPrimaryDark,
        ),
        titleLarge: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: textPrimaryDark,
        ),
        titleMedium: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: textPrimaryDark,
        ),
        titleSmall: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: textPrimaryDark,
        ),
        bodyLarge: TextStyle(
          fontSize: 16,
          color: textPrimaryDark,
          height: 1.5,
        ),
        bodyMedium: TextStyle(
          fontSize: 14,
          color: textSecondaryDark,
          height: 1.5,
        ),
        bodySmall: TextStyle(
          fontSize: 12,
          color: textTertiaryDark,
          height: 1.4,
        ),
        labelLarge: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: textPrimaryDark,
        ),
        labelMedium: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: textSecondaryDark,
        ),
        labelSmall: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w500,
          color: textTertiaryDark,
        ),
      ),
      iconTheme: const IconThemeData(
        color: textPrimaryDark,
        size: 24,
      ),
      dividerTheme: const DividerThemeData(
        color: Color(0xFF404040),
        thickness: 1,
        space: 1,
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: surfaceDark,
        selectedItemColor: primaryGold,
        unselectedItemColor: textTertiaryDark,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: surfaceDark,
        indicatorColor: primaryGold.withOpacity(0.2),
        labelTextStyle: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return const TextStyle(
              color: primaryGold,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            );
          }
          return const TextStyle(
            color: textTertiaryDark,
            fontSize: 12,
          );
        }),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: const Color(0xFF424242),
        contentTextStyle: const TextStyle(color: Colors.white),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        behavior: SnackBarBehavior.floating,
      ),
      dialogTheme: DialogTheme(
        backgroundColor: surfaceDark,
        elevation: 8,
        shadowColor: Colors.black.withOpacity(0.4),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        titleTextStyle: const TextStyle(
          color: textPrimaryDark,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
        contentTextStyle: const TextStyle(
          color: textSecondaryDark,
          fontSize: 14,
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: primaryGold.withOpacity(0.2),
        selectedColor: primaryGold,
        labelStyle: const TextStyle(color: textPrimaryDark),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: primaryGold,
        linearTrackColor: Color(0xFF404040),
      ),
      sliderTheme: SliderThemeData(
        activeTrackColor: primaryGold,
        inactiveTrackColor: const Color(0xFF404040),
        thumbColor: primaryGold,
        overlayColor: primaryGold.withOpacity(0.2),
      ),
      switchTheme: SwitchThemeData(
        thumbColor: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return primaryGold;
          }
          return const Color(0xFF616161);
        }),
        trackColor: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return primaryGold.withOpacity(0.5);
          }
          return const Color(0xFF424242);
        }),
      ),
      checkboxTheme: CheckboxThemeData(
        fillColor: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return primaryGold;
          }
          return Colors.transparent;
        }),
        checkColor: MaterialStateProperty.all(Colors.white),
      ),
      radioTheme: RadioThemeData(
        fillColor: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return primaryGold;
          }
          return const Color(0xFF616161);
        }),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: primaryGold,
        foregroundColor: Colors.white,
        elevation: 4,
      ),
      drawerTheme: const DrawerThemeData(
        backgroundColor: surfaceDark,
        scrimColor: Colors.black87,
      ),
      tabBarTheme: const TabBarTheme(
        labelColor: primaryGold,
        unselectedLabelColor: textTertiaryDark,
        indicatorColor: primaryGold,
        labelStyle: TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 14,
        ),
        unselectedLabelStyle: TextStyle(
          fontWeight: FontWeight.w500,
          fontSize: 14,
        ),
      ),
      listTileTheme: const ListTileThemeData(
        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        titleTextStyle: TextStyle(
          color: textPrimaryDark,
          fontSize: 16,
          fontWeight: FontWeight.w500,
        ),
        subtitleTextStyle: TextStyle(
          color: textSecondaryDark,
          fontSize: 14,
        ),
      ),
      expansionTileTheme: const ExpansionTileThemeData(
        iconColor: primaryGold,
        textColor: textPrimaryDark,
      ),
      badgeTheme: const BadgeThemeData(
        backgroundColor: primaryGold,
        textColor: Colors.white,
      ),
      tooltipTheme: TooltipThemeData(
        decoration: BoxDecoration(
          color: const Color(0xFF424242),
          borderRadius: BorderRadius.circular(8),
        ),
        textStyle: const TextStyle(
          color: Colors.white,
          fontSize: 12,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
    );
  }

  // Sepia Reading Theme
  static ThemeData get sepiaTheme {
    final lightTheme = AppTheme.lightTheme;
    return lightTheme.copyWith(
      scaffoldBackgroundColor: readingSepia,
      colorScheme: lightTheme.colorScheme.copyWith(
        surface: readingSepia,
        background: readingSepia,
      ),
      cardTheme: lightTheme.cardTheme.copyWith(
        color: const Color(0xFFEFE6D5),
      ),
      appBarTheme: lightTheme.appBarTheme.copyWith(
        backgroundColor: const Color(0xFFF4ECD8),
        foregroundColor: const Color(0xFF5C4033),
      ),
      textTheme: lightTheme.textTheme.copyWith(
        bodyLarge: const TextStyle(
          fontSize: 16,
          color: Color(0xFF5C4033),
          height: 1.6,
        ),
        bodyMedium: const TextStyle(
          fontSize: 14,
          color: Color(0xFF8B7355),
          height: 1.6,
        ),
      ),
    );
  }

  // Helper Methods
  static Color getLeagueColor(String leagueId) {
    return leagueColors[leagueId] ?? leagueColors['archive']!;
  }

  static Color getLeagueColorWithOpacity(String leagueId, double opacity) {
    return getLeagueColor(leagueId).withOpacity(opacity);
  }

  static LinearGradient getLeagueGradient(String leagueId) {
    final color = getLeagueColor(leagueId);
    return LinearGradient(
      colors: [color, color.withOpacity(0.7)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    );
  }

  static bool isPremiumLeague(String leagueId) {
    const premiumLeagues = [
      'celebrated',
      'distinguished',
      'masterwork',
      'legendary',
      'hall_of_fame',
      'heritage',
      'classic',
      'timeless',
      'immortal',
    ];
    return premiumLeagues.contains(leagueId);
  }
}
