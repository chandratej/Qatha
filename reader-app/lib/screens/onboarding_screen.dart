import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/config/app_config.dart';
import '../core/theme/katha_theme.dart';
import '../l10n/generated/app_localizations.dart';
import 'app_shell.dart';
import '../core/utils/motion.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  static const _prefKey = 'katha_onboarding_complete';

  static Future<bool> shouldShow() async {
    final prefs = await SharedPreferences.getInstance();
    return !(prefs.getBool(_prefKey) ?? false);
  }

  static Future<void> markComplete() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_prefKey, true);
  }

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _pageController = PageController();
  int _page = 0;

  List<_OnboardPage> get _pages {
    final l10n = AppLocalizations.of(context)!;
    return [
      _OnboardPage(
        icon: Icons.auto_stories_rounded,
        title: l10n.onboardingWelcomeTitle,
        subtitle: l10n.onboardingPage1Subtitle,
      ),
      _OnboardPage(
        icon: Icons.volunteer_activism_rounded,
        title: l10n.onboardingPage2Title,
        subtitle: l10n.onboardingPage2Subtitle(
          AppConfig.priceMonthly,
          AppConfig.creatorSharePct,
          AppConfig.maxCreatorSharePct,
        ),
      ),
      _OnboardPage(
        icon: Icons.favorite_rounded,
        title: l10n.onboardingPage3Title,
        subtitle: l10n.onboardingPage3Subtitle,
      ),
    ];
  }

  Future<void> _finish() async {
    await OnboardingScreen.markComplete();
    if (!mounted) return;
    Navigator.pushReplacement(
      context,
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) => const AppShell(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) => FadeTransition(opacity: animation, child: child),
        transitionDuration: const Duration(milliseconds: 500),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final pages = _pages;
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.topRight,
              child: TextButton(onPressed: _finish, child: Text(l10n.buttonSkip)),
            ),
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                itemCount: pages.length,
                onPageChanged: (i) => setState(() => _page = i),
                itemBuilder: (_, i) => pages[i],
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                pages.length,
                (i) => AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: _page == i ? 24 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(4),
                    color: _page == i ? KathaColors.gold : KathaTheme.mutedInk(context).withValues(alpha: 0.3),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 32),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
              child: FilledButton(
                onPressed: () {
                  if (_page < pages.length - 1) {
                    _pageController.nextPage(duration: const Duration(milliseconds: 400), curve: Curves.easeOut);
                  } else {
                    _finish();
                  }
                },
                style: FilledButton.styleFrom(
                  backgroundColor: KathaColors.gold,
                  minimumSize: const Size(double.infinity, 52),
                ),
                child: Text(_page < pages.length - 1 ? l10n.buttonNext : l10n.buttonStartReading),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OnboardPage extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const _OnboardPage({required this.icon, required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(40),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [KathaColors.gold.withValues(alpha: 0.2), KathaColors.ember.withValues(alpha: 0.1)],
              ),
            ),
            child: Icon(icon, size: 64, color: KathaColors.gold),
          ).withEntrance(context, (w) => w.animate().scale(duration: 600.ms, curve: Curves.easeOutBack)),
          const SizedBox(height: 40),
          Text(
            AppConfig.brandNameTelugu,
            style: Theme.of(context).textTheme.displayLarge?.copyWith(
                  foreground: Paint()
                    ..shader = const LinearGradient(colors: [KathaColors.gold, KathaColors.ember])
                        .createShader(const Rect.fromLTWH(0, 0, 120, 50)),
                ),
          ),
          const SizedBox(height: 16),
          Text(title, style: Theme.of(context).textTheme.headlineMedium, textAlign: TextAlign.center),
          const SizedBox(height: 12),
          Text(subtitle, style: Theme.of(context).textTheme.bodyMedium, textAlign: TextAlign.center),
        ],
      ),
    );
  }
}