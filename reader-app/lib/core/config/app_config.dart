import 'package:flutter/foundation.dart'
    show TargetPlatform, defaultTargetPlatform, kIsWeb, kReleaseMode;

/// Runtime configuration — override via --dart-define=...
class AppConfig {
  static const _apiBaseOverride = String.fromEnvironment('API_BASE', defaultValue: '');

  /// Mode B production API (Render). Used for release builds unless overridden.
  static const productionApiBase = 'https://katha-api.onrender.com/api';

  /// Backend API base.
  /// - Release: production Render API (Mode B)
  /// - Debug web / iOS simulator / desktop: localhost
  /// - Debug Android emulator: 10.0.2.2
  /// - Override anytime: `--dart-define=API_BASE=https://…/api`
  static String get apiBase {
    if (_apiBaseOverride.isNotEmpty) return _apiBaseOverride;
    if (kReleaseMode) return productionApiBase;
    if (kIsWeb) return 'http://localhost:3001/api';
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return 'http://10.0.2.2:3001/api';
      case TargetPlatform.iOS:
      case TargetPlatform.macOS:
      case TargetPlatform.windows:
      case TargetPlatform.linux:
      case TargetPlatform.fuchsia:
        return 'http://localhost:3001/api';
    }
  }

  // Supabase (pure auth + data via RLS per katha-auth-architecture-decision_auth.md)
  static const supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://qviedmvezaehfcbmfmbc.supabase.co',
  );

  /// Publishable key (sb_publishable_...) — safe in client builds.
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

  /// Public web host that serves the share/OG-preview page at `/s/{storyId}/{chapter}`
  /// (see backend `src/routes/share.js`) and that the Android App Link intent-filter
  /// targets. Placeholder until a real domain is live — override at build time.
  static const webBase = String.fromEnvironment(
    'WEB_BASE',
    defaultValue: 'https://katha.app',
  );

  /// Custom-scheme deep link prefix — works without a verified https domain,
  /// useful for testing the share flow before App Links verification is set up.
  static const shareScheme = 'katha';

  static const brandName = 'Katha';
  static const brandNameTelugu = 'కథ';
  static const priceMonthly = 99;
  /// DEC-006: base share at Performing; ladder raises effective share to maxCreatorSharePct.
  static const creatorSharePct = 40;
  static const maxCreatorSharePct = 60;

  /// Hosted legal docs (Mode B landing on Vercel until custom domain).
  /// Override: `--dart-define=PRIVACY_URL=…` / `TERMS_URL=…`
  static const privacyUrl = String.fromEnvironment(
    'PRIVACY_URL',
    defaultValue: 'https://katha-landing-psi.vercel.app/privacy.html',
  );
  static const termsUrl = String.fromEnvironment(
    'TERMS_URL',
    defaultValue: 'https://katha-landing-psi.vercel.app/terms.html',
  );
  static const grievanceEmail = 'grievance@katha.in';
  static const dataDeletionMailto =
      'mailto:grievance@katha.in?subject=Data%20deletion%20request';
}
