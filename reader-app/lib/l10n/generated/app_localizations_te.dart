// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Telugu (`te`).
class AppLocalizationsTe extends AppLocalizations {
  AppLocalizationsTe([String locale = 'te']) : super(locale);

  @override
  String get navHome => 'హోమ్';

  @override
  String get navLibrary => 'లైబ్రరీ';

  @override
  String get navSettings => 'సెట్టింగ్‌లు';

  @override
  String get navBrowse => 'బ్రౌజ్';

  @override
  String get settingsTitle => 'సెట్టింగ్‌లు';

  @override
  String get settingsReadingComfort => 'రీడింగ్ కంఫర్ట్';

  @override
  String get settingsFontSize => 'ఫాంట్ పరిమాణం';

  @override
  String get settingsTheme => 'థీమ్';

  @override
  String get settingsHighContrast => 'హై కాంట్రాస్ట్';

  @override
  String get settingsCalmMotion => 'తక్కువ యానిమేషన్';

  @override
  String get settingsEyeBreakReminder => 'కంటి విశ్రాంతి రిమైండర్';

  @override
  String get settingsEyeBreakReminderSubtitle =>
      'సుదీర్ఘ రీడింగ్ సెషన్‌లలో మీ కళ్ళకు విశ్రాంతినివ్వమని సున్నితంగా గుర్తు చేస్తుంది';

  @override
  String get settingsEasyReading => 'ఈజీ రీడింగ్';

  @override
  String get settingsEasyReadingSubtitle =>
      'సులభంగా చదవడానికి వెడల్పైన అక్షర, పంక్తి అంతరం';

  @override
  String get settingsAccount => 'ఖాతా';

  @override
  String get settingsSignOut => 'సైన్ అవుట్';

  @override
  String get settingsSignIn => 'సైన్ ఇన్';

  @override
  String get settingsSubscription => 'సబ్‌స్క్రిప్షన్';

  @override
  String get settingsAbout => 'గురించి';

  @override
  String get settingsLanguage => 'భాష';

  @override
  String get settingsNotifications => 'నోటిఫికేషన్‌లు';

  @override
  String get settingsNotificationsReminder =>
      'నోటిఫికేషన్‌లు ఆఫ్‌లో ఉన్నాయి. మీరు వాటిని ఎప్పుడైనా ఆన్ చేయవచ్చు.';

  @override
  String get settingsOff => 'ఆఫ్';

  @override
  String get buttonSubscribe => 'సబ్‌స్క్రైబ్ చేయండి';

  @override
  String get buttonRetry => 'మళ్ళీ ప్రయత్నించండి';

  @override
  String get buttonCancel => 'రద్దు చేయండి';

  @override
  String get buttonContinue => 'కొనసాగించండి';

  @override
  String get buttonContinueReading => 'చదవడం కొనసాగించండి';

  @override
  String get buttonFollow => 'ఫాలో అవ్వండి';

  @override
  String get buttonFollowing => 'ఫాలో అవుతున్నారు';

  @override
  String get buttonShare => 'షేర్ చేయండి';

  @override
  String get buttonDismiss => 'విస్మరించు';

  @override
  String get buttonNotNow => 'ఇప్పుడు వద్దు';

  @override
  String get buttonAllow => 'అనుమతించు';

  @override
  String get buttonDone => 'పూర్తయింది';

  @override
  String get buttonSignIn => 'సైన్ ఇన్ చేయండి';

  @override
  String get buttonSignInWithPhone => 'ఫోన్‌తో సైన్ ఇన్ చేయండి';

  @override
  String get buttonSignInWithGoogle => 'Googleతో సైన్ ఇన్ చేయండి';

  @override
  String get buttonGetStarted => 'ప్రారంభించండి';

  @override
  String get paywallTitle => 'చదవడం కొనసాగించడానికి సబ్‌స్క్రైబ్ చేయండి';

  @override
  String paywallPriceMonthly(String price) {
    return 'నెలకు ₹$price';
  }

  @override
  String paywallSubtitleWithTrial(String price, int days) {
    return 'మీ $days-రోజుల లాంచ్ ట్రయల్ తర్వాత నెలకు ₹$price · ప్రకటనలు లేవు · కాయిన్‌లు లేవు';
  }

  @override
  String paywallSubtitleNoTrial(String price, String shareLine) {
    return 'నెలకు ₹$price · ప్రకటనలు లేవు · కాయిన్‌లు లేవు · $shareLine';
  }

  @override
  String paywallShareTransparency(String base, String max) {
    return '$base% ప్రాథమిక రచయిత వాటా · Apex స్టోరీ ట్రస్ట్‌లో $max% వరకు';
  }

  @override
  String get paywallBenefitNewChapters =>
      'ప్రతి అధ్యాయాన్ని అది విడుదలైన వెంటనే చదవండి';

  @override
  String get paywallBenefitOffline => 'అపరిమిత ఆఫ్‌లైన్ డౌన్‌లోడ్‌లు';

  @override
  String get paywallBenefitAdFree => 'ప్రకటనలు లేని, పరధ్యానం లేని పఠనం';

  @override
  String get paywallTrustLine =>
      'ఎప్పుడైనా రద్దు చేసుకోవచ్చు · UPI ఆటో-పే · Razorpay ద్వారా సురక్షితం';

  @override
  String get errorRetry => 'మళ్ళీ ప్రయత్నించండి';

  @override
  String get errorAvailableOffline => 'ఆఫ్‌లైన్‌లో అందుబాటులో ఉంది:';

  @override
  String errorChapterNumber(int number) {
    return 'అధ్యాయం $number';
  }

  @override
  String get errorNoConnection =>
      'కనెక్షన్ లేదు. మీ ఇంటర్నెట్‌ను తనిఖీ చేసి మళ్ళీ ప్రయత్నించండి.';

  @override
  String get errorSomethingWrong =>
      'ఏదో తప్పు జరిగింది. దయచేసి మళ్ళీ ప్రయత్నించండి.';

  @override
  String get maturityGeneral => 'సాధారణం';

  @override
  String get maturityMature => 'పరిణతి చెందిన అంశాలు';

  @override
  String notificationFollowPrompt(String authorName) {
    return '$authorName కొత్త అధ్యాయాన్ని ప్రచురించినప్పుడు మీకు తెలియజేయబడుతుంది';
  }

  @override
  String get notificationArcCompletePrompt =>
      'మీరు ఫాలో అయ్యే రచయితలు కొత్త అధ్యాయాలు ప్రచురించినప్పుడు మీకు తెలియజేయబడుతుంది';

  @override
  String get notificationPermissionTitle => 'ఏ కొత్త అధ్యాయాన్ని మిస్ కావద్దు';

  @override
  String get onboardingWelcomeTitle => 'తెలుగు కథలు';

  @override
  String get onboardingWelcomeSubtitle => 'తెలుగు కథలు, చక్కగా చెప్పబడ్డాయి';

  @override
  String get emptyLibraryTitle => 'మీ లైబ్రరీ ఖాళీగా ఉంది';

  @override
  String get emptyLibrarySubtitle =>
      'మీరు ఫాలో అయ్యే లేదా బుక్‌మార్క్ చేసిన కథలు ఇక్కడ కనిపిస్తాయి';

  @override
  String get emptyFollowedAuthorsTitle => 'ఇంకా ఫాలో అయిన రచయితలు లేరు';

  @override
  String get emptyFollowedAuthorsSubtitle =>
      'కొత్త అధ్యాయాల గురించి తెలుసుకోవడానికి రచయితలను ఫాలో అవ్వండి';

  @override
  String get emptySearchResultsTitle => 'కథలు కనుగొనబడలేదు';

  @override
  String get emptySearchResultsSubtitle =>
      'వేరే జానర్ లేదా సెర్చ్ పదాన్ని ప్రయత్నించండి';

  @override
  String get genreFilterAll => 'అన్నీ';

  @override
  String get sectionNewReleases => 'కొత్త విడుదలలు';

  @override
  String get sectionTrendingNow => 'ట్రెండింగ్';

  @override
  String get sectionTrendingSubtitle => 'పాఠకులు ఇష్టపడుతున్న కథలు';

  @override
  String get browseTitle => 'అన్వేషణ';

  @override
  String get browseSearchHint => 'తెలుగు లేదా ఇంగ్లీష్ శీర్షికల కోసం వెతకండి…';

  @override
  String get browseSectionTrendingThisWeek => 'ఈ వారం ట్రెండింగ్‌లో ఉన్నవి';

  @override
  String get onboardingPage1Subtitle =>
      'అందమైన తెలుగు అక్షరాలంకరణలో సీరియల్ కథలు. మీ ప్రయాణంలో, ఆఫ్‌లైన్‌లో కూడా చదవండి.';

  @override
  String get onboardingPage2Title => 'ప్రకటనలు లేవు. కాయిన్‌లు లేవు.';

  @override
  String onboardingPage2Subtitle(int price, int sharePct, int maxSharePct) {
    return 'నెలకు ₹$price అపరిమిత పఠనం. $sharePct% ప్రాథమిక రచయిత వాటా — Apex స్టోరీ ట్రస్ట్‌లో $maxSharePct% వరకు.';
  }

  @override
  String get onboardingPage3Title => 'సృష్టికర్తలకు మద్దతు ఇవ్వండి';

  @override
  String get onboardingPage3Subtitle =>
      'పారదర్శక ఆదాయం. నిజమైన కథలు. మీ సబ్‌స్క్రిప్షన్ రచయితలను రాస్తూనే ఉంచుతుంది.';

  @override
  String get buttonSkip => 'దాటవేయి';

  @override
  String get buttonNext => 'తర్వాత';

  @override
  String get buttonStartReading => 'చదవడం ప్రారంభించండి';

  @override
  String get buttonContinueWithEmail => 'ఇమెయిల్‌తో కొనసాగించండి';

  @override
  String get readerAuthEmailHeadline => 'ఇమెయిల్‌తో సైన్ ఇన్ చేయండి';

  @override
  String get readerAuthEmailSubheadline =>
      'మీ ఇన్‌బాక్స్‌కు వన్-టైమ్ కోడ్ పంపుతాము';

  @override
  String get readerAuthEmailLabel => 'ఇమెయిల్ చిరునామా';

  @override
  String get buttonSending => 'పంపుతోంది…';

  @override
  String get buttonSendSignInCode => 'సైన్-ఇన్ కోడ్ పంపండి';

  @override
  String get buttonBackToGoogleSignIn => 'Google సైన్-ఇన్‌కు తిరిగి వెళ్ళండి';

  @override
  String get readerAuthCheckEmailHeadline => 'మీ ఇమెయిల్‌ను చూడండి';

  @override
  String readerAuthCodeSentTo(String email) {
    return '$emailకు పంపిన కోడ్‌ను నమోదు చేయండి';
  }

  @override
  String get readerAuthSignInCodeLabel => 'సైన్-ఇన్ కోడ్';

  @override
  String get buttonVerifying => 'ధృవీకరిస్తోంది…';

  @override
  String get buttonVerifyAndContinue => 'ధృవీకరించి కొనసాగించండి';

  @override
  String get buttonResendCode => 'కోడ్‌ను మళ్ళీ పంపండి';

  @override
  String get buttonUseDifferentEmail => 'వేరే ఇమెయిల్‌ను ఉపయోగించండి';

  @override
  String get readerAuthSubtitle =>
      'ఈ కథను కొనసాగించడానికి ఉచితంగా సైన్ ఇన్ చేయండి';

  @override
  String get readerAuthPromiseNote =>
      'సైన్ ఇన్ తర్వాత ఈ అధ్యాయం నుంచే కొనసాగుతారు. చెల్లింపు ఇప్పుడు కాదు — లాక్ అయిన అధ్యాయాలకు మాత్రమే సబ్‌స్క్రిప్షన్.';

  @override
  String get readerAuthCreatorNote =>
      'చెల్లింపుల కోసం సృష్టికర్తలు Creator Studioలో ప్రత్యేకంగా ఫోన్‌ను ధృవీకరిస్తారు.';

  @override
  String get readerAuthTermsNotice =>
      'కొనసాగించడం ద్వారా మీరు మా నిబంధనలు & గోప్యతకు అంగీకరిస్తున్నారు';

  @override
  String readerAuthWelcomeTrial(int days) {
    return 'స్వాగతం! $days రోజుల అపరిమిత పఠనం అన్‌లాక్ అయింది.';
  }

  @override
  String get readerAuthContinueSuccess => 'స్వాగతం — మీ కథను కొనసాగిస్తున్నాం.';

  @override
  String get readerAuthGoogleUnavailable =>
      'ఈ బిల్డ్‌లో Google సైన్-ఇన్ లేదు. ఇమెయిల్‌తో కొనసాగండి.';

  @override
  String get readerAuthGoogleFailedUseEmail =>
      'Google సైన్-ఇన్ విఫలమైంది. కింద ఇమెయిల్‌తో కొనసాగండి.';

  @override
  String get buttonSignInAndContinue => 'సైన్ ఇన్ చేసి చదవడం కొనసాగించండి';

  @override
  String get settingsSectionReading => 'పఠనం';

  @override
  String get settingsSectionComfort => 'సౌలభ్యం';

  @override
  String settingsFontSizeSubtitle(int scale) {
    return 'పరిమాణం $scale / 5 — లైవ్ ప్రివ్యూ కోసం రీడర్‌లో Aa నొక్కండి';
  }

  @override
  String get settingsLineSpacing => 'పంక్తుల మధ్య అంతరం';

  @override
  String get settingsLineSpacingCompact => 'సాంద్రం';

  @override
  String get settingsLineSpacingComfort => 'సౌకర్యం';

  @override
  String get settingsLineSpacingSpacious => 'విశాలం';

  @override
  String get settingsLineSpacingSpaciousDetail =>
      'విశాలం (డిస్లెక్సియాకు అనుకూలం)';

  @override
  String get settingsLineSpacingComfortDetail => 'సౌకర్యం (సిఫార్సు చేయబడింది)';

  @override
  String get settingsTextAlignment => 'వచన అమరిక';

  @override
  String get settingsAlignLeft => 'ఎడమ';

  @override
  String get settingsAlignJustified => 'జస్టిఫైడ్';

  @override
  String get settingsAlignLeftDetail => 'ఎడమ (చదవడానికి సిఫార్సు చేయబడింది)';

  @override
  String get settingsThemeSystemDetail =>
      'సిస్టమ్‌తో సరిపోల్చండి — మీ పరికర పగలు/రాత్రి షెడ్యూల్‌ను అనుసరిస్తుంది';

  @override
  String get settingsThemeDark => 'డార్క్';

  @override
  String get settingsThemeLight => 'లైట్';

  @override
  String get settingsThemeSystem => 'సిస్టమ్';

  @override
  String get settingsCalmMotionSubtitle => 'యాప్ అంతటా యానిమేషన్‌ను తగ్గించండి';

  @override
  String get settingsHighContrastSubtitle =>
      'అలసిన కళ్ళ కోసం బలమైన వచనం, హద్దులు';

  @override
  String get settingsReadingBreaksOff =>
      'ఆఫ్ — అధ్యాయాల మధ్య సున్నితమైన రిమైండర్ కోసం ఆన్ చేయండి';

  @override
  String settingsReadingBreaksOn(int minutes) {
    return 'ప్రతి $minutes నిమిషాలకు ఒక సున్నితమైన రిమైండర్, అధ్యాయాల మధ్య మాత్రమే';
  }

  @override
  String get settingsReadingBreaks90 => '90 నిమి';

  @override
  String get settingsReadingBreaks120 => '120 నిమి';

  @override
  String get settingsSubscriptionActive => 'కథ అన్‌లిమిటెడ్ — యాక్టివ్';

  @override
  String settingsSubscriptionTrial(int days) {
    return 'లాంచ్ ట్రయల్ — $days రోజుల అపరిమిత పఠనం మిగిలి ఉంది';
  }

  @override
  String settingsSubscriptionFree(int chapter) {
    return 'ఉచితం — అధ్యాయం $chapter నుండి నెలకు ₹99';
  }

  @override
  String get settingsSubscribeSnackbar =>
      'UPIతో సబ్‌స్క్రైబ్ చేయడానికి లాక్ చేసిన అధ్యాయాన్ని తెరవండి — నెలకు ₹99 · రచయితలకు 60% వరకు.';

  @override
  String get settingsSignInSubtitle =>
      'Google లేదా ఇమెయిల్ — ఉచిత నమూనా తర్వాత కొనసాగించడానికి ఉచిత ఖాతా';

  @override
  String get settingsNotifyNewChapters => 'కొత్త అధ్యాయాలు';

  @override
  String get settingsNotifyNewChaptersSubtitle =>
      'మీరు చదివే రచయితలు ప్రచురించినప్పుడు';

  @override
  String get settingsNotifySubscriptionReminders =>
      'సబ్‌స్క్రిప్షన్ రిమైండర్‌లు';

  @override
  String get settingsNotifySubscriptionRemindersSubtitle =>
      'పునరుద్ధరణకు 3 రోజుల ముందు';

  @override
  String get settingsNotifyWeeklyTrending => 'వారపు ట్రెండింగ్';

  @override
  String get settingsNotifyWeeklyTrendingSubtitle => 'ఆదివారం సారాంశం';

  @override
  String get storyDetailLoadError => 'కథను లోడ్ చేయడం సాధ్యం కాలేదు';

  @override
  String get storyDetailNotFound => 'కథ కనుగొనబడలేదు';

  @override
  String get storyDetailNextChapterLabel => 'తదుపరి అధ్యాయం';

  @override
  String get storyDetailReleaseWeekly => 'ప్రతి వారం కొత్త అధ్యాయాలు';

  @override
  String get storyDetailReleaseRomanceSchedule =>
      'ప్రతి సోమవారం, సాయంత్రం 6:00';

  @override
  String get storyDetailWhatReadersSay => 'పాఠకులు ఏమంటున్నారు';

  @override
  String get storyDetailChaptersHeading => 'అధ్యాయాలు';

  @override
  String get storyDetailStartReadingChapter1 =>
      'చదవడం ప్రారంభించండి — అధ్యాయం 1';

  @override
  String storyDetailChapterAccessFree(int readers, int minutes) {
    return 'ఉచితం · $readers మంది పాఠకులు · $minutes నిమి';
  }

  @override
  String storyDetailChapterAccessSignIn(int minutes) {
    return 'ఉచితం · చదవడానికి సైన్ ఇన్ చేయండి · $minutes నిమి';
  }

  @override
  String storyDetailChapterAccessMembers(int readers, int minutes) {
    return '$readers మంది పాఠకులు · $minutes నిమి · సభ్యులు';
  }

  @override
  String storyDetailChapterAccessDefault(int readers, int minutes) {
    return '$readers మంది పాఠకులు · $minutes నిమి';
  }

  @override
  String get readerShareTooltip => 'ఈ అధ్యాయాన్ని షేర్ చేయండి';

  @override
  String get readerReadingOptionsTooltip =>
      'పఠన ఎంపికలు (టోన్, పరిమాణం, అంతరం, అమరిక)';

  @override
  String get readerQuickFontSizeTooltip => 'త్వరిత ఫాంట్ పరిమాణం';

  @override
  String readerToneTooltip(String tone) {
    return 'పఠన టోన్: $tone (మార్చడానికి నొక్కండి)';
  }

  @override
  String readerViewsAndTime(int views, int minutes) {
    return '$views మంది పాఠకులు · $minutes నిమి పఠనం';
  }

  @override
  String get readerCachedOffline =>
      'సేవ్ చేయబడింది — ఆఫ్‌లైన్‌లో చదవడానికి సిద్ధం';

  @override
  String get readerChapterNavPrevious => 'మునుపటి';

  @override
  String readerChapterNavCurrent(int number) {
    return 'అధ్యా $number';
  }

  @override
  String get readerOtpGateTitle => 'కొనసాగించడానికి సైన్ ఇన్ చేయండి';

  @override
  String get readerOtpGateSubtitle =>
      'ఉచిత ఖాతాతో ఈ అధ్యాయం నుంచి కథ కొనసాగుతుంది. ఇప్పుడు చెల్లింపు లేదు — లాక్ అయిన అధ్యాయాలకు మాత్రమే సబ్‌స్క్రైబ్.';

  @override
  String get readerPaywallTrialEndedTitle => 'మీ లాంచ్ ట్రయల్ ముగిసింది';

  @override
  String get readerPaywallUnlockTitle =>
      'చదవడం కొనసాగించడానికి సబ్‌స్క్రైబ్ చేయండి';

  @override
  String readerPaywallSubscribeAction(String price) {
    return 'సబ్‌స్క్రైబ్ చేయండి · $price';
  }

  @override
  String get readerEyeBreakReminder =>
      'మీరు కొంతసేపటి నుండి చదువుతున్నారు — కళ్ళకు కాస్త విశ్రాంతినివ్వండి?';

  @override
  String get readerStreakUnlockedTitle => 'స్ట్రీక్ అన్‌లాక్ అయింది!';

  @override
  String get readerStreakDefaultMessage =>
      'మీ స్ట్రీక్‌ను కొనసాగించడానికి చదువుతూ ఉండండి.';

  @override
  String get readerPaymentCancelled => 'చెల్లింపు రద్దు చేయబడింది';

  @override
  String readerSubscribedSnackbar(String shareLabel) {
    return 'కథ అన్‌లిమిటెడ్‌కు స్వాగతం · $shareLabel';
  }

  @override
  String get readerPaymentActivating =>
      'చెల్లింపు అందింది — మీ సబ్‌స్క్రిప్షన్‌ను యాక్టివేట్ చేస్తున్నాము. కొద్దిసేపట్లో ఈ అధ్యాయాన్ని మళ్ళీ తెరవండి.';

  @override
  String readerPaymentRecorded(String status) {
    return 'చెల్లింపు నమోదైంది ($status). అధ్యాయాలు లాక్‌గా ఉంటే, కొద్దిసేపు ఆగి మళ్ళీ ప్రయత్నించండి.';
  }

  @override
  String readerPaymentsBeingConfigured(String mode, String shareTransparency) {
    return 'చెల్లింపులు కాన్ఫిగర్ చేయబడుతున్నాయి ($mode). $shareTransparency. త్వరలో మళ్ళీ ప్రయత్నించండి.';
  }

  @override
  String get readingOptionsToneLabel => 'పఠన టోన్';

  @override
  String get readingOptionsLeftRecommended => 'ఎడమ (సిఫార్సు చేయబడింది)';

  @override
  String get readingOptionsFooterNote =>
      'మార్పులు వెంటనే వర్తిస్తాయి. తెలుగు దీర్ఘ పఠనానికి ఎడమ + ఎక్కువ అంతరం సిఫార్సు చేయబడింది.';

  @override
  String paywallShareBullet(String max, String price) {
    return 'మీ ₹$priceలో $max% వరకు తెలుగు రచయితలకు మద్దతుగా వెళ్తుంది (స్టోరీ ట్రస్ట్ లాడర్)';
  }

  @override
  String get paywallWhatYouGet => 'మీకు లభించేవి';

  @override
  String storyCardChapterCount(int count) {
    return '$count అధ్యా';
  }
}
