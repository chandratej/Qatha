import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState, AuthUser;
import 'core/config/app_config.dart';
import 'core/providers/app_state.dart';
import 'core/providers/auth_state.dart';
import 'core/services/analytics_service.dart';
import 'core/services/api_service.dart';
import 'core/services/launch_offer_service.dart';
import 'core/services/offline_cache.dart';
import 'core/theme/katha_theme.dart';
import 'screens/app_shell.dart';
import 'screens/onboarding_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Supabase.initialize(
    url: AppConfig.supabaseUrl,
    // supabase_flutter ≥2.8: prefer publishableKey over deprecated anonKey
    publishableKey: AppConfig.supabasePublishableKey,
  );

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
    }
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
                    )
                    .animate(onPlay: (c) => c.repeat(reverse: true))
                    .shimmer(
                      duration: 1800.ms,
                      color: KathaColors.goldLight.withValues(alpha: 0.4),
                    ),
                const SizedBox(height: 24),
                Text(
                  'తెలుగు కథలు',
                  style: TextStyle(
                    fontSize: 16,
                    color: KathaColors.inkMuted.withValues(alpha: 0.8),
                    letterSpacing: 0.5,
                  ),
                ).animate().fadeIn(delay: 400.ms),
              ],
            ),
          ),
        ),
      );
    }

    return MaterialApp(
      title: 'Katha — కథ',
      debugShowCheckedModeBanner: false,
      theme: KathaTheme.light(fontScale: appState.fontScale),
      darkTheme: KathaTheme.dark(fontScale: appState.fontScale),
      themeMode: appState.themeMode,
      home: _showOnboarding ? const OnboardingScreen() : const AppShell(),
    );
  }
}
