/// StoryVerse Application Constants
/// Centralized configuration for the entire application

class AppConstants {
  AppConstants._();

  // App Information
  static const String appName = 'StoryVerse';
  static const String appVersion = '1.0.0';
  static const String appTagline = 'Stories Earn Their Place';

  // API Configuration
  static const String baseUrl = 'https://api.storyverse.com';
  static const String apiVersion = 'v1';
  static const int connectionTimeout = 30000;
  static const int receiveTimeout = 30000;

  // Firebase Collections
  static const String usersCollection = 'users';
  static const String storiesCollection = 'stories';
  static const String chaptersCollection = 'chapters';
  static const String reviewsCollection = 'reviews';
  static const String commentsCollection = 'comments';
  static const String leaguesCollection = 'leagues';
  static const String subscriptionsCollection = 'subscriptions';
  static const String notificationsCollection = 'notifications';
  static const String analyticsCollection = 'analytics';
  static const String authorsCollection = 'authors';
  static const String collectionsCollection = 'collections';
  static const String readingHistoryCollection = 'reading_history';
  static const String bookmarksCollection = 'bookmarks';
  static const String followsCollection = 'follows';
  static const String reactionsCollection = 'reactions';
  static const String achievementsCollection = 'achievements';
  static const String rediscoveryEventsCollection = 'rediscovery_events';

  // Storage Keys (Hive)
  static const String userBox = 'user_box';
  static const String settingsBox = 'settings_box';
  static const String cacheBox = 'cache_box';
  static const String offlineStoriesBox = 'offline_stories_box';
  static const String audioCacheBox = 'audio_cache_box';
  static const String onboardingBox = 'onboarding_box';

  // Shared Preferences Keys
  static const String isFirstLaunch = 'is_first_launch';
  static const String isOnboarded = 'is_onboarded';
  static const String currentTheme = 'current_theme';
  static const String currentLanguage = 'current_language';
  static const String lastAppVersion = 'last_app_version';
  static const String authToken = 'auth_token';
  static const String refreshToken = 'refresh_token';
  static const String userId = 'user_id';

  // Reading Configuration
  static const double defaultFontSize = 16.0;
  static const double minFontSize = 12.0;
  static const double maxFontSize = 24.0;
  static const double defaultLineHeight = 1.6;
  static const double minLineHeight = 1.2;
  static const double maxLineHeight = 2.0;
  static const double defaultMargin = 16.0;
  static const int autoSaveIntervalSeconds = 30;
  static const int minReadingCompletionForReview = 30; // percentage

  // League System
  static const int totalLeagues = 13;
  static const String archiveLeagueId = 'archive';
  static const String immortalLeagueId = 'immortal';
  
  // Promotion Configuration
  static const int minReadersForPromotion = 100;
  static const double minCompletionRateForPromotion = 0.60;
  static const double minAverageRatingForPromotion = 4.0;
  static const int minDaysInCurrentLeague = 7;
  static const int maxChaptersForManuscript = 5;

  // Archive Configuration
  static const int daysBeforeArchiveConsideration = 30;
  static const double minEngagementThreshold = 0.30;
  static const int rediscoveryEventFrequencyDays = 90; // Quarterly

  // Subscription Plans
  static const String monthlyPlanId = 'storyverse_monthly';
  static const String quarterlyPlanId = 'storyverse_quarterly';
  static const String yearlyPlanId = 'storyverse_yearly';
  
  static const String monthlyPlanProductId = 'com.storyverse.subscription.monthly';
  static const String quarterlyPlanProductId = 'com.storyverse.subscription.quarterly';
  static const String yearlyPlanProductId = 'com.storyverse.subscription.yearly';

  // Premium Leagues (require subscription)
  static const List<String> premiumLeagues = [
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

  // Payment Configuration
  static const String googlePlayPackageName = 'com.storyverse.app';
  static const String appleAppBundleId = 'com.storyverse.app';
  static const String razorpayKeyId = 'rzp_test_storyverse';
  static const String razorpayKeySecret = 'storyverse_secret';

  // Pagination
  static const int defaultPageSize = 20;
  static const int storiesPageSize = 15;
  static const int commentsPageSize = 30;
  static const int reviewsPageSize = 10;
  static const int notificationsPageSize = 20;
  static const int searchPageSize = 20;

  // Image Configuration
  static const String storyCoverPlaceholder = 'assets/images/story_placeholder.png';
  static const String avatarPlaceholder = 'assets/images/avatar_placeholder.png';
  static const int imageCacheSize = 100 * 1024 * 1024; // 100MB
  static const int maxImageUploadSize = 5 * 1024 * 1024; // 5MB
  static const int storyCoverWidth = 600;
  static const int storyCoverHeight = 900;
  static const int avatarSize = 400;

  // Audio Configuration
  static const String audioCacheDir = 'audio_cache';
  static const int audioPreloadCount = 3;
  static const double defaultPlaybackSpeed = 1.0;
  static const List<double> playbackSpeeds = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
  static const int sleepTimerMaxMinutes = 120;
  static const List<int> sleepTimerPresets = [15, 30, 45, 60, 90, 120];

  // Notification Channels
  static const String newChapterChannel = 'new_chapters';
  static const String promotionChannel = 'promotions';
  static const String socialChannel = 'social';
  static const String reminderChannel = 'reminders';
  static const String eventChannel = 'events';
  static const String systemChannel = 'system';

  // Analytics Events
  static const String eventStoryStarted = 'story_started';
  static const String eventStoryCompleted = 'story_completed';
  static const String eventChapterRead = 'chapter_read';
  static const String eventStoryBookmarked = 'story_bookmarked';
  static const String eventStoryReviewed = 'story_reviewed';
  static const String eventReactionAdded = 'reaction_added';
  static const String eventCommentPosted = 'comment_posted';
  static const String eventSubscriptionPurchased = 'subscription_purchased';
  static const String eventStoryPurchased = 'story_purchased';
  static const String eventAudioPlayed = 'audio_played';
  static const String eventStoryShared = 'story_shared';
  static const String eventAuthorFollowed = 'author_followed';
  static const String eventSearchPerformed = 'search_performed';
  static const String eventFilterApplied = 'filter_applied';
  static const String eventLeaguePromotion = 'league_promotion';
  static const String eventArchiveMoved = 'archive_moved';
  static const String eventRediscoveryJoined = 'rediscovery_joined';

  // Error Messages
  static const String errorGeneric = 'Something went wrong. Please try again.';
  static const String errorNoInternet = 'No internet connection. Please check your network.';
  static const String errorUnauthorized = 'Please log in to continue.';
  static const String errorForbidden = 'You don\'t have permission to perform this action.';
  static const String errorNotFound = 'The requested resource was not found.';
  static const String errorServer = 'Server error. Please try again later.';
  static const String errorTimeout = 'Request timed out. Please try again.';
  static const String errorPaymentFailed = 'Payment failed. Please try again.';
  static const String errorAudioNotAvailable = 'Audio narration not available for this story.';
  static const String errorOfflineMode = 'You\'re offline. Some features may be unavailable.';

  // Success Messages
  static const String successBookmarkAdded = 'Story added to your library.';
  static const String successBookmarkRemoved = 'Story removed from your library.';
  static const String successReviewPosted = 'Review posted successfully.';
  static const String successCommentPosted = 'Comment posted successfully.';
  static const String successSubscriptionActivated = 'Subscription activated successfully.';
  static const String successStoryPurchased = 'Story unlocked successfully.';
  static const String successProfileUpdated = 'Profile updated successfully.';
  static const String successSettingsSaved = 'Settings saved successfully.';

  // Validation
  static const int minPasswordLength = 8;
  static const int maxPasswordLength = 128;
  static const int minUsernameLength = 3;
  static const int maxUsernameLength = 30;
  static const int minStoryTitleLength = 5;
  static const int maxStoryTitleLength = 100;
  static const int minStoryDescriptionLength = 20;
  static const int maxStoryDescriptionLength = 2000;
  static const int minChapterTitleLength = 3;
  static const int maxChapterTitleLength = 100;
  static const int minChapterContentLength = 100;
  static const int maxReviewLength = 1000;
  static const int maxCommentLength = 500;

  // Timeouts & Delays
  static const int splashScreenDuration = 2000;
  static const int onboardingAnimationDuration = 500;
  static const int screenTransitionDuration = 300;
  static const int debounceDuration = 500;
  static const int throttleDuration = 1000;
  static const int staleDataThreshold = 300000; // 5 minutes
  static const int sessionTimeout = 1800000; // 30 minutes

  // Feature Flags
  static const bool enableAnonymousReading = true;
  static const bool enableAudioNarration = true;
  static const bool enableOfflineReading = true;
  static const bool enableSocialFeatures = true;
  static const bool enableUserGeneratedContent = true;
  static const bool enablePremiumContent = true;
  static const bool enableRediscoveryEvents = true;
  static const bool enableAiFeatures = false; // Architecture ready, disabled by default
  static const bool enableBetaFeatures = false;

  // AI Features (Architecture Ready)
  static const String aiRecapEndpoint = '/ai/recap';
  static const String aiCompanionEndpoint = '/ai/companion';
  static const String aiCharacterGuideEndpoint = '/ai/character-guide';
  static const String aiSummaryEndpoint = '/ai/summary';
  static const String aiNarrationEndpoint = '/ai/narration';
  static const String aiTranslationEndpoint = '/ai/translation';
  static const String aiRecommendationEndpoint = '/ai/recommendations';

  // Social Media
  static const String facebookShareUrl = 'https://www.facebook.com/sharer/sharer.php?u=';
  static const String twitterShareUrl = 'https://twitter.com/intent/tweet?url=';
  static const String whatsappShareUrl = 'https://wa.me/?text=';
  static const String telegramShareUrl = 'https://t.me/share/url?url=';

  // Support & Legal
  static const String supportEmail = 'support@storyverse.com';
  static const String termsOfServiceUrl = 'https://storyverse.com/terms';
  static const String privacyPolicyUrl = 'https://storyverse.com/privacy';
  static const String communityGuidelinesUrl = 'https://storyverse.com/guidelines';
  static const String faqUrl = 'https://storyverse.com/faq';
  static const String contactUsUrl = 'https://storyverse.com/contact';

  // External Links
  static const String websiteUrl = 'https://storyverse.com';
  static const String blogUrl = 'https://blog.storyverse.com';
  static const String careersUrl = 'https://storyverse.com/careers';
  static const String pressKitUrl = 'https://storyverse.com/press';

  // Rating Configuration
  static const double minRating = 1.0;
  static const double maxRating = 5.0;
  static const double ratingStep = 0.5;

  // Reaction Types
  static const String reactionLovedIt = 'loved_it';
  static const String reactionMindBlown = 'mind_blown';
  static const String reactionHeartbreaking = 'heartbreaking';
  static const String reactionFunny = 'funny';
  static const String reactionInspirational = 'inspirational';
  static const String reactionUnexpected = 'unexpected';
  static const String reactionBeautifullyWritten = 'beautifully_written';

  // Genre Categories
  static const List<String> genres = [
    'Fiction',
    'Fantasy',
    'Science Fiction',
    'Romance',
    'Mystery',
    'Thriller',
    'Horror',
    'Historical',
    'Contemporary',
    'Literary Fiction',
    'Young Adult',
    'Children',
    'Poetry',
    'Non-Fiction',
    'Biography',
    'Self-Help',
    'Adventure',
    'Drama',
    'Comedy',
    'Slice of Life',
  ];

  // Story Length Categories
  static const int shortStoryMaxWords = 7500;
  static const int noveletteMaxWords = 17500;
  static const int novellaMaxWords = 40000;
  static const int novelMinWords = 40001;

  // Reading Streak Configuration
  static const int streakResetHour = 4; // 4 AM local time
  static const List<int> streakMilestones = [1, 3, 7, 14, 30, 60, 90, 180, 365];
  
  // Pagination & Limits
  static const int storiesPerPage = 20;
  static const int chaptersPerPage = 50;
  static const int commentsPerPage = 30;
  static const int reviewsPerPage = 10;

  // Achievement IDs
  static const String achievementFirstStory = 'first_story';
  static const String achievementTenStories = 'ten_stories';
  static const String achievementFiftyStories = 'fifty_stories';
  static const String achievementHundredStories = 'hundred_stories';
  static const String achievementArchiveExplorer = 'archive_explorer';
  static const String achievementLegendHunter = 'legend_hunter';
  static const String achievementImmortalCollector = 'immortal_collector';
  static const String achievementFirstReview = 'first_review';
  static const String achievementFirstComment = 'first_comment';
  static const String achievementFirstPurchase = 'first_purchase';
  static const String achievementSubscriber = 'subscriber';
  static const String achievementWeekStreak = 'week_streak';
  static const String achievementMonthStreak = 'month_streak';
  static const String achievementYearStreak = 'year_streak';

  // Cache Durations
  static const Duration cacheDurationShort = Duration(minutes: 5);
  static const Duration cacheDurationMedium = Duration(minutes: 30);
  static const Duration cacheDurationLong = Duration(hours: 2);
  static const Duration cacheDurationVeryLong = Duration(hours: 24);

  // Accessibility
  static const double minTouchTargetSize = 48.0;
  static const double preferredTouchTargetSize = 56.0;
  static const double minContrastRatio = 4.5; // WCAG AA standard
  static const double largeTextScaleFactor = 1.3;

  // Performance
  static const int maxConcurrentDownloads = 3;
  static const int maxCachedStories = 50;
  static const int maxHistoryItems = 500;
  static const int maxBookmarks = 1000;

  // Additional Storage Keys
  static const String hiveChaptersPrefix = 'chapter_';
  static const String hiveStoriesPrefix = 'story_';
  static const String hiveUsersBox = 'user_box';
  static const String currentUserKey = 'current_user';
  
  // Firestore Collection Names (for direct access)
  static const String firestoreUsers = 'users';
  static const String firestoreStories = 'stories';
  static const String firestoreChapters = 'chapters';
  static const String firestoreReadingProgress = 'reading_progress';
  static const String firestoreLeagues = 'leagues';
  static const String firestoreSubscriptions = 'subscriptions';
  static const String firestoreAudioTracks = 'audio_tracks';
  static const String firestoreReviews = 'reviews';
  static const String firestoreComments = 'comments';
  static const String firestoreReactions = 'reactions';
  static const String firestoreNotifications = 'notifications';
  static const String firestoreAchievements = 'achievements';
  
  // Firestore Path Helpers
  static String storyPath(String storyId) => 
      '$storiesCollection/$storyId';
  static String chaptersPath(String storyId) => 
      '$storiesCollection/$storyId/$chaptersCollection';
  static String readingProgressPath(String userId, String storyId) => 
      '$usersCollection/$userId/readingHistory/$storyId';
}

// Storage Keys Helper Class
class StorageKeys {
  StorageKeys._();
  
  static const String userBox = 'user_box';
  static const String settingsBox = 'settings_box';
  static const String cacheBox = 'cache_box';
  static const String offlineStoriesBox = 'offline_stories_box';
  static const String audioCacheBox = 'audio_cache_box';
  static const String onboardingBox = 'onboarding_box';
  static const String hiveChaptersPrefix = 'chapter_';
  static const String hiveStoriesPrefix = 'story_';
}
