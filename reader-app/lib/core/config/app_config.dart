/// Runtime configuration — override via --dart-define=...
class AppConfig {
  static const apiBase = String.fromEnvironment(
    'API_BASE',
    defaultValue: 'http://10.0.2.2:3001/api',
  );

  // Supabase (pure auth + data via RLS per katha-auth-architecture-decision_auth.md)
  static const supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://your-project.supabase.co',
  );
  static const supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'your-anon-key-here',
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