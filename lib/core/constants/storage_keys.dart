/// Storage keys for Hive and SharedPreferences
class StorageKeys {
  StorageKeys._();

  // User Data
  static const String currentUser = 'current_user';
  static const String authToken = 'auth_token';
  static const String refreshToken = 'refresh_token';
  static const String userId = 'user_id';

  // Settings
  static const String currentTheme = 'current_theme';
  static const String readingTheme = 'reading_theme';
  static const String fontSize = 'font_size';
  static const String lineHeight = 'line_height';
  static const String margin = 'margin';
  static const String notificationsEnabled = 'notifications_enabled';

  // App State
  static const String isFirstLaunch = 'is_first_launch';
  static const String isOnboarded = 'is_onboarded';
  static const String lastAppVersion = 'last_app_version';
  static const String lastSyncTime = 'last_sync_time';

  // Reading Progress
  static const String lastReadStory = 'last_read_story';
  static const String lastReadChapter = 'last_read_chapter';
  static const String readingProgress = 'reading_progress';

  // Cache Keys
  static const String cachedStories = 'cached_stories';
  static const String cachedChapters = 'cached_chapters';
  static const String cachedUser = 'cached_user';
}
