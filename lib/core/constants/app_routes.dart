/// Application route constants
class AppRoutes {
  AppRoutes._();

  // Auth Routes
  static const String login = '/login';
  static const String signup = '/signup';
  static const String forgotPassword = '/forgot-password';
  static const String verifyEmail = '/verify-email';
  static const String resetPassword = '/reset-password';

  // Main Navigation
  static const String home = '/home';
  static const String explore = '/explore';
  static const String library = '/library';
  static const String audio = '/audio';
  static const String profile = '/profile';

  // Story Routes
  static const String storyDetail = '/story';
  static const String reader = '/reader';
  static const String chapter = '/chapter';

  // Author Routes
  static const String authorDashboard = '/author/dashboard';
  static const String createStory = '/author/create-story';
  static const String editStory = '/author/edit-story';
  static const String createChapter = '/author/create-chapter';
  static const String analytics = '/author/analytics';

  // Social Routes
  static const String reviews = '/reviews';
  static const String comments = '/comments';
  static const String notifications = '/notifications';

  // Settings Routes
  static const String settings = '/settings';
  static const String readingSettings = '/settings/reading';
  static const String accountSettings = '/settings/account';
  static const String subscription = '/subscription';

  // Other Routes
  static const String onboarding = '/onboarding';
  static const String search = '/search';
  static const String collections = '/collections';
  static const String achievements = '/achievements';
}
