/// StoryVerse Application Constants
/// 
/// Centralized constants for the entire application

class AppConstants {
  AppConstants._();

  // App Info
  static const String appName = 'StoryVerse';
  static const String appVersion = '1.0.0';
  static const String appTagline = 'Stories Earn Their Place';

  // API Configuration
  static const String apiBaseUrl = 'https://api.storyverse.com';
  static const String apiVersion = 'v1';
  static const int apiTimeout = 30;

  // Firebase Configuration
  static const String firebaseProjectId = 'storyverse-prod';
  
  // Storage Keys
  static const String userBox = 'user_box';
  static const String settingsBox = 'settings_box';
  static const String cacheBox = 'cache_box';
  static const String readingProgressBox = 'reading_progress_box';
  static const String audioProgressBox = 'audio_progress_box';
  static const String offlineContentBox = 'offline_content_box';

  // Hive Box Names
  static const String hiveUserBox = 'hive_user_box';
  static const String hiveSettingsBox = 'hive_settings_box';
  static const String hiveCacheBox = 'hive_cache_box';

  // Shared Preferences Keys
  static const String spOnboardingComplete = 'onboarding_complete';
  static const String spUserId = 'user_id';
  static const String spAuthToken = 'auth_token';
  static const String spRefreshToken = 'refresh_token';
  static const String spLastLogin = 'last_login';
  static const String spThemeMode = 'theme_mode';
  static const String spFontSize = 'font_size';
  static const String spReadingMode = 'reading_mode';

  // Pagination
  static const int defaultPageSize = 20;
  static const int storiesPageSize = 15;
  static const int commentsPageSize = 30;
  static const int reviewsPageSize = 10;

  // Cache Duration
  static const Duration cacheDuration = Duration(hours: 1);
  static const Duration shortCacheDuration = Duration(minutes: 5);
  static const Duration longCacheDuration = Duration(days: 1);

  // Image Configuration
  static const int imageThumbnailSize = 150;
  static const int imageMediumSize = 400;
  static const int imageLargeSize = 800;
  static const String defaultAvatarUrl = 'assets/images/default_avatar.png';
  static const String defaultCoverUrl = 'assets/images/default_cover.png';

  // Audio Configuration
  static const double defaultPlaybackSpeed = 1.0;
  static const List<double> playbackSpeeds = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
  static const int sleepTimerDefaultMinutes = 30;
  static const List<int> sleepTimerOptions = [15, 30, 45, 60, 90];

  // Reading Configuration
  static const double minFontSize = 12.0;
  static const double maxFontSize = 24.0;
  static const double defaultFontSize = 16.0;
  static const double minLineHeight = 1.0;
  static const double maxLineHeight = 2.0;
  static const double defaultLineHeight = 1.5;
  static const double minMargin = 8.0;
  static const double maxMargin = 32.0;
  static const double defaultMargin = 16.0;

  // Review System
  static const double minimumCompletionForReview = 0.30; // 30%
  static const int maxReviewLength = 1000;
  static const int minReviewLength = 10;
  static const double minRating = 1.0;
  static const double maxRating = 5.0;

  // League System
  static const int leaguesCount = 12;
  static const String archiveLeagueId = 'archive';
  static const String immortalLeagueId = 'immortal';

  // Subscription Plans
  static const String planMonthly = 'monthly';
  static const String planQuarterly = 'quarterly';
  static const String planYearly = 'yearly';

  // Payment Products
  static const String productIdMonthly = 'storyverse_premium_monthly';
  static const String productIdQuarterly = 'storyverse_premium_quarterly';
  static const String productIdYearly = 'storyverse_premium_yearly';

  // Social Features
  static const int maxCommentLength = 500;
  static const int maxReplyLength = 300;
  static const int maxTagsPerStory = 10;
  static const int maxGenresPerStory = 3;

  // Notification Channels
  static const String notificationChannelNewChapter = 'new_chapter';
  static const String notificationChannelPromotion = 'promotion';
  static const String notificationChannelReminder = 'reminder';
  static const String notificationChannelSocial = 'social';
  static const String notificationChannelSystem = 'system';

  // Analytics Events
  static const String eventStoryRead = 'story_read';
  static const String eventStoryCompleted = 'story_completed';
  static const String eventStoryPurchased = 'story_purchased';
  static const String eventSubscriptionStarted = 'subscription_started';
  static const String eventSubscriptionRenewed = 'subscription_renewed';
  static const String eventStoryShared = 'story_shared';
  static const String eventAuthorFollowed = 'author_followed';
  static const String eventStoryBookmarked = 'story_bookmarked';
  static const String eventReviewSubmitted = 'review_submitted';
  static const String eventReactionAdded = 'reaction_added';

  // Error Messages
  static const String errorGeneric = 'Something went wrong. Please try again.';
  static const String errorNetwork = 'No internet connection. Please check your network.';
  static const String errorUnauthorized = 'Please login to continue.';
  static const String errorForbidden = 'You don\'t have permission to access this.';
  static const String errorNotFound = 'The requested content was not found.';
  static const String errorServer = 'Server error. Please try again later.';
  static const String errorTimeout = 'Request timed out. Please try again.';

  // Success Messages
  static const String successBookmarkAdded = 'Added to your library';
  static const String successBookmarkRemoved = 'Removed from your library';
  static const String successFollowAuthor = 'Now following author';
  static const String successReviewSubmitted = 'Review submitted successfully';
  static const String successPurchase = 'Purchase successful';

  // Feature Flags (Remote Config)
  static const String featureAiNarration = 'ai_narration';
  static const String featureAiRecommendations = 'ai_recommendations';
  static const String featureRediscoveryEvents = 'rediscovery_events';
  static const String featureAudioDrama = 'audio_drama';
  static const String featureReadingClubs = 'reading_clubs';
  static const String featureChallenges = 'reading_challenges';

  // URLs
  static const String termsOfServiceUrl = 'https://storyverse.com/terms';
  static const String privacyPolicyUrl = 'https://storyverse.com/privacy';
  static const String helpCenterUrl = 'https://storyverse.com/help';
  static const String contactUsUrl = 'https://storyverse.com/contact';

  // Rate Limiting
  static const int maxRequestsPerMinute = 60;
  static const int maxCommentsPerHour = 20;
  static const int maxReviewsPerDay = 5;

  // Content Moderation
  static const int minTitleLength = 3;
  static const int maxTitleLength = 100;
  static const int minDescriptionLength = 10;
  static const int maxDescriptionLength = 2000;
  static const int minChapterLength = 100;
  static const int maxChapterLength = 50000;

  // Gamification
  static const int streakBonusMultiplier = 2;
  static const int maxStreakBonusDays = 30;
  static const int pointsPerStoryRead = 10;
  static const int pointsPerReview = 25;
  static const int pointsPerComment = 5;
  static const int pointsPerShare = 15;
}
