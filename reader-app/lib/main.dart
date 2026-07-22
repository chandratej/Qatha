import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState, AuthUser;
import 'core/config/app_config.dart';
import 'core/models/pending_chapter_link.dart';
import 'core/providers/app_state.dart';
import 'core/providers/auth_state.dart';
import 'core/services/analytics_service.dart';
import 'core/services/api_service.dart';
import 'core/services/deep_link_service.dart';
import 'core/services/launch_offer_service.dart';
import 'core/services/offline_cache.dart';
import 'core/theme/katha_theme.dart';
import 'screens/app_shell.dart';
import 'screens/onboarding_screen.dart';
import 'screens/reader_screen.dart';
import 'core/utils/motion.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Never block app start on Supabase reachability — a cold-start network
  // blip or bad config would otherwise crash boot before Flutter renders
  // anything. AuthState/ApiService fall back to cached prefs when
  // Supabase.instance is unavailable.
  try {
    await Supabase.initialize(
      url: AppConfig.supabaseUrl,
      // supabase_flutter ≥2.8: prefer publishableKey over deprecated anonKey
      publishableKey: AppConfig.supabasePublishableKey,
    );
  } catch (e) {
    debugPrint('[main] Supabase.initialize failed, continuing offline: $e');
  }

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(statusBarColor: Colors.transparent),
  );

  await OfflineCache.instance.init();
  // Never block app start if API is down — timeout + swallow
  try {
    await LaunchOfferService.instance
        .fetch()
        .timeout(const Duration(seconds: 2));
  } catch (_) {
    // Fallback config already set inside the service
  }

  final authState = AuthState();
  await authState.init();
  AnalyticsService.instance.setUserId(authState.user?.id);

  final appState = AppState();
  await appState.hydrate();

  // Eager pre-warm only when online path is likely available
  if (appState.hasContinueReading && appState.continueReadingStoryId != null) {
    final api = ApiService.fromAuth(authState);
    // Fire-and-forget; ignore network errors
    // ignore: unawaited_futures
    OfflineCache.instance.prewarmContinueReading(
      storyId: appState.continueReadingStoryId!,
      chapter: appState.continueReadingChapter,
      api: api,
    );
  }

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: appState),
        ChangeNotifierProvider.value(value: authState),
      ],
      child: const KathaApp(),
    ),
  );
}

class KathaApp extends StatefulWidget {
  const KathaApp({super.key});

  @override
  State<KathaApp> createState() => _KathaAppState();
}

class _KathaAppState extends State<KathaApp> {
  bool _checkingOnboarding = true;
  bool _showOnboarding = false;
  final _navigatorKey = GlobalKey<NavigatorState>();
  StreamSubscription<PendingChapterLink>? _linkSub;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final show = await OnboardingScreen.shouldShow();
    await AnalyticsService.instance.appInstall();
    if (mounted) {
      setState(() {
        _showOnboarding = show;
        _checkingOnboarding = false;
      });
      _initDeepLinks();
    }
  }

  // Runs after the real MaterialApp (with _navigatorKey) has replaced the
  // splash screen, so a cold-start share link always has a Navigator to push into.
  Future<void> _initDeepLinks() async {
    final initial = await DeepLinkService.instance.getInitialLink();
    if (initial != null) _openSharedChapter(initial);
    _linkSub = DeepLinkService.instance.onLink.listen(_openSharedChapter);
  }

  Future<void> _openSharedChapter(PendingChapterLink link) async {
    final navigator = _navigatorKey.currentState;
    if (navigator == null) return;
    final auth = navigator.context.read<AuthState>();
    AnalyticsService.instance.coldLandingView(
      link.storyId,
      link.chapterNumber,
      hasAccount: auth.isLoggedIn,
    );

    String storyTitle = 'Katha';
    try {
      final detail = await ApiService.fromAuth(auth).fetchStoryDetail(link.storyId);
      storyTitle = detail.story.title;
    } catch (_) {
      // Fall back to a generic title — ReaderScreen still loads the chapter.
    }

    navigator.push(
      MaterialPageRoute(
        builder: (_) => ReaderScreen(
          storyId: link.storyId,
          storyTitle: storyTitle,
          chapterNumber: link.chapterNumber,
        ),
      ),
    );
  }

  @override
  void dispose() {
    _linkSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();

    if (_checkingOnboarding || !appState.isHydrated) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Scaffold(
          backgroundColor: KathaColors.paper,
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'కథ',
                  style: TextStyle(
                    fontSize: 56,
                    fontWeight: FontWeight.bold,
                    foreground: Paint()
                      ..shader = const LinearGradient(
                        colors: [KathaColors.gold, KathaColors.ember],
                      ).createShader(const Rect.fromLTWH(0, 0, 100, 60)),
                  ),
                ).withEntrance(
                  context,
                  (w) => w
                      .animate(onPlay: (c) => c.repeat(reverse: true))
                      .shimmer(
                        duration: 1800.ms,
                        color: KathaColors.goldLight.withValues(alpha: 0.4),
                      ),
                ),
                const SizedBox(height: 24),
                Text(
                  'తెలుగు కథలు',
                  style: TextStyle(
                    fontSize: 16,
                    color: KathaColors.inkMuted.withValues(alpha: 0.8),
                    letterSpacing: 0.5,
                  ),
                ).withEntrance(context, (w) => w.animate().fadeIn(delay: 400.ms)),
              ],
            ),
          ),
        ),
      );
    }

    return MaterialApp(
      navigatorKey: _navigatorKey,
      title: 'Katha — కథ',
      debugShowCheckedModeBanner: false,
      theme: KathaTheme.light(
        fontScale: appState.fontScale,
        highContrast: appState.highContrast,
        calmMotion: appState.calmMotion,
      ),
      darkTheme: KathaTheme.dark(
        fontScale: appState.fontScale,
        highContrast: appState.highContrast,
        calmMotion: appState.calmMotion,
      ),
      themeMode: appState.themeMode,
      home: _showOnboarding ? const OnboardingScreen() : const AppShell(),
    );
  }
}
