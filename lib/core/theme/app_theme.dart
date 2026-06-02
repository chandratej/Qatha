/// StoryVerse Theme Configuration
/// Premium literary theme with Material 3 design system

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:storyverse/domain/league/league_config.dart' as league;

class AppTheme {
  AppTheme._();

  // Brand Colors - Premium Literary Palette
  static const Color primaryGold = Color(0xFFD4AF37);
  static const Color primaryGoldDark = Color(0xFFB8941F);
  static const Color primaryGoldLight = Color(0xFFE8C547);
  
  static const Color accentAmber = Color(0xFFFFBF00);
  static const Color accentBronze = Color(0xFFCD7F32);
  static const Color accentSilver = Color(0xFFC0C0C0);
  
  // Neutral Palette
  static const Color neutralWhite = Color(0xFFFFFFFF);
  static const Color neutralOffWhite = Color(0xFFF8F6F3);
  static const Color neutralCream = Color(0xFFF5F0EB);
  static const Color neutralLightGray = Color(0xFFE8E6E1);
  static const Color neutralGray = Color(0xFF9E9E9E);
  static const Color neutralDarkGray = Color(0xFF424242);
  static const Color neutralCharcoal = Color(0xFF2C2C2C);
  static const Color neutralBlack = Color(0xFF1A1A1A);
  
  // Semantic Colors
  static const Color successGreen = Color(0xFF4CAF50);
  static const Color errorRed = Color(0xFFE53935);
  static const Color warningOrange = Color(0xFFFF9800);
  static const Color infoBlue = Color(0xFF2196F3);
  
  // Helper method to replace deprecated withOpacity
  static Color colorWithOpacity(Color base, double opacity) {
    return Color.fromRGBO(
      base.red,
      base.green,
      base.blue,
      opacity,
    );
  }
  
  // League Colors (13 Leagues)
  static Map<league.LeagueTier, Color> get leagueColors => {
    league.LeagueTier.archive: const Color(0xFF9E9E9E),
    league.LeagueTier.manuscript: const Color(0xFF8D6E63),
    league.LeagueTier.published: const Color(0xFF4FC3F7),
    league.LeagueTier.acclaimed: const Color(0xFF81C784),
    league.LeagueTier.celebrated: const Color(0xFFFFB74D),
    league.LeagueTier.distinguished: const Color(0xFFBA68C8),
    league.LeagueTier.masterwork: const Color(0xFF64B5F6),
    league.LeagueTier.legendary: const Color(0xFFFF7043),
    league.LeagueTier.hallOfFame: const Color(0xFFFFD700),
    league.LeagueTier.heritage: const Color(0xFF8D6E63),
    league.LeagueTier.classic: const Color(0xFFE0E0E0),
    league.LeagueTier.timeless: const Color(0xFF9FA8DA),
    league.LeagueTier.immortal: const Color(0xFFFFD700),
  };

  static Map<String, LinearGradient> get leagueGradients => {
    'archive': LinearGradient(
      colors: [const Color(0xFF9E9E9E), const Color(0xFF757575)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    'manuscript': LinearGradient(
      colors: [const Color(0xFF8D6E63), const Color(0xFF5D4037)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    'published': LinearGradient(
      colors: [const Color(0xFF4FC3F7), const Color(0xFF0288D1)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    'acclaimed': LinearGradient(
      colors: [const Color(0xFF81C784), const Color(0xFF388E3C)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    'celebrated': LinearGradient(
      colors: [const Color(0xFFFFB74D), const Color(0xFFF57C00)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    'distinguished': LinearGradient(
      colors: [const Color(0xFFBA68C8), const Color(0xFF7B1FA2)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    'masterwork': LinearGradient(
      colors: [const Color(0xFF64B5F6), const Color(0xFF1976D2)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    'legendary': LinearGradient(
      colors: [const Color(0xFFFF7043), const Color(0xFFD84315)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    'hall_of_fame': LinearGradient(
      colors: [const Color(0xFFFFD700), const Color(0xFFFF8F00)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    'heritage': LinearGradient(
      colors: [const Color(0xFFCD7F32), const Color(0xFF8D6E63)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    'classic': LinearGradient(
      colors: [const Color(0xFFE0E0E0), const Color(0xFF9E9E9E)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    'timeless': LinearGradient(
      colors: [const Color(0xFF9FA8DA), const Color(0xFF3F51B5)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    'immortal': LinearGradient(
      colors: [const Color(0xFFFFD700), const Color(0xFFB8941F), const Color(0xFFFFE082)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
  };

  // Reading Mode Themes
  static const Color lightModeBackground = Color(0xFFFFFFFF);
  static const Color lightModeText = Color(0xFF1A1A1A);
  static const Color lightModeSecondaryText = Color(0xFF757575);
  
  static const Color darkModeBackground = Color(0xFF121212);
  static const Color darkModeSurface = Color(0xFF1E1E1E);
  static const Color darkModeText = Color(0xFFE0E0E0);
  static const Color darkModeSecondaryText = Color(0xFFBDBDBD);
  
  static const Color sepiaModeBackground = Color(0xFFF4ECD8);
  static const Color sepiaModeText = Color(0xFF5B4636);
  static const Color sepiaModeSecondaryText = Color(0xFF8B7355);

  // Light Theme
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: primaryGold,
      scaffoldBackgroundColor: neutralOffWhite,
      
      colorScheme: ColorScheme.light(
        primary: primaryGold,
        onPrimary: neutralBlack,
        primaryContainer: primaryGoldLight,
        onPrimaryContainer: neutralBlack,
        secondary: accentAmber,
        onSecondary: neutralBlack,
        secondaryContainer: Color(0xFFFFE082),
        onSecondaryContainer: neutralBlack,
        tertiary: accentBronze,
        onTertiary: neutralWhite,
        tertiaryContainer: Color(0xFFFFCCBC),
        onTertiaryContainer: neutralBlack,
        error: errorRed,
        onError: neutralWhite,
        errorContainer: Color(0xFFFFDAD6),
        onErrorContainer: Color(0xFF410002),
        surface: neutralWhite,
        onSurface: neutralBlack,
        surfaceContainerHighest: neutralLightGray,
        onSurfaceVariant: neutralDarkGray,
        outline: neutralGray,
        shadow: neutralBlack.withValues(alpha: 0.1),
      ),
      
      appBarTheme: AppBarTheme(
        elevation: 0,
        scrolledUnderElevation: 2,
        backgroundColor: neutralOffWhite,
        foregroundColor: neutralBlack,
        titleTextStyle: GoogleFonts.playfairDisplay(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          color: neutralBlack,
        ),
        toolbarTextStyle: GoogleFonts.lato(
          fontSize: 16,
          fontWeight: FontWeight.w500,
          color: neutralBlack,
        ),
        iconTheme: const IconThemeData(
          color: neutralBlack,
          size: 24,
        ),
      ),
      
      cardTheme: const CardThemeData(
        elevation: 2,
        shadowColor: neutralBlack,
        color: neutralWhite,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(16)),
        ),
        margin: EdgeInsets.all(8),
      ),
      
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 2,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          backgroundColor: primaryGold,
          foregroundColor: neutralBlack,
          textStyle: GoogleFonts.lato(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          foregroundColor: primaryGold,
          textStyle: GoogleFonts.lato(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          side: const BorderSide(color: primaryGold, width: 1.5),
          foregroundColor: primaryGold,
          textStyle: GoogleFonts.lato(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: neutralWhite,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: neutralLightGray),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: neutralLightGray),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primaryGold, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: errorRed),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: errorRed, width: 2),
        ),
        hintStyle: GoogleFonts.lato(
          color: neutralGray,
          fontSize: 16,
        ),
        labelStyle: GoogleFonts.lato(
          color: neutralDarkGray,
          fontSize: 14,
        ),
        floatingLabelStyle: GoogleFonts.lato(
          color: primaryGold,
          fontSize: 14,
        ),
        prefixIconColor: neutralGray,
        suffixIconColor: neutralGray,
      ),
      
      textTheme: TextTheme(
        displayLarge: GoogleFonts.playfairDisplay(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: neutralBlack,
        ),
        displayMedium: GoogleFonts.playfairDisplay(
          fontSize: 28,
          fontWeight: FontWeight.bold,
          color: neutralBlack,
        ),
        displaySmall: GoogleFonts.playfairDisplay(
          fontSize: 24,
          fontWeight: FontWeight.w600,
          color: neutralBlack,
        ),
        headlineLarge: GoogleFonts.playfairDisplay(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          color: neutralBlack,
        ),
        headlineMedium: GoogleFonts.playfairDisplay(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: neutralBlack,
        ),
        headlineSmall: GoogleFonts.playfairDisplay(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: neutralBlack,
        ),
        titleLarge: GoogleFonts.playfairDisplay(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: neutralBlack,
        ),
        titleMedium: GoogleFonts.lato(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: neutralBlack,
        ),
        titleSmall: GoogleFonts.lato(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: neutralBlack,
        ),
        bodyLarge: GoogleFonts.lato(
          fontSize: 16,
          fontWeight: FontWeight.normal,
          color: neutralBlack,
        ),
        bodyMedium: GoogleFonts.lato(
          fontSize: 14,
          fontWeight: FontWeight.normal,
          color: neutralBlack,
        ),
        bodySmall: GoogleFonts.lato(
          fontSize: 12,
          fontWeight: FontWeight.normal,
          color: neutralDarkGray,
        ),
        labelLarge: GoogleFonts.lato(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: neutralBlack,
        ),
        labelMedium: GoogleFonts.lato(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: neutralDarkGray,
        ),
        labelSmall: GoogleFonts.lato(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: neutralGray,
        ),
      ),
      
      iconTheme: const IconThemeData(
        color: neutralBlack,
        size: 24,
      ),
      
      navigationBarTheme: NavigationBarThemeData(
        height: 64,
        elevation: 8,
        shadowColor: neutralBlack.withValues(alpha: 0.15),
        backgroundColor: neutralWhite,
        indicatorColor: primaryGold.withValues(alpha: 0.2),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return GoogleFonts.lato(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: primaryGold,
            );
          }
          return GoogleFonts.lato(
            fontSize: 12,
            fontWeight: FontWeight.normal,
            color: neutralGray,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(
              color: primaryGold,
              size: 24,
            );
          }
          return const IconThemeData(
            color: neutralGray,
            size: 24,
          );
        }),
      ),
      
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: neutralWhite,
        modalBackgroundColor: neutralWhite,
        elevation: 8,
        shadowColor: neutralBlack.withValues(alpha: 0.15),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
      ),
      
      dialogTheme: const DialogThemeData(
        backgroundColor: neutralWhite,
        elevation: 8,
        shadowColor: neutralBlack,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(20)),
        ),
      ),
      
      snackBarTheme: SnackBarThemeData(
        backgroundColor: neutralCharcoal,
        contentTextStyle: GoogleFonts.lato(
          fontSize: 14,
          fontWeight: FontWeight.normal,
          color: neutralWhite,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        behavior: SnackBarBehavior.floating,
      ),
      
      chipTheme: ChipThemeData(
        backgroundColor: neutralLightGray,
        deleteIconColor: neutralGray,
        labelStyle: GoogleFonts.lato(
          fontSize: 13,
          fontWeight: FontWeight.w500,
          color: neutralDarkGray,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
      ),
      
      dividerTheme: DividerThemeData(
        color: neutralLightGray,
        thickness: 1,
        space: 1,
      ),
      
      sliderTheme: SliderThemeData(
        activeTrackColor: primaryGold,
        inactiveTrackColor: neutralLightGray,
        thumbColor: primaryGold,
        overlayColor: primaryGold.withValues(alpha: 0.2),
        trackHeight: 4,
        thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 8),
      ),
      
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return primaryGold;
          }
          return neutralGray;
        }),
        trackColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return primaryGold.withValues(alpha: 0.5);
          }
          return neutralLightGray;
        }),
      ),
      
      radioTheme: RadioThemeData(
        fillColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return primaryGold;
          }
          return neutralGray;
        }),
      ),
      
      checkboxTheme: CheckboxThemeData(
        fillColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return primaryGold;
          }
          return neutralGray;
        }),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(4),
        ),
      ),
      
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: primaryGold,
        linearTrackColor: neutralLightGray,
        circularTrackColor: neutralLightGray,
        refreshBackgroundColor: neutralLightGray,
      ),
      
      badgeTheme: BadgeThemeData(
        backgroundColor: primaryGold,
        textColor: neutralBlack,
        largeSize: 24,
        smallSize: 16,
        textStyle: GoogleFonts.lato(
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
      
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: primaryGold,
        foregroundColor: neutralBlack,
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      
      drawerTheme: DrawerThemeData(
        backgroundColor: neutralWhite,
        elevation: 8,
        shadowColor: neutralBlack.withValues(alpha: 0.15),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.horizontal(right: Radius.circular(16)),
        ),
      ),
      
      tabBarTheme: TabBarThemeData(
        labelColor: primaryGold,
        unselectedLabelColor: neutralGray,
        labelStyle: GoogleFonts.lato(
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: GoogleFonts.lato(
          fontSize: 14,
          fontWeight: FontWeight.normal,
        ),
        indicatorSize: TabBarIndicatorSize.label,
        dividerColor: Colors.transparent,
      ),
      
      listTileTheme: ListTileThemeData(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        titleTextStyle: GoogleFonts.lato(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: neutralBlack,
        ),
        subtitleTextStyle: GoogleFonts.lato(
          fontSize: 14,
          fontWeight: FontWeight.normal,
          color: neutralDarkGray,
        ),
        dense: false,
        visualDensity: VisualDensity.comfortable,
      ),
      
      expansionTileTheme: ExpansionTileThemeData(
        backgroundColor: neutralWhite,
        collapsedBackgroundColor: neutralWhite,
        textColor: neutralBlack,
        collapsedTextColor: neutralBlack,
        iconColor: primaryGold,
        collapsedIconColor: neutralGray,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      
      tooltipTheme: TooltipThemeData(
        decoration: BoxDecoration(
          color: neutralCharcoal,
          borderRadius: BorderRadius.circular(8),
        ),
        textStyle: GoogleFonts.lato(
          fontSize: 12,
          fontWeight: FontWeight.normal,
          color: neutralWhite,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        waitDuration: const Duration(milliseconds: 500),
        showDuration: const Duration(seconds: 2),
      ),
      
      popupMenuTheme: PopupMenuThemeData(
        color: neutralWhite,
        elevation: 8,
        shadowColor: neutralBlack.withValues(alpha: 0.15),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          return GoogleFonts.lato(
            fontSize: 14,
            fontWeight: FontWeight.normal,
            color: neutralDarkGray,
          );
        }),
      ),
      
      menuBarTheme: MenuBarThemeData(
        backgroundColor: neutralWhite,
        elevation: 8,
        shadowColor: neutralBlack.withValues(alpha: 0.15),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      
      timePickerTheme: TimePickerThemeData(
        backgroundColor: neutralWhite,
        hourMinuteColor: neutralOffWhite,
        dialHandColor: primaryGold,
        dialTextColor: neutralDarkGray,
        dayPeriodBorderSide: const BorderSide(color: neutralLightGray),
        dayPeriodColor: neutralOffWhite,
        dayPeriodTextColor: neutralDarkGray,
        entryModeIconColor: primaryGold,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
      ),
      
      datePickerTheme: DatePickerThemeData(
        backgroundColor: neutralWhite,
        headerBackgroundColor: primaryGold,
        headerForegroundColor: neutralBlack,
        weekdayStyle: GoogleFonts.lato(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: neutralDarkGray,
        ),
        dayStyle: GoogleFonts.lato(
          fontSize: 14,
          fontWeight: FontWeight.normal,
          color: neutralBlack,
        ),
        todayForegroundColor: primaryGold,
        selectedDayBackgroundColor: primaryGold,
        selectedDayForegroundColor: neutralBlack,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
      ),
    );
  }

  // Dark Theme
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      primaryColor: primaryGold,
      scaffoldBackgroundColor: darkModeBackground,
      
      colorScheme: ColorScheme.dark(
        primary: primaryGold,
        onPrimary: neutralBlack,
        primaryContainer: primaryGoldDark,
        onPrimaryContainer: neutralWhite,
        secondary: accentAmber,
        onSecondary: neutralBlack,
        secondaryContainer: Color(0xFFFFA000),
        onSecondaryContainer: neutralWhite,
        tertiary: accentBronze,
        onTertiary: neutralWhite,
        tertiaryContainer: Color(0xFF8D5B3B),
        onTertiaryContainer: neutralWhite,
        error: Color(0xFFFF6B6B),
        onError: neutralWhite,
        errorContainer: Color(0xFF8B0000),
        onErrorContainer: Color(0xFFFFDAD6),
        surface: darkModeSurface,
        onSurface: darkModeText,
        surfaceContainerHighest: neutralDarkGray,
        onSurfaceVariant: darkModeSecondaryText,
        outline: neutralGray,
        shadow: neutralBlack.withValues(alpha: 0.3),
      ),
      
      appBarTheme: AppBarTheme(
        elevation: 0,
        scrolledUnderElevation: 2,
        backgroundColor: darkModeBackground,
        foregroundColor: darkModeText,
        titleTextStyle: GoogleFonts.playfairDisplay(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          color: darkModeText,
        ),
        toolbarTextStyle: GoogleFonts.lato(
          fontSize: 16,
          fontWeight: FontWeight.w500,
          color: darkModeText,
        ),
        iconTheme: const IconThemeData(
          color: darkModeText,
          size: 24,
        ),
      ),
      
      cardTheme: CardThemeData(
        elevation: 2,
        shadowColor: neutralBlack.withValues(alpha: 0.3),
        color: darkModeSurface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        margin: const EdgeInsets.all(8),
      ),
      
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 2,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          backgroundColor: primaryGold,
          foregroundColor: neutralBlack,
          textStyle: GoogleFonts.lato(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          foregroundColor: primaryGold,
          textStyle: GoogleFonts.lato(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          side: const BorderSide(color: primaryGold, width: 1.5),
          foregroundColor: primaryGold,
          textStyle: GoogleFonts.lato(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: darkModeSurface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: neutralDarkGray),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: neutralDarkGray),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primaryGold, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFFF6B6B)),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFFF6B6B), width: 2),
        ),
        hintStyle: GoogleFonts.lato(
          color: neutralGray,
          fontSize: 16,
        ),
        labelStyle: GoogleFonts.lato(
          color: darkModeSecondaryText,
          fontSize: 14,
        ),
        floatingLabelStyle: GoogleFonts.lato(
          color: primaryGold,
          fontSize: 14,
        ),
        prefixIconColor: neutralGray,
        suffixIconColor: neutralGray,
      ),
      
      textTheme: TextTheme(
        displayLarge: GoogleFonts.playfairDisplay(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: darkModeText,
        ),
        displayMedium: GoogleFonts.playfairDisplay(
          fontSize: 28,
          fontWeight: FontWeight.bold,
          color: darkModeText,
        ),
        displaySmall: GoogleFonts.playfairDisplay(
          fontSize: 24,
          fontWeight: FontWeight.w600,
          color: darkModeText,
        ),
        headlineLarge: GoogleFonts.playfairDisplay(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          color: darkModeText,
        ),
        headlineMedium: GoogleFonts.playfairDisplay(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: darkModeText,
        ),
        headlineSmall: GoogleFonts.playfairDisplay(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: darkModeText,
        ),
        titleLarge: GoogleFonts.playfairDisplay(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: darkModeText,
        ),
        titleMedium: GoogleFonts.lato(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: darkModeText,
        ),
        titleSmall: GoogleFonts.lato(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: darkModeText,
        ),
        bodyLarge: GoogleFonts.lato(
          fontSize: 16,
          fontWeight: FontWeight.normal,
          color: darkModeText,
        ),
        bodyMedium: GoogleFonts.lato(
          fontSize: 14,
          fontWeight: FontWeight.normal,
          color: darkModeText,
        ),
        bodySmall: GoogleFonts.lato(
          fontSize: 12,
          fontWeight: FontWeight.normal,
          color: darkModeSecondaryText,
        ),
        labelLarge: GoogleFonts.lato(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: darkModeText,
        ),
        labelMedium: GoogleFonts.lato(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: darkModeSecondaryText,
        ),
        labelSmall: GoogleFonts.lato(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: neutralGray,
        ),
      ),
      
      iconTheme: const IconThemeData(
        color: darkModeText,
        size: 24,
      ),
      
      navigationBarTheme: NavigationBarThemeData(
        height: 64,
        elevation: 8,
        shadowColor: neutralBlack.withValues(alpha: 0.3),
        backgroundColor: darkModeSurface,
        indicatorColor: primaryGold.withValues(alpha: 0.2),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return GoogleFonts.lato(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: primaryGold,
            );
          }
          return GoogleFonts.lato(
            fontSize: 12,
            fontWeight: FontWeight.normal,
            color: neutralGray,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(
              color: primaryGold,
              size: 24,
            );
          }
          return const IconThemeData(
            color: neutralGray,
            size: 24,
          );
        }),
      ),
      
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: darkModeSurface,
        modalBackgroundColor: darkModeSurface,
        elevation: 8,
        shadowColor: neutralBlack.withValues(alpha: 0.3),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
      ),
      
      dialogTheme: DialogThemeData(
        backgroundColor: darkModeSurface,
        elevation: 8,
        shadowColor: neutralBlack.withValues(alpha: 0.3),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        titleTextStyle: GoogleFonts.playfairDisplay(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: darkModeText,
        ),
        contentTextStyle: GoogleFonts.lato(
          fontSize: 16,
          fontWeight: FontWeight.normal,
          color: darkModeSecondaryText,
        ),
      ),
      
      snackBarTheme: SnackBarThemeData(
        backgroundColor: neutralLightGray,
        contentTextStyle: GoogleFonts.lato(
          fontSize: 14,
          fontWeight: FontWeight.normal,
          color: neutralBlack,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        behavior: SnackBarBehavior.floating,
      ),
      
      chipTheme: ChipThemeData(
        backgroundColor: neutralDarkGray,
        deleteIconColor: neutralGray,
        labelStyle: GoogleFonts.lato(
          fontSize: 13,
          fontWeight: FontWeight.w500,
          color: darkModeSecondaryText,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
      ),
      
      dividerTheme: DividerThemeData(
        color: neutralDarkGray,
        thickness: 1,
        space: 1,
      ),
      
      sliderTheme: SliderThemeData(
        activeTrackColor: primaryGold,
        inactiveTrackColor: neutralDarkGray,
        thumbColor: primaryGold,
        overlayColor: primaryGold.withValues(alpha: 0.2),
        trackHeight: 4,
        thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 8),
      ),
      
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return primaryGold;
          }
          return neutralGray;
        }),
        trackColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return primaryGold.withValues(alpha: 0.5);
          }
          return neutralDarkGray;
        }),
      ),
      
      radioTheme: RadioThemeData(
        fillColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return primaryGold;
          }
          return neutralGray;
        }),
      ),
      
      checkboxTheme: CheckboxThemeData(
        fillColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return primaryGold;
          }
          return neutralGray;
        }),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(4),
        ),
      ),
      
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: primaryGold,
        linearTrackColor: neutralDarkGray,
        circularTrackColor: neutralDarkGray,
        refreshBackgroundColor: neutralDarkGray,
      ),
      
      badgeTheme: BadgeThemeData(
        backgroundColor: primaryGold,
        textColor: neutralBlack,
        largeSize: 24,
        smallSize: 16,
        textStyle: GoogleFonts.lato(
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
      
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: primaryGold,
        foregroundColor: neutralBlack,
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      
      drawerTheme: DrawerThemeData(
        backgroundColor: darkModeSurface,
        elevation: 8,
        shadowColor: neutralBlack.withValues(alpha: 0.3),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.horizontal(right: Radius.circular(16)),
        ),
      ),
      
      tabBarTheme: TabBarThemeData(
        labelColor: primaryGold,
        unselectedLabelColor: neutralGray,
        labelStyle: GoogleFonts.lato(
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: GoogleFonts.lato(
          fontSize: 14,
          fontWeight: FontWeight.normal,
        ),
        indicatorSize: TabBarIndicatorSize.label,
        dividerColor: Colors.transparent,
      ),
      
      listTileTheme: ListTileThemeData(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        titleTextStyle: GoogleFonts.lato(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: darkModeText,
        ),
        subtitleTextStyle: GoogleFonts.lato(
          fontSize: 14,
          fontWeight: FontWeight.normal,
          color: darkModeSecondaryText,
        ),
        dense: false,
        visualDensity: VisualDensity.comfortable,
      ),
      
      expansionTileTheme: ExpansionTileThemeData(
        backgroundColor: darkModeSurface,
        collapsedBackgroundColor: darkModeSurface,
        textColor: darkModeText,
        collapsedTextColor: darkModeText,
        iconColor: primaryGold,
        collapsedIconColor: neutralGray,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      
      tooltipTheme: TooltipThemeData(
        decoration: BoxDecoration(
          color: neutralLightGray,
          borderRadius: BorderRadius.circular(8),
        ),
        textStyle: GoogleFonts.lato(
          fontSize: 12,
          fontWeight: FontWeight.normal,
          color: neutralBlack,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        waitDuration: const Duration(milliseconds: 500),
        showDuration: const Duration(seconds: 2),
      ),
      
      popupMenuTheme: PopupMenuThemeData(
        color: darkModeSurface,
        elevation: 8,
        shadowColor: neutralBlack.withValues(alpha: 0.3),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          return GoogleFonts.lato(
            fontSize: 14,
            fontWeight: FontWeight.normal,
            color: darkModeSecondaryText,
          );
        }),
      ),
      
      menuBarTheme: MenuBarThemeData(
        backgroundColor: WidgetStatePropertyAll(darkModeSurface),
        surfaceTintColor: neutralBlack.withValues(alpha: 0.3),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      
      timePickerTheme: TimePickerThemeData(
        backgroundColor: darkModeSurface,
        hourMinuteColor: darkModeBackground,
        dialHandColor: primaryGold,
        dialTextColor: darkModeSecondaryText,
        dayPeriodBorderSide: const BorderSide(color: neutralDarkGray),
        dayPeriodColor: darkModeBackground,
        dayPeriodTextColor: darkModeSecondaryText,
        entryModeIconColor: primaryGold,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
      ),
      
      datePickerTheme: DatePickerThemeData(
        backgroundColor: darkModeSurface,
        headerBackgroundColor: primaryGold,
        headerForegroundColor: neutralBlack,
        weekdayStyle: GoogleFonts.lato(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: darkModeSecondaryText,
        ),
        dayStyle: GoogleFonts.lato(
          fontSize: 14,
          fontWeight: FontWeight.normal,
          color: darkModeText,
        ),
        todayForegroundColor: WidgetStatePropertyAll(primaryGold),
        selectedDayBackgroundColor: WidgetStatePropertyAll(primaryGold),
        selectedDayForegroundColor: WidgetStatePropertyAll(neutralBlack),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
      ),
    );
  }

  // Sepia Theme (Reading Mode.withValues(alpha: 
  static ThemeData get sepiaTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: accentBronze,
      scaffoldBackgroundColor: sepiaModeBackground,
      
      colorScheme: ColorScheme.light(
        primary: accentBronze,
        onPrimary: sepiaModeText,
        primaryContainer: Color(0xFFE8D5B5),
        onPrimaryContainer: sepiaModeText,
        secondary: Color(0xFF8B7355),
        onSecondary: sepiaModeBackground,
        secondaryContainer: Color(0xFFD5C4A1),
        onSecondaryContainer: sepiaModeText,
        tertiary: Color(0xFFA0826D),
        onTertiary: sepiaModeBackground,
        tertiaryContainer: Color(0xFFE8D5B5),
        onTertiaryContainer: sepiaModeText,
        error: Color(0xFFB71C1C),
        onError: sepiaModeBackground,
        errorContainer: Color(0xFFFFDAD6),
        onErrorContainer: Color(0xFF410002),
        surface: sepiaModeBackground,
        onSurface: sepiaModeText,
        surfaceContainerHighest: Color(0xFFE8D5B5),
        onSurfaceVariant: sepiaModeSecondaryText,
        outline: sepiaModeSecondaryText,
        shadow: sepiaModeText.withValues(alpha: 0.1),
      ),
      
      appBarTheme: AppBarTheme(
        elevation: 0,
        backgroundColor: sepiaModeBackground,
        foregroundColor: sepiaModeText,
        titleTextStyle: GoogleFonts.playfairDisplay(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          color: sepiaModeText,
        ),
        iconTheme: const IconThemeData(
          color: sepiaModeText,
          size: 24,
        ),
      ),
      
      cardTheme: CardThemeData(
        elevation: 1,
        color: Color(0xFFFDF6E3),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      
      textTheme: TextTheme(
        bodyLarge: GoogleFonts.lato(
          fontSize: 16,
          fontWeight: FontWeight.normal,
          color: sepiaModeText,
        ),
        bodyMedium: GoogleFonts.lato(
          fontSize: 14,
          fontWeight: FontWeight.normal,
          color: sepiaModeText,
        ),
        bodySmall: GoogleFonts.lato(
          fontSize: 12,
          fontWeight: FontWeight.normal,
          color: sepiaModeSecondaryText,
        ),
        titleLarge: GoogleFonts.playfairDisplay(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: sepiaModeText,
        ),
        titleMedium: GoogleFonts.lato(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: sepiaModeText,
        ),
        labelLarge: GoogleFonts.lato(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: sepiaModeText,
        ),
      ),
      
      iconTheme: const IconThemeData(
        color: sepiaModeText,
        size: 24,
      ),
      
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Color(0xFFFDF6E3),
        indicatorColor: accentBronze.withValues(alpha: 0.2),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return GoogleFonts.lato(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: accentBronze,
            );
          }
          return GoogleFonts.lato(
            fontSize: 12,
            fontWeight: FontWeight.normal,
            color: sepiaModeSecondaryText,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(
              color: accentBronze,
              size: 24,
            );
          }
          return const IconThemeData(
            color: sepiaModeSecondaryText,
            size: 24,
          );
        }),
      ),
    );
  }
}
