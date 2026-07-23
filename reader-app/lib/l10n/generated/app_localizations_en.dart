// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get navHome => 'Home';

  @override
  String get navLibrary => 'Library';

  @override
  String get navSettings => 'Settings';

  @override
  String get navBrowse => 'Browse';

  @override
  String get settingsTitle => 'Settings';

  @override
  String get settingsReadingComfort => 'Reading Comfort';

  @override
  String get settingsFontSize => 'Font Size';

  @override
  String get settingsTheme => 'Theme';

  @override
  String get settingsHighContrast => 'High Contrast';

  @override
  String get settingsCalmMotion => 'Reduce Motion';

  @override
  String get settingsEyeBreakReminder => 'Eye-break reminder';

  @override
  String get settingsEyeBreakReminderSubtitle =>
      'Gently reminds you to rest your eyes during long reading sessions';

  @override
  String get settingsEasyReading => 'Easy Reading';

  @override
  String get settingsEasyReadingSubtitle =>
      'Wider letter and line spacing for easier reading';

  @override
  String get settingsAccount => 'Account';

  @override
  String get settingsSignOut => 'Sign Out';

  @override
  String get settingsSignIn => 'Sign In';

  @override
  String get settingsSubscription => 'Subscription';

  @override
  String get settingsAbout => 'About';

  @override
  String get settingsLanguage => 'Language';

  @override
  String get settingsNotifications => 'Notifications';

  @override
  String get settingsNotificationsReminder =>
      'Notifications are off. You can turn them on anytime.';

  @override
  String get settingsOff => 'Off';

  @override
  String get buttonSubscribe => 'Subscribe';

  @override
  String get buttonRetry => 'Retry';

  @override
  String get buttonCancel => 'Cancel';

  @override
  String get buttonContinue => 'Continue';

  @override
  String get buttonContinueReading => 'Continue Reading';

  @override
  String get buttonFollow => 'Follow';

  @override
  String get buttonFollowing => 'Following';

  @override
  String get buttonShare => 'Share';

  @override
  String get buttonDismiss => 'Dismiss';

  @override
  String get buttonNotNow => 'Not now';

  @override
  String get buttonAllow => 'Allow';

  @override
  String get buttonDone => 'Done';

  @override
  String get buttonSignIn => 'Sign In';

  @override
  String get buttonSignInWithPhone => 'Sign in with phone';

  @override
  String get buttonSignInWithGoogle => 'Sign in with Google';

  @override
  String get buttonGetStarted => 'Get Started';

  @override
  String get paywallTitle => 'Subscribe to keep reading';

  @override
  String paywallPriceMonthly(String price) {
    return '₹$price/month';
  }

  @override
  String paywallSubtitleWithTrial(String price, int days) {
    return '₹$price/month after your $days-day launch trial · No ads · No coins';
  }

  @override
  String paywallSubtitleNoTrial(String price, String shareLine) {
    return '₹$price/month · No ads · No coins · $shareLine';
  }

  @override
  String paywallShareTransparency(String base, String max) {
    return '$base% base author share · up to $max% at Apex Story Trust';
  }

  @override
  String get paywallBenefitNewChapters =>
      'Read every chapter the moment it drops';

  @override
  String get paywallBenefitOffline => 'Unlimited offline downloads';

  @override
  String get paywallBenefitAdFree => 'Ad-free, distraction-free reading';

  @override
  String get paywallTrustLine =>
      'Cancel anytime · UPI auto-pay · Secure via Razorpay';

  @override
  String get errorRetry => 'Retry';

  @override
  String get errorAvailableOffline => 'Available offline:';

  @override
  String errorChapterNumber(int number) {
    return 'Chapter $number';
  }

  @override
  String get errorNoConnection =>
      'No connection. Check your internet and try again.';

  @override
  String get errorSomethingWrong => 'Something went wrong. Please try again.';

  @override
  String get maturityGeneral => 'General';

  @override
  String get maturityMature => 'Mature Themes';

  @override
  String notificationFollowPrompt(String authorName) {
    return 'Get notified when $authorName publishes a new chapter';
  }

  @override
  String get notificationArcCompletePrompt =>
      'Get notified when your followed authors publish new chapters';

  @override
  String get notificationPermissionTitle => 'Never miss a new chapter';

  @override
  String get onboardingWelcomeTitle => 'తెలుగు కథలు';

  @override
  String get onboardingWelcomeSubtitle => 'Telugu stories, told well';

  @override
  String get emptyLibraryTitle => 'Your library is empty';

  @override
  String get emptyLibrarySubtitle =>
      'Stories you follow or bookmark will appear here';

  @override
  String get emptyFollowedAuthorsTitle => 'No followed authors yet';

  @override
  String get emptyFollowedAuthorsSubtitle =>
      'Follow authors to get notified about new chapters';

  @override
  String get emptySearchResultsTitle => 'No stories found';

  @override
  String get emptySearchResultsSubtitle =>
      'Try a different genre or search term';

  @override
  String get genreFilterAll => 'All';

  @override
  String get sectionNewReleases => 'New releases';

  @override
  String get sectionTrendingNow => 'Trending now';

  @override
  String get sectionTrendingSubtitle => 'Stories readers are loving right now';

  @override
  String get browseTitle => 'Browse';

  @override
  String get browseSearchHint => 'Search Telugu or English titles…';

  @override
  String get browseSectionTrendingThisWeek => 'Trending this week';

  @override
  String get onboardingPage1Subtitle =>
      'Serialized fiction in beautiful Telugu typography. Read on your commute, offline.';

  @override
  String get onboardingPage2Title => 'No ads. No coins.';

  @override
  String onboardingPage2Subtitle(int price, int sharePct, int maxSharePct) {
    return '₹$price/month unlimited. $sharePct% base author share — up to $maxSharePct% at Apex Story Trust.';
  }

  @override
  String get onboardingPage3Title => 'Support creators';

  @override
  String get onboardingPage3Subtitle =>
      'Transparent earnings. Real stories. Your subscription keeps writers writing.';

  @override
  String get buttonSkip => 'Skip';

  @override
  String get buttonNext => 'Next';

  @override
  String get buttonStartReading => 'Start Reading';

  @override
  String get buttonContinueWithEmail => 'Continue with email';

  @override
  String get readerAuthEmailHeadline => 'Sign in with email';

  @override
  String get readerAuthEmailSubheadline =>
      'We\'ll send a one-time code to your inbox';

  @override
  String get readerAuthEmailLabel => 'Email address';

  @override
  String get buttonSending => 'Sending…';

  @override
  String get buttonSendSignInCode => 'Send sign-in code';

  @override
  String get buttonBackToGoogleSignIn => 'Back to Google sign-in';

  @override
  String get readerAuthCheckEmailHeadline => 'Check your email';

  @override
  String readerAuthCodeSentTo(String email) {
    return 'Enter the code sent to $email';
  }

  @override
  String get readerAuthSignInCodeLabel => 'Sign-in code';

  @override
  String get buttonVerifying => 'Verifying…';

  @override
  String get buttonVerifyAndContinue => 'Verify & Continue';

  @override
  String get buttonResendCode => 'Resend code';

  @override
  String get buttonUseDifferentEmail => 'Use a different email';

  @override
  String get readerAuthSubtitle => 'Sign in to continue reading';

  @override
  String get readerAuthCreatorNote =>
      'Creators verify phone separately in Creator Studio for payouts.';

  @override
  String get readerAuthTermsNotice =>
      'By continuing you agree to our Terms & Privacy';

  @override
  String readerAuthWelcomeTrial(int days) {
    return 'Welcome! $days-day unlimited reading unlocked.';
  }

  @override
  String get settingsSectionReading => 'Reading';

  @override
  String get settingsSectionComfort => 'Comfort';

  @override
  String settingsFontSizeSubtitle(int scale) {
    return 'Size $scale of 5 — tap Aa in reader for live preview';
  }

  @override
  String get settingsLineSpacing => 'Line spacing';

  @override
  String get settingsLineSpacingCompact => 'Compact';

  @override
  String get settingsLineSpacingComfort => 'Comfort';

  @override
  String get settingsLineSpacingSpacious => 'Spacious';

  @override
  String get settingsLineSpacingSpaciousDetail =>
      'Spacious (dyslexia friendly)';

  @override
  String get settingsLineSpacingComfortDetail => 'Comfort (recommended)';

  @override
  String get settingsTextAlignment => 'Text alignment';

  @override
  String get settingsAlignLeft => 'Left';

  @override
  String get settingsAlignJustified => 'Justified';

  @override
  String get settingsAlignLeftDetail => 'Left (recommended for readability)';

  @override
  String get settingsThemeSystemDetail =>
      'Match system — follows your device day/night schedule';

  @override
  String get settingsThemeDark => 'Dark';

  @override
  String get settingsThemeLight => 'Light';

  @override
  String get settingsThemeSystem => 'System';

  @override
  String get settingsCalmMotionSubtitle => 'Reduce animation across the app';

  @override
  String get settingsHighContrastSubtitle =>
      'Stronger text and borders for tired eyes';

  @override
  String get settingsReadingBreaksOff =>
      'Off — turn on for a gentle reminder between chapters';

  @override
  String settingsReadingBreaksOn(int minutes) {
    return 'A gentle nudge every $minutes min, only between chapters';
  }

  @override
  String get settingsReadingBreaks90 => '90 min';

  @override
  String get settingsReadingBreaks120 => '120 min';

  @override
  String get settingsSubscriptionActive => 'Katha Unlimited — Active';

  @override
  String settingsSubscriptionTrial(int days) {
    return 'Launch trial — $days days of unlimited reading left';
  }

  @override
  String settingsSubscriptionFree(int chapter) {
    return 'Free — ₹99/month from Chapter $chapter';
  }

  @override
  String get settingsSubscribeSnackbar =>
      'Open a locked chapter to subscribe with UPI — ₹99/mo · up to 60% to writers.';

  @override
  String get settingsSignInSubtitle =>
      'Google or email — required from Chapter 4';

  @override
  String get settingsNotifyNewChapters => 'New chapters';

  @override
  String get settingsNotifyNewChaptersSubtitle =>
      'When authors you read publish';

  @override
  String get settingsNotifySubscriptionReminders => 'Subscription reminders';

  @override
  String get settingsNotifySubscriptionRemindersSubtitle =>
      '3 days before renewal';

  @override
  String get settingsNotifyWeeklyTrending => 'Weekly trending';

  @override
  String get settingsNotifyWeeklyTrendingSubtitle => 'Sunday digest';

  @override
  String get storyDetailLoadError => 'Unable to load story';

  @override
  String get storyDetailNotFound => 'Story not found';

  @override
  String get storyDetailNextChapterLabel => 'Next chapter';

  @override
  String get storyDetailReleaseWeekly => 'New chapters weekly';

  @override
  String get storyDetailReleaseRomanceSchedule => 'Every Monday, 6:00 PM';

  @override
  String get storyDetailWhatReadersSay => 'What readers say';

  @override
  String get storyDetailChaptersHeading => 'Chapters';

  @override
  String get storyDetailStartReadingChapter1 => 'Start Reading — Chapter 1';

  @override
  String storyDetailChapterAccessFree(int readers, int minutes) {
    return 'Free · $readers readers · $minutes min';
  }

  @override
  String storyDetailChapterAccessSignIn(int minutes) {
    return 'Free · Sign in to read · $minutes min';
  }

  @override
  String storyDetailChapterAccessMembers(int readers, int minutes) {
    return '$readers readers · $minutes min · Members';
  }

  @override
  String storyDetailChapterAccessDefault(int readers, int minutes) {
    return '$readers readers · $minutes min';
  }

  @override
  String get readerShareTooltip => 'Share this chapter';

  @override
  String get readerReadingOptionsTooltip =>
      'Reading options (tone, size, spacing, alignment)';

  @override
  String get readerQuickFontSizeTooltip => 'Quick font size';

  @override
  String readerToneTooltip(String tone) {
    return 'Reading tone: $tone (tap to cycle)';
  }

  @override
  String readerViewsAndTime(int views, int minutes) {
    return '$views readers · $minutes min read';
  }

  @override
  String get readerCachedOffline => 'Cached — ready to read offline';

  @override
  String get readerChapterNavPrevious => 'Previous';

  @override
  String readerChapterNavCurrent(int number) {
    return 'Ch $number';
  }

  @override
  String get readerOtpGateTitle => 'Sign in to continue';

  @override
  String get readerOtpGateSubtitle =>
      'Chapter 4 and beyond require a free account';

  @override
  String get readerPaywallTrialEndedTitle => 'Your launch trial has ended';

  @override
  String get readerPaywallUnlockTitle => 'Unlock unlimited reading';

  @override
  String readerPaywallSubscribeAction(String price) {
    return 'Subscribe · $price';
  }

  @override
  String get readerEyeBreakReminder =>
      'You\'ve been reading a while — maybe stretch your eyes?';

  @override
  String get readerStreakUnlockedTitle => 'Streak Unlocked!';

  @override
  String get readerStreakDefaultMessage =>
      'Keep reading to maintain your streak.';

  @override
  String get readerPaymentCancelled => 'Payment cancelled';

  @override
  String readerSubscribedSnackbar(String shareLabel) {
    return 'Welcome to Katha Unlimited · $shareLabel';
  }

  @override
  String get readerPaymentActivating =>
      'Payment received — activating your subscription. Open this chapter again in a moment.';

  @override
  String readerPaymentRecorded(String status) {
    return 'Payment recorded ($status). If chapters stay locked, wait a moment and retry.';
  }

  @override
  String readerPaymentsBeingConfigured(String mode, String shareTransparency) {
    return 'Payments are being configured ($mode). $shareTransparency. Try again soon.';
  }

  @override
  String get readingOptionsToneLabel => 'Reading tone';

  @override
  String get readingOptionsLeftRecommended => 'Left (recommended)';

  @override
  String get readingOptionsFooterNote =>
      'Changes apply instantly. Left + generous spacing recommended for Telugu long-form reading.';

  @override
  String paywallShareBullet(String max, String price) {
    return 'Up to $max% of your ₹$price supports Telugu writers (Story Trust ladder)';
  }

  @override
  String get paywallWhatYouGet => 'What you get';

  @override
  String storyCardChapterCount(int count) {
    return '$count ch';
  }
}
