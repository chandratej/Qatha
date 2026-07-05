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

  static const brandName = 'Katha';
  static const brandNameTelugu = 'కథ';
  static const priceMonthly = 99;
  static const creatorSharePct = 60;
}