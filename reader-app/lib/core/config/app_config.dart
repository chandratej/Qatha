import 'package:flutter/foundation.dart' show kIsWeb;

/// Runtime configuration — override via --dart-define=...
class AppConfig {
  static const _apiBaseOverride = String.fromEnvironment('API_BASE', defaultValue: '');

  /// Backend API base. Android emulator uses 10.0.2.2; desktop/web/iOS simulator use localhost.
  static String get apiBase {
    if (_apiBaseOverride.isNotEmpty) return _apiBaseOverride;
    if (kIsWeb) return 'http://localhost:3001/api';
    // Avoid dart:io on web; default matches Android emulator (most common local dev target).
    return 'http://10.0.2.2:3001/api';
  }

  // Supabase (pure auth + data via RLS per katha-auth-architecture-decision_auth.md)
  static const supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://qviedmvezaehfcbmfmbc.supabase.co',
  );
  /// Publishable key (sb_publishable_...) — safe in client builds. Legacy SUPABASE_ANON_KEY is deprecated.
  static const supabasePublishableKey = String.fromEnvironment(
    'SUPABASE_PUBLISHABLE_KEY',
    defaultValue: 'sb_publishable_43DYzB3cvS7lKEBoFc39JA_tstJunLT',
  );

  /// Web OAuth client ID — required for Google sign-in ID token on Android.
  static const googleWebClientId = String.fromEnvironment(
    'GOOGLE_WEB_CLIENT_ID',
    defaultValue: '',
  );

  /// Deep link / web redirect for email magic links.
  static const authRedirectUrl = String.fromEnvironment(
    'AUTH_REDIRECT_URL',
    defaultValue: 'io.supabase.katha://login-callback',
  );

  static const brandName = 'Katha';
  static const brandNameTelugu = 'కథ';
  static const priceMonthly = 99;
  static const creatorSharePct = 60;
}