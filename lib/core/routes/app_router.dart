/// StoryVerse Navigation Configuration - Simplified version
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/app_constants.dart';
import '../../core/routes/app_routes.dart';
import '../features/auth/presentation/screens/login_screen.dart';
import '../features/auth/presentation/screens/signup_screen.dart';
import '../features/auth/presentation/screens/forgot_password_screen.dart';
import '../presentation/screens/home/home_screen.dart';

class AppRoutes {
  AppRoutes._();
  static const String splash = '/';
  static const String onboarding = '/onboarding';
  static const String login = '/login';
  static const String signup = '/signup';
  static const String home = '/home';
  static const String story = '/story';
  static const String reader = '/reader';
}

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: AppRoutes.splash,
    routes: [
      GoRoute(path: AppRoutes.splash, builder: (c, s) => const SplashPage()),
      GoRoute(path: AppRoutes.onboarding, builder: (c, s) => const OnboardingPage()),
      GoRoute(path: AppRoutes.login, builder: (c, s) => const LoginScreen()),
      GoRoute(path: AppRoutes.signup, builder: (c, s) => const SignupScreen()),
      GoRoute(path: AppRoutes.home, builder: (c, s) => const HomeScreen()),
      GoRoute(path: AppRoutes.forgotPassword, builder: (c, s) => const ForgotPasswordScreen()),
    ],
  );
});

class SplashPage extends StatelessWidget {
  const SplashPage({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(body: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      Text(AppConstants.appName, style: Theme.of(context).textTheme.displayLarge),
      const SizedBox(height: 16),
      const CircularProgressIndicator(),
    ])));
  }
}

class OnboardingPage extends StatelessWidget {
  const OnboardingPage({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(body: SafeArea(child: Padding(padding: const EdgeInsets.all(24), child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      Text(AppConstants.appName, style: Theme.of(context).textTheme.displayMedium),
      const SizedBox(height: 32),
      const Text('Stories Earn Their Place', style: TextStyle(fontSize: 18)),
      const Spacer(),
      SizedBox(width: double.infinity, child: ElevatedButton(onPressed: () => context.go(AppRoutes.signup), child: const Text('Get Started'))),
      TextButton(onPressed: () => context.go(AppRoutes.login), child: const Text('Sign In')),
    ]))));
  }
}

class LoginPage extends StatelessWidget { const LoginPage({super.key}); @override Widget build(BuildContext context) => Scaffold(appBar: AppBar(title: const Text('Login')), body: const Center(child: Text('Login'))); }
class SignupPage extends StatelessWidget { const SignupPage({super.key}); @override Widget build(BuildContext context) => Scaffold(appBar: AppBar(title: const Text('Sign Up')), body: const Center(child: Text('Signup'))); }
class HomePage extends StatelessWidget { const HomePage({super.key}); @override Widget build(BuildContext context) => Scaffold(appBar: AppBar(title: const Text('Home')), body: const Center(child: Text('Home'))); }
