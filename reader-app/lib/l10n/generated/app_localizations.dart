import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_te.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'generated/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('te'),
  ];

  /// Bottom nav tab — home/discover feed
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get navHome;

  /// No description provided for @navLibrary.
  ///
  /// In en, this message translates to:
  /// **'Library'**
  String get navLibrary;

  /// No description provided for @navSettings.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get navSettings;

  /// No description provided for @navBrowse.
  ///
  /// In en, this message translates to:
  /// **'Browse'**
  String get navBrowse;

  /// No description provided for @settingsTitle.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settingsTitle;

  /// No description provided for @settingsReadingComfort.
  ///
  /// In en, this message translates to:
  /// **'Reading Comfort'**
  String get settingsReadingComfort;

  /// No description provided for @settingsFontSize.
  ///
  /// In en, this message translates to:
  /// **'Font Size'**
  String get settingsFontSize;

  /// No description provided for @settingsTheme.
  ///
  /// In en, this message translates to:
  /// **'Theme'**
  String get settingsTheme;

  /// No description provided for @settingsHighContrast.
  ///
  /// In en, this message translates to:
  /// **'High Contrast'**
  String get settingsHighContrast;

  /// No description provided for @settingsCalmMotion.
  ///
  /// In en, this message translates to:
  /// **'Reduce Motion'**
  String get settingsCalmMotion;

  /// No description provided for @settingsEyeBreakReminder.
  ///
  /// In en, this message translates to:
  /// **'Eye-break reminder'**
  String get settingsEyeBreakReminder;

  /// No description provided for @settingsEyeBreakReminderSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Gently reminds you to rest your eyes during long reading sessions'**
  String get settingsEyeBreakReminderSubtitle;

  /// No description provided for @settingsEasyReading.
  ///
  /// In en, this message translates to:
  /// **'Easy Reading'**
  String get settingsEasyReading;

  /// No description provided for @settingsEasyReadingSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Wider letter and line spacing for easier reading'**
  String get settingsEasyReadingSubtitle;

  /// No description provided for @settingsAccount.
  ///
  /// In en, this message translates to:
  /// **'Account'**
  String get settingsAccount;

  /// No description provided for @settingsSignOut.
  ///
  /// In en, this message translates to:
  /// **'Sign Out'**
  String get settingsSignOut;

  /// No description provided for @settingsSignIn.
  ///
  /// In en, this message translates to:
  /// **'Sign In'**
  String get settingsSignIn;

  /// No description provided for @settingsSubscription.
  ///
  /// In en, this message translates to:
  /// **'Subscription'**
  String get settingsSubscription;

  /// No description provided for @settingsAbout.
  ///
  /// In en, this message translates to:
  /// **'About'**
  String get settingsAbout;

  /// No description provided for @settingsLanguage.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get settingsLanguage;

  /// No description provided for @settingsNotifications.
  ///
  /// In en, this message translates to:
  /// **'Notifications'**
  String get settingsNotifications;

  /// No description provided for @settingsNotificationsReminder.
  ///
  /// In en, this message translates to:
  /// **'Notifications are off. You can turn them on anytime.'**
  String get settingsNotificationsReminder;

  /// No description provided for @settingsOff.
  ///
  /// In en, this message translates to:
  /// **'Off'**
  String get settingsOff;

  /// No description provided for @buttonSubscribe.
  ///
  /// In en, this message translates to:
  /// **'Subscribe'**
  String get buttonSubscribe;

  /// No description provided for @buttonRetry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get buttonRetry;

  /// No description provided for @buttonCancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get buttonCancel;

  /// No description provided for @buttonContinue.
  ///
  /// In en, this message translates to:
  /// **'Continue'**
  String get buttonContinue;

  /// No description provided for @buttonContinueReading.
  ///
  /// In en, this message translates to:
  /// **'Continue Reading'**
  String get buttonContinueReading;

  /// No description provided for @buttonFollow.
  ///
  /// In en, this message translates to:
  /// **'Follow'**
  String get buttonFollow;

  /// No description provided for @buttonFollowing.
  ///
  /// In en, this message translates to:
  /// **'Following'**
  String get buttonFollowing;

  /// No description provided for @buttonShare.
  ///
  /// In en, this message translates to:
  /// **'Share'**
  String get buttonShare;

  /// No description provided for @buttonDismiss.
  ///
  /// In en, this message translates to:
  /// **'Dismiss'**
  String get buttonDismiss;

  /// No description provided for @buttonNotNow.
  ///
  /// In en, this message translates to:
  /// **'Not now'**
  String get buttonNotNow;

  /// No description provided for @buttonAllow.
  ///
  /// In en, this message translates to:
  /// **'Allow'**
  String get buttonAllow;

  /// No description provided for @buttonDone.
  ///
  /// In en, this message translates to:
  /// **'Done'**
  String get buttonDone;

  /// No description provided for @buttonSignIn.
  ///
  /// In en, this message translates to:
  /// **'Sign In'**
  String get buttonSignIn;

  /// No description provided for @buttonSignInWithPhone.
  ///
  /// In en, this message translates to:
  /// **'Sign in with phone'**
  String get buttonSignInWithPhone;

  /// No description provided for @buttonSignInWithGoogle.
  ///
  /// In en, this message translates to:
  /// **'Sign in with Google'**
  String get buttonSignInWithGoogle;

  /// No description provided for @buttonGetStarted.
  ///
  /// In en, this message translates to:
  /// **'Get Started'**
  String get buttonGetStarted;

  /// No description provided for @paywallTitle.
  ///
  /// In en, this message translates to:
  /// **'Subscribe to keep reading'**
  String get paywallTitle;

  /// No description provided for @paywallPriceMonthly.
  ///
  /// In en, this message translates to:
  /// **'₹{price}/month'**
  String paywallPriceMonthly(String price);

  /// No description provided for @paywallSubtitleWithTrial.
  ///
  /// In en, this message translates to:
  /// **'₹{price}/month after your {days}-day launch trial · No ads · No coins'**
  String paywallSubtitleWithTrial(String price, int days);

  /// No description provided for @paywallSubtitleNoTrial.
  ///
  /// In en, this message translates to:
  /// **'₹{price}/month · No ads · No coins · {shareLine}'**
  String paywallSubtitleNoTrial(String price, String shareLine);

  /// No description provided for @paywallShareTransparency.
  ///
  /// In en, this message translates to:
  /// **'{base}% base author share · up to {max}% at Apex Story Trust'**
  String paywallShareTransparency(String base, String max);

  /// No description provided for @paywallBenefitNewChapters.
  ///
  /// In en, this message translates to:
  /// **'Read every chapter the moment it drops'**
  String get paywallBenefitNewChapters;

  /// No description provided for @paywallBenefitOffline.
  ///
  /// In en, this message translates to:
  /// **'Unlimited offline downloads'**
  String get paywallBenefitOffline;

  /// No description provided for @paywallBenefitAdFree.
  ///
  /// In en, this message translates to:
  /// **'Ad-free, distraction-free reading'**
  String get paywallBenefitAdFree;

  /// No description provided for @paywallTrustLine.
  ///
  /// In en, this message translates to:
  /// **'Cancel anytime · UPI auto-pay · Secure via Razorpay'**
  String get paywallTrustLine;

  /// No description provided for @errorRetry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get errorRetry;

  /// No description provided for @errorAvailableOffline.
  ///
  /// In en, this message translates to:
  /// **'Available offline:'**
  String get errorAvailableOffline;

  /// No description provided for @errorChapterNumber.
  ///
  /// In en, this message translates to:
  /// **'Chapter {number}'**
  String errorChapterNumber(int number);

  /// No description provided for @errorNoConnection.
  ///
  /// In en, this message translates to:
  /// **'No connection. Check your internet and try again.'**
  String get errorNoConnection;

  /// No description provided for @errorSomethingWrong.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong. Please try again.'**
  String get errorSomethingWrong;

  /// No description provided for @homeEmptyCatalog.
  ///
  /// In en, this message translates to:
  /// **'No stories to show yet. Pull to refresh in a moment.'**
  String get homeEmptyCatalog;

  /// No description provided for @genreRomance.
  ///
  /// In en, this message translates to:
  /// **'Romance'**
  String get genreRomance;

  /// No description provided for @genreFamilyDrama.
  ///
  /// In en, this message translates to:
  /// **'Family Drama'**
  String get genreFamilyDrama;

  /// No description provided for @genreSuspense.
  ///
  /// In en, this message translates to:
  /// **'Suspense'**
  String get genreSuspense;

  /// No description provided for @genreFamilyShort.
  ///
  /// In en, this message translates to:
  /// **'Family'**
  String get genreFamilyShort;

  /// No description provided for @readerAuthGenericError.
  ///
  /// In en, this message translates to:
  /// **'Sign-in failed. Please try again.'**
  String get readerAuthGenericError;

  /// No description provided for @readerAuthInvalidCode.
  ///
  /// In en, this message translates to:
  /// **'That code did not work. Check and try again.'**
  String get readerAuthInvalidCode;

  /// No description provided for @readerAuthEmailSendFailed.
  ///
  /// In en, this message translates to:
  /// **'Could not send the sign-in code. Try again.'**
  String get readerAuthEmailSendFailed;

  /// No description provided for @paymentFailedGeneric.
  ///
  /// In en, this message translates to:
  /// **'Payment could not be completed. Please try again.'**
  String get paymentFailedGeneric;

  /// No description provided for @readerEndOfStoryTitle.
  ///
  /// In en, this message translates to:
  /// **'You\'ve finished this story'**
  String get readerEndOfStoryTitle;

  /// No description provided for @readerEndOfStorySubtitle.
  ///
  /// In en, this message translates to:
  /// **'Thanks for reading. Discover more Telugu stories on the home shelf.'**
  String get readerEndOfStorySubtitle;

  /// No description provided for @readerBackTooltip.
  ///
  /// In en, this message translates to:
  /// **'Back'**
  String get readerBackTooltip;

  /// No description provided for @readerFeedbackTooltip.
  ///
  /// In en, this message translates to:
  /// **'Send feedback to the author'**
  String get readerFeedbackTooltip;

  /// No description provided for @readerFeedbackTitle.
  ///
  /// In en, this message translates to:
  /// **'Feedback for the author'**
  String get readerFeedbackTitle;

  /// No description provided for @readerPraiseTitle.
  ///
  /// In en, this message translates to:
  /// **'Praise for the author'**
  String get readerPraiseTitle;

  /// No description provided for @readerFeedbackPrivate.
  ///
  /// In en, this message translates to:
  /// **'Private feedback'**
  String get readerFeedbackPrivate;

  /// No description provided for @readerPraise.
  ///
  /// In en, this message translates to:
  /// **'Praise'**
  String get readerPraise;

  /// No description provided for @readerFeedbackPrivateHint.
  ///
  /// In en, this message translates to:
  /// **'Always private. Never shown to other readers.'**
  String get readerFeedbackPrivateHint;

  /// No description provided for @readerPraiseHint.
  ///
  /// In en, this message translates to:
  /// **'Only visible to the author — they choose whether to show it publicly as a testimonial.'**
  String get readerPraiseHint;

  /// No description provided for @readerFeedbackSend.
  ///
  /// In en, this message translates to:
  /// **'Send feedback'**
  String get readerFeedbackSend;

  /// No description provided for @readerPraiseSend.
  ///
  /// In en, this message translates to:
  /// **'Send praise'**
  String get readerPraiseSend;

  /// No description provided for @readerFeedbackThanks.
  ///
  /// In en, this message translates to:
  /// **'Thank you — your feedback was sent to the author.'**
  String get readerFeedbackThanks;

  /// No description provided for @readerFeedbackFailed.
  ///
  /// In en, this message translates to:
  /// **'Could not send feedback. Try again.'**
  String get readerFeedbackFailed;

  /// No description provided for @readerReportTitle.
  ///
  /// In en, this message translates to:
  /// **'Report this story'**
  String get readerReportTitle;

  /// No description provided for @readerReportBody.
  ///
  /// In en, this message translates to:
  /// **'Reports go to Katha\'s moderation team, not the author. We review carefully and never take a story down on a single report.'**
  String get readerReportBody;

  /// No description provided for @readerReportSubmit.
  ///
  /// In en, this message translates to:
  /// **'Submit report'**
  String get readerReportSubmit;

  /// No description provided for @readerReportThanks.
  ///
  /// In en, this message translates to:
  /// **'Report submitted — thank you for helping keep Katha safe.'**
  String get readerReportThanks;

  /// No description provided for @readerReportFailed.
  ///
  /// In en, this message translates to:
  /// **'Could not submit the report. Try again.'**
  String get readerReportFailed;

  /// No description provided for @readerReportInstead.
  ///
  /// In en, this message translates to:
  /// **'Report this story instead'**
  String get readerReportInstead;

  /// No description provided for @readerOpenOfflineChapter.
  ///
  /// In en, this message translates to:
  /// **'Open offline chapter {number}'**
  String readerOpenOfflineChapter(int number);

  /// No description provided for @readerFeedbackHintPraise.
  ///
  /// In en, this message translates to:
  /// **'What did you love about this chapter?'**
  String get readerFeedbackHintPraise;

  /// No description provided for @readerFeedbackHintPrivate.
  ///
  /// In en, this message translates to:
  /// **'What did you think of this chapter?'**
  String get readerFeedbackHintPrivate;

  /// No description provided for @readerFeedbackMinWords.
  ///
  /// In en, this message translates to:
  /// **'Please write at least a few words.'**
  String get readerFeedbackMinWords;

  /// No description provided for @readerReportHate.
  ///
  /// In en, this message translates to:
  /// **'Hate / harmful content'**
  String get readerReportHate;

  /// No description provided for @readerReportCopyright.
  ///
  /// In en, this message translates to:
  /// **'Copyright'**
  String get readerReportCopyright;

  /// No description provided for @readerReportCopyrightHint.
  ///
  /// In en, this message translates to:
  /// **'Copyright claims use a separate notice process on the web form so we can collect required details.'**
  String get readerReportCopyrightHint;

  /// No description provided for @readerReportReasonHint.
  ///
  /// In en, this message translates to:
  /// **'What\'s the issue? (10+ characters)'**
  String get readerReportReasonHint;

  /// No description provided for @readerReportReasonMin.
  ///
  /// In en, this message translates to:
  /// **'Provide a reason (10+ characters).'**
  String get readerReportReasonMin;

  /// No description provided for @maturityGeneral.
  ///
  /// In en, this message translates to:
  /// **'General'**
  String get maturityGeneral;

  /// No description provided for @maturityMature.
  ///
  /// In en, this message translates to:
  /// **'Mature Themes'**
  String get maturityMature;

  /// No description provided for @notificationFollowPrompt.
  ///
  /// In en, this message translates to:
  /// **'Get notified when {authorName} publishes a new chapter'**
  String notificationFollowPrompt(String authorName);

  /// No description provided for @notificationArcCompletePrompt.
  ///
  /// In en, this message translates to:
  /// **'Get notified when your followed authors publish new chapters'**
  String get notificationArcCompletePrompt;

  /// No description provided for @notificationPermissionTitle.
  ///
  /// In en, this message translates to:
  /// **'Never miss a new chapter'**
  String get notificationPermissionTitle;

  /// No description provided for @onboardingWelcomeTitle.
  ///
  /// In en, this message translates to:
  /// **'తెలుగు కథలు'**
  String get onboardingWelcomeTitle;

  /// No description provided for @onboardingWelcomeSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Telugu stories, told well'**
  String get onboardingWelcomeSubtitle;

  /// No description provided for @emptyLibraryTitle.
  ///
  /// In en, this message translates to:
  /// **'Your library is empty'**
  String get emptyLibraryTitle;

  /// No description provided for @emptyLibrarySubtitle.
  ///
  /// In en, this message translates to:
  /// **'Stories you follow or bookmark will appear here'**
  String get emptyLibrarySubtitle;

  /// No description provided for @emptyFollowedAuthorsTitle.
  ///
  /// In en, this message translates to:
  /// **'No followed authors yet'**
  String get emptyFollowedAuthorsTitle;

  /// No description provided for @emptyFollowedAuthorsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Follow authors to get notified about new chapters'**
  String get emptyFollowedAuthorsSubtitle;

  /// No description provided for @emptySearchResultsTitle.
  ///
  /// In en, this message translates to:
  /// **'No stories found'**
  String get emptySearchResultsTitle;

  /// No description provided for @emptySearchResultsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Try a different genre or search term'**
  String get emptySearchResultsSubtitle;

  /// No description provided for @genreFilterAll.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get genreFilterAll;

  /// No description provided for @sectionNewReleases.
  ///
  /// In en, this message translates to:
  /// **'New releases'**
  String get sectionNewReleases;

  /// No description provided for @sectionTrendingNow.
  ///
  /// In en, this message translates to:
  /// **'Trending now'**
  String get sectionTrendingNow;

  /// No description provided for @sectionTrendingSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Stories readers are loving right now'**
  String get sectionTrendingSubtitle;

  /// No description provided for @browseTitle.
  ///
  /// In en, this message translates to:
  /// **'Browse'**
  String get browseTitle;

  /// No description provided for @browseSearchHint.
  ///
  /// In en, this message translates to:
  /// **'Search Telugu or English titles…'**
  String get browseSearchHint;

  /// No description provided for @browseSectionTrendingThisWeek.
  ///
  /// In en, this message translates to:
  /// **'Trending this week'**
  String get browseSectionTrendingThisWeek;

  /// No description provided for @onboardingPage1Subtitle.
  ///
  /// In en, this message translates to:
  /// **'Serialized fiction in beautiful Telugu typography. Read on your commute, offline.'**
  String get onboardingPage1Subtitle;

  /// No description provided for @onboardingPage2Title.
  ///
  /// In en, this message translates to:
  /// **'No ads. No coins.'**
  String get onboardingPage2Title;

  /// No description provided for @onboardingPage2Subtitle.
  ///
  /// In en, this message translates to:
  /// **'₹{price}/month unlimited. {sharePct}% base author share — up to {maxSharePct}% at Apex Story Trust.'**
  String onboardingPage2Subtitle(int price, int sharePct, int maxSharePct);

  /// No description provided for @onboardingPage3Title.
  ///
  /// In en, this message translates to:
  /// **'Support creators'**
  String get onboardingPage3Title;

  /// No description provided for @onboardingPage3Subtitle.
  ///
  /// In en, this message translates to:
  /// **'Transparent earnings. Real stories. Your subscription keeps writers writing.'**
  String get onboardingPage3Subtitle;

  /// No description provided for @buttonSkip.
  ///
  /// In en, this message translates to:
  /// **'Skip'**
  String get buttonSkip;

  /// No description provided for @buttonNext.
  ///
  /// In en, this message translates to:
  /// **'Next'**
  String get buttonNext;

  /// No description provided for @buttonStartReading.
  ///
  /// In en, this message translates to:
  /// **'Start Reading'**
  String get buttonStartReading;

  /// No description provided for @buttonContinueWithEmail.
  ///
  /// In en, this message translates to:
  /// **'Continue with email'**
  String get buttonContinueWithEmail;

  /// No description provided for @readerAuthEmailHeadline.
  ///
  /// In en, this message translates to:
  /// **'Sign in with email'**
  String get readerAuthEmailHeadline;

  /// No description provided for @readerAuthEmailSubheadline.
  ///
  /// In en, this message translates to:
  /// **'We\'ll send a one-time code to your inbox'**
  String get readerAuthEmailSubheadline;

  /// No description provided for @readerAuthEmailLabel.
  ///
  /// In en, this message translates to:
  /// **'Email address'**
  String get readerAuthEmailLabel;

  /// No description provided for @buttonSending.
  ///
  /// In en, this message translates to:
  /// **'Sending…'**
  String get buttonSending;

  /// No description provided for @buttonSendSignInCode.
  ///
  /// In en, this message translates to:
  /// **'Send sign-in code'**
  String get buttonSendSignInCode;

  /// No description provided for @buttonBackToGoogleSignIn.
  ///
  /// In en, this message translates to:
  /// **'Back to Google sign-in'**
  String get buttonBackToGoogleSignIn;

  /// No description provided for @readerAuthCheckEmailHeadline.
  ///
  /// In en, this message translates to:
  /// **'Check your email'**
  String get readerAuthCheckEmailHeadline;

  /// No description provided for @readerAuthCodeSentTo.
  ///
  /// In en, this message translates to:
  /// **'Enter the code sent to {email}'**
  String readerAuthCodeSentTo(String email);

  /// No description provided for @readerAuthSignInCodeLabel.
  ///
  /// In en, this message translates to:
  /// **'Sign-in code'**
  String get readerAuthSignInCodeLabel;

  /// No description provided for @buttonVerifying.
  ///
  /// In en, this message translates to:
  /// **'Verifying…'**
  String get buttonVerifying;

  /// No description provided for @buttonVerifyAndContinue.
  ///
  /// In en, this message translates to:
  /// **'Verify & Continue'**
  String get buttonVerifyAndContinue;

  /// No description provided for @buttonResendCode.
  ///
  /// In en, this message translates to:
  /// **'Resend code'**
  String get buttonResendCode;

  /// No description provided for @buttonUseDifferentEmail.
  ///
  /// In en, this message translates to:
  /// **'Use a different email'**
  String get buttonUseDifferentEmail;

  /// No description provided for @readerAuthSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Sign in free to keep reading this story'**
  String get readerAuthSubtitle;

  /// No description provided for @readerAuthPromiseNote.
  ///
  /// In en, this message translates to:
  /// **'After sign-in you continue from this chapter. Subscription is only for later locked chapters — not required to finish your free sample.'**
  String get readerAuthPromiseNote;

  /// No description provided for @readerAuthCreatorNote.
  ///
  /// In en, this message translates to:
  /// **'Creators verify phone separately in Creator Studio for payouts.'**
  String get readerAuthCreatorNote;

  /// No description provided for @readerAuthTermsNotice.
  ///
  /// In en, this message translates to:
  /// **'By continuing you agree to our Terms & Privacy'**
  String get readerAuthTermsNotice;

  /// No description provided for @readerAuthWelcomeTrial.
  ///
  /// In en, this message translates to:
  /// **'Welcome! {days}-day unlimited reading unlocked.'**
  String readerAuthWelcomeTrial(int days);

  /// No description provided for @readerAuthContinueSuccess.
  ///
  /// In en, this message translates to:
  /// **'Welcome back — continuing your story.'**
  String get readerAuthContinueSuccess;

  /// No description provided for @readerAuthGoogleUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Google sign-in is not configured on this build. Use email instead.'**
  String get readerAuthGoogleUnavailable;

  /// No description provided for @readerAuthGoogleFailedUseEmail.
  ///
  /// In en, this message translates to:
  /// **'Google sign-in failed. Continue with email below.'**
  String get readerAuthGoogleFailedUseEmail;

  /// No description provided for @buttonSignInAndContinue.
  ///
  /// In en, this message translates to:
  /// **'Sign in & continue reading'**
  String get buttonSignInAndContinue;

  /// No description provided for @settingsSectionReading.
  ///
  /// In en, this message translates to:
  /// **'Reading'**
  String get settingsSectionReading;

  /// No description provided for @settingsSectionComfort.
  ///
  /// In en, this message translates to:
  /// **'Comfort'**
  String get settingsSectionComfort;

  /// No description provided for @settingsFontSizeSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Size {scale} of 5 — tap Aa in reader for live preview'**
  String settingsFontSizeSubtitle(int scale);

  /// No description provided for @settingsLineSpacing.
  ///
  /// In en, this message translates to:
  /// **'Line spacing'**
  String get settingsLineSpacing;

  /// No description provided for @settingsLineSpacingCompact.
  ///
  /// In en, this message translates to:
  /// **'Compact'**
  String get settingsLineSpacingCompact;

  /// No description provided for @settingsLineSpacingComfort.
  ///
  /// In en, this message translates to:
  /// **'Comfort'**
  String get settingsLineSpacingComfort;

  /// No description provided for @settingsLineSpacingSpacious.
  ///
  /// In en, this message translates to:
  /// **'Spacious'**
  String get settingsLineSpacingSpacious;

  /// No description provided for @settingsLineSpacingSpaciousDetail.
  ///
  /// In en, this message translates to:
  /// **'Spacious (dyslexia friendly)'**
  String get settingsLineSpacingSpaciousDetail;

  /// No description provided for @settingsLineSpacingComfortDetail.
  ///
  /// In en, this message translates to:
  /// **'Comfort (recommended)'**
  String get settingsLineSpacingComfortDetail;

  /// No description provided for @settingsTextAlignment.
  ///
  /// In en, this message translates to:
  /// **'Text alignment'**
  String get settingsTextAlignment;

  /// No description provided for @settingsAlignLeft.
  ///
  /// In en, this message translates to:
  /// **'Left'**
  String get settingsAlignLeft;

  /// No description provided for @settingsAlignJustified.
  ///
  /// In en, this message translates to:
  /// **'Justified'**
  String get settingsAlignJustified;

  /// No description provided for @settingsAlignLeftDetail.
  ///
  /// In en, this message translates to:
  /// **'Left (recommended for readability)'**
  String get settingsAlignLeftDetail;

  /// No description provided for @settingsThemeSystemDetail.
  ///
  /// In en, this message translates to:
  /// **'Match system — follows your device day/night schedule'**
  String get settingsThemeSystemDetail;

  /// No description provided for @settingsThemeDark.
  ///
  /// In en, this message translates to:
  /// **'Dark'**
  String get settingsThemeDark;

  /// No description provided for @settingsThemeLight.
  ///
  /// In en, this message translates to:
  /// **'Light'**
  String get settingsThemeLight;

  /// No description provided for @settingsThemeSystem.
  ///
  /// In en, this message translates to:
  /// **'System'**
  String get settingsThemeSystem;

  /// No description provided for @settingsCalmMotionSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Reduce animation across the app'**
  String get settingsCalmMotionSubtitle;

  /// No description provided for @settingsHighContrastSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Stronger text and borders for tired eyes'**
  String get settingsHighContrastSubtitle;

  /// No description provided for @settingsReadingBreaksOff.
  ///
  /// In en, this message translates to:
  /// **'Off — turn on for a gentle reminder between chapters'**
  String get settingsReadingBreaksOff;

  /// No description provided for @settingsReadingBreaksOn.
  ///
  /// In en, this message translates to:
  /// **'A gentle nudge every {minutes} min, only between chapters'**
  String settingsReadingBreaksOn(int minutes);

  /// No description provided for @settingsReadingBreaks90.
  ///
  /// In en, this message translates to:
  /// **'90 min'**
  String get settingsReadingBreaks90;

  /// No description provided for @settingsReadingBreaks120.
  ///
  /// In en, this message translates to:
  /// **'120 min'**
  String get settingsReadingBreaks120;

  /// No description provided for @settingsSubscriptionActive.
  ///
  /// In en, this message translates to:
  /// **'Katha Unlimited — Active'**
  String get settingsSubscriptionActive;

  /// No description provided for @settingsSubscriptionTrial.
  ///
  /// In en, this message translates to:
  /// **'Launch trial — {days} days of unlimited reading left'**
  String settingsSubscriptionTrial(int days);

  /// No description provided for @settingsSubscriptionFree.
  ///
  /// In en, this message translates to:
  /// **'Free — ₹99/month from Chapter {chapter}'**
  String settingsSubscriptionFree(int chapter);

  /// No description provided for @settingsSubscribeSnackbar.
  ///
  /// In en, this message translates to:
  /// **'Open a locked chapter to subscribe with UPI — ₹99/mo · up to 60% to writers.'**
  String get settingsSubscribeSnackbar;

  /// No description provided for @settingsSignInSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Google or email — free account to continue after the free sample'**
  String get settingsSignInSubtitle;

  /// No description provided for @settingsNotifyNewChapters.
  ///
  /// In en, this message translates to:
  /// **'New chapters'**
  String get settingsNotifyNewChapters;

  /// No description provided for @settingsNotifyNewChaptersSubtitle.
  ///
  /// In en, this message translates to:
  /// **'When authors you read publish'**
  String get settingsNotifyNewChaptersSubtitle;

  /// No description provided for @settingsNotifySubscriptionReminders.
  ///
  /// In en, this message translates to:
  /// **'Subscription reminders'**
  String get settingsNotifySubscriptionReminders;

  /// No description provided for @settingsNotifySubscriptionRemindersSubtitle.
  ///
  /// In en, this message translates to:
  /// **'3 days before renewal'**
  String get settingsNotifySubscriptionRemindersSubtitle;

  /// No description provided for @settingsNotifyWeeklyTrending.
  ///
  /// In en, this message translates to:
  /// **'Weekly trending'**
  String get settingsNotifyWeeklyTrending;

  /// No description provided for @settingsNotifyWeeklyTrendingSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Sunday digest'**
  String get settingsNotifyWeeklyTrendingSubtitle;

  /// No description provided for @storyDetailLoadError.
  ///
  /// In en, this message translates to:
  /// **'Unable to load story'**
  String get storyDetailLoadError;

  /// No description provided for @storyDetailNotFound.
  ///
  /// In en, this message translates to:
  /// **'Story not found'**
  String get storyDetailNotFound;

  /// No description provided for @storyDetailNextChapterLabel.
  ///
  /// In en, this message translates to:
  /// **'Next chapter'**
  String get storyDetailNextChapterLabel;

  /// No description provided for @storyDetailReleaseWeekly.
  ///
  /// In en, this message translates to:
  /// **'New chapters weekly'**
  String get storyDetailReleaseWeekly;

  /// No description provided for @storyDetailReleaseRomanceSchedule.
  ///
  /// In en, this message translates to:
  /// **'Every Monday, 6:00 PM'**
  String get storyDetailReleaseRomanceSchedule;

  /// No description provided for @storyDetailWhatReadersSay.
  ///
  /// In en, this message translates to:
  /// **'What readers say'**
  String get storyDetailWhatReadersSay;

  /// No description provided for @storyDetailChaptersHeading.
  ///
  /// In en, this message translates to:
  /// **'Chapters'**
  String get storyDetailChaptersHeading;

  /// No description provided for @storyDetailStartReadingChapter1.
  ///
  /// In en, this message translates to:
  /// **'Start Reading — Chapter 1'**
  String get storyDetailStartReadingChapter1;

  /// No description provided for @storyDetailChapterAccessFree.
  ///
  /// In en, this message translates to:
  /// **'Free · {readers} readers · {minutes} min'**
  String storyDetailChapterAccessFree(int readers, int minutes);

  /// No description provided for @storyDetailChapterAccessSignIn.
  ///
  /// In en, this message translates to:
  /// **'Free · Sign in to read · {minutes} min'**
  String storyDetailChapterAccessSignIn(int minutes);

  /// No description provided for @storyDetailChapterAccessMembers.
  ///
  /// In en, this message translates to:
  /// **'{readers} readers · {minutes} min · Members'**
  String storyDetailChapterAccessMembers(int readers, int minutes);

  /// No description provided for @storyDetailChapterAccessDefault.
  ///
  /// In en, this message translates to:
  /// **'{readers} readers · {minutes} min'**
  String storyDetailChapterAccessDefault(int readers, int minutes);

  /// No description provided for @readerShareTooltip.
  ///
  /// In en, this message translates to:
  /// **'Share this chapter'**
  String get readerShareTooltip;

  /// No description provided for @readerReadingOptionsTooltip.
  ///
  /// In en, this message translates to:
  /// **'Reading options (tone, size, spacing, alignment)'**
  String get readerReadingOptionsTooltip;

  /// No description provided for @readerQuickFontSizeTooltip.
  ///
  /// In en, this message translates to:
  /// **'Quick font size'**
  String get readerQuickFontSizeTooltip;

  /// No description provided for @readerToneTooltip.
  ///
  /// In en, this message translates to:
  /// **'Reading tone: {tone} (tap to cycle)'**
  String readerToneTooltip(String tone);

  /// No description provided for @readerViewsAndTime.
  ///
  /// In en, this message translates to:
  /// **'{views} readers · {minutes} min read'**
  String readerViewsAndTime(int views, int minutes);

  /// No description provided for @readerCachedOffline.
  ///
  /// In en, this message translates to:
  /// **'Cached — ready to read offline'**
  String get readerCachedOffline;

  /// No description provided for @readerChapterNavPrevious.
  ///
  /// In en, this message translates to:
  /// **'Previous'**
  String get readerChapterNavPrevious;

  /// No description provided for @readerChapterNavCurrent.
  ///
  /// In en, this message translates to:
  /// **'Ch {number}'**
  String readerChapterNavCurrent(int number);

  /// No description provided for @readerOtpGateTitle.
  ///
  /// In en, this message translates to:
  /// **'Sign in to continue'**
  String get readerOtpGateTitle;

  /// No description provided for @readerOtpGateSubtitle.
  ///
  /// In en, this message translates to:
  /// **'A free account lets you keep reading this story from this chapter. No payment yet — subscribe only when locked chapters begin.'**
  String get readerOtpGateSubtitle;

  /// No description provided for @readerPaywallTrialEndedTitle.
  ///
  /// In en, this message translates to:
  /// **'Your launch trial has ended'**
  String get readerPaywallTrialEndedTitle;

  /// No description provided for @readerPaywallUnlockTitle.
  ///
  /// In en, this message translates to:
  /// **'Subscribe to keep reading'**
  String get readerPaywallUnlockTitle;

  /// No description provided for @readerPaywallSubscribeAction.
  ///
  /// In en, this message translates to:
  /// **'Subscribe · {price}'**
  String readerPaywallSubscribeAction(String price);

  /// No description provided for @readerEyeBreakReminder.
  ///
  /// In en, this message translates to:
  /// **'You\'ve been reading a while — maybe stretch your eyes?'**
  String get readerEyeBreakReminder;

  /// No description provided for @readerStreakUnlockedTitle.
  ///
  /// In en, this message translates to:
  /// **'Streak Unlocked!'**
  String get readerStreakUnlockedTitle;

  /// No description provided for @readerStreakDefaultMessage.
  ///
  /// In en, this message translates to:
  /// **'Keep reading to maintain your streak.'**
  String get readerStreakDefaultMessage;

  /// No description provided for @readerPaymentCancelled.
  ///
  /// In en, this message translates to:
  /// **'Payment cancelled'**
  String get readerPaymentCancelled;

  /// No description provided for @readerSubscribedSnackbar.
  ///
  /// In en, this message translates to:
  /// **'Welcome to Katha Unlimited · {shareLabel}'**
  String readerSubscribedSnackbar(String shareLabel);

  /// No description provided for @readerPaymentActivating.
  ///
  /// In en, this message translates to:
  /// **'Payment received — activating your subscription. Open this chapter again in a moment.'**
  String get readerPaymentActivating;

  /// No description provided for @readerPaymentRecorded.
  ///
  /// In en, this message translates to:
  /// **'Payment recorded ({status}). If chapters stay locked, wait a moment and retry.'**
  String readerPaymentRecorded(String status);

  /// No description provided for @readerPaymentsBeingConfigured.
  ///
  /// In en, this message translates to:
  /// **'Payments are being configured ({mode}). {shareTransparency}. Try again soon.'**
  String readerPaymentsBeingConfigured(String mode, String shareTransparency);

  /// No description provided for @readingOptionsToneLabel.
  ///
  /// In en, this message translates to:
  /// **'Reading tone'**
  String get readingOptionsToneLabel;

  /// No description provided for @readingOptionsLeftRecommended.
  ///
  /// In en, this message translates to:
  /// **'Left (recommended)'**
  String get readingOptionsLeftRecommended;

  /// No description provided for @readingOptionsFooterNote.
  ///
  /// In en, this message translates to:
  /// **'Changes apply instantly. Left + generous spacing recommended for Telugu long-form reading.'**
  String get readingOptionsFooterNote;

  /// No description provided for @paywallShareBullet.
  ///
  /// In en, this message translates to:
  /// **'Up to {max}% of your ₹{price} supports Telugu writers (Story Trust ladder)'**
  String paywallShareBullet(String max, String price);

  /// No description provided for @paywallWhatYouGet.
  ///
  /// In en, this message translates to:
  /// **'What you get'**
  String get paywallWhatYouGet;

  /// No description provided for @storyCardChapterCount.
  ///
  /// In en, this message translates to:
  /// **'{count} ch'**
  String storyCardChapterCount(int count);
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'te'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'te':
      return AppLocalizationsTe();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
