/// StoryVerse Application Routes
/// 
/// GoRouter configuration for navigation

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

// Route Paths
class AppRoutes {
  AppRoutes._();

  static const String initial = '/';
  static const String onboarding = '/onboarding';
  static const String login = '/login';
  static const String signup = '/signup';
  static const String forgotPassword = '/forgot-password';
  static const String verifyEmail = '/verify-email';
  
  // Main Navigation
  static const String home = '/home';
  static const String explore = '/explore';
  static const String library = '/library';
  static const String audio = '/audio';
  static const String profile = '/profile';
  
  // Story Routes
  static const String storyDetail = '/story';
  static const String storyReader = '/reader';
  static const String storyCreator = '/create';
  static const String storyEdit = '/edit';
  static const String chapterReader = '/chapter';
  
  // Author Routes
  static const String authorProfile = '/author';
  static const String authorDashboard = '/dashboard';
  static const String analytics = '/analytics';
  
  // Social Routes
  static const String comments = '/comments';
  static const String reviews = '/reviews';
  static const String reviewDetail = '/review';
  
  // Payment Routes
  static const String subscription = '/subscription';
  static const String purchase = '/purchase';
  static const String paymentHistory = '/payments';
  
  // Settings Routes
  static const String settings = '/settings';
  static const String notifications = '/notifications';
  static const String privacy = '/privacy';
  static const String help = '/help';
  static const String about = '/about';
  
  // Admin Routes
  static const String admin = '/admin';
  static const String adminUsers = '/admin/users';
  static const String adminContent = '/admin/content';
  static const String adminLeagues = '/admin/leagues';
  static const String adminAnalytics = '/admin/analytics';
  
  // Special Routes
  static const String search = '/search';
  static const String genre = '/genre';
  static const String collection = '/collection';
  static const String challenge = '/challenge';
  static const String achievement = '/achievement';
  static const String badge = '/badge';
}

// Route Parameters
class RouteParams {
  RouteParams._();

  static const String storyId = 'storyId';
  static const String chapterId = 'chapterId';
  static const String userId = 'userId';
  static const String authorId = 'authorId';
  static const String reviewId = 'reviewId';
  static const String commentId = 'commentId';
  static const String genreId = 'genreId';
  static const String leagueId = 'leagueId';
  static const String collectionId = 'collectionId';
  static const String challengeId = 'challengeId';
  static const String planId = 'planId';
}

// GoRouter Configuration
class AppRouter {
  AppRouter._();

  static final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>();
  static final GlobalKey<NavigatorState> _shellNavigatorKey = GlobalKey<NavigatorState>();

  static GlobalKey<NavigatorState> get rootNavigatorKey => _rootNavigatorKey;
  static GlobalKey<NavigatorState> get shellNavigatorKey => _shellNavigatorKey;

  static GoRouter get router => _router;

  static final GoRouter _router = GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: AppRoutes.initial,
    debugLogDiagnostics: true,
    routes: [
      // Initial Route - Redirect based on auth state
      GoRoute(
        path: AppRoutes.initial,
        redirect: (context, state) {
          // TODO: Implement auth state check
          // For now, redirect to onboarding or home
          return AppRoutes.onboarding;
        },
      ),

      // Onboarding Flow
      GoRoute(
        path: AppRoutes.onboarding,
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const Placeholder(), // Replace with OnboardingScreen
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return FadeTransition(
              opacity: animation,
              child: child,
            );
          },
        ),
      ),

      // Authentication Routes
      GoRoute(
        path: AppRoutes.login,
        name: 'login',
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const Placeholder(), // Replace with LoginScreen
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(1.0, 0.0),
                end: Offset.zero,
              ).animate(animation),
              child: child,
            );
          },
        ),
      ),

      GoRoute(
        path: AppRoutes.signup,
        name: 'signup',
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const Placeholder(), // Replace with SignupScreen
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(1.0, 0.0),
                end: Offset.zero,
              ).animate(animation),
              child: child,
            );
          },
        ),
      ),

      // Main Shell Route with Bottom Navigation
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) {
          return ScaffoldWithNavBar(child: child);
        },
        routes: [
          GoRoute(
            path: AppRoutes.home,
            name: 'home',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: Placeholder(), // Replace with HomeScreen
            ),
          ),

          GoRoute(
            path: AppRoutes.explore,
            name: 'explore',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: Placeholder(), // Replace with ExploreScreen
            ),
          ),

          GoRoute(
            path: AppRoutes.library,
            name: 'library',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: Placeholder(), // Replace with LibraryScreen
            ),
          ),

          GoRoute(
            path: AppRoutes.audio,
            name: 'audio',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: Placeholder(), // Replace with AudioScreen
            ),
          ),

          GoRoute(
            path: AppRoutes.profile,
            name: 'profile',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: Placeholder(), // Replace with ProfileScreen
            ),
          ),

          // Nested Routes
          GoRoute(
            path: '${AppRoutes.storyDetail}/:${RouteParams.storyId}',
            name: 'storyDetail',
            pageBuilder: (context, state) {
              final storyId = state.pathParameters[RouteParams.storyId]!;
              return CustomTransitionPage(
                key: state.pageKey,
                child: Placeholder(), // Replace with StoryDetailScreen
                transitionsBuilder: (context, animation, secondaryAnimation, child) {
                  return SlideTransition(
                    position: Tween<Offset>(
                      begin: const Offset(0.0, 1.0),
                      end: Offset.zero,
                    ).animate(animation),
                    child: child,
                  );
                },
              );
            },
          ),

          GoRoute(
            path: '${AppRoutes.storyReader}/:${RouteParams.storyId}',
            name: 'storyReader',
            pageBuilder: (context, state) {
              final storyId = state.pathParameters[RouteParams.storyId]!;
              return CustomTransitionPage(
                key: state.pageKey,
                child: Placeholder(), // Replace with StoryReaderScreen
                transitionsBuilder: (context, animation, secondaryAnimation, child) {
                  return FadeTransition(
                    opacity: animation,
                    child: child,
                  );
                },
              );
            },
          ),

          GoRoute(
            path: '${AppRoutes.chapterReader}/:${RouteParams.storyId}/:${RouteParams.chapterId}',
            name: 'chapterReader',
            pageBuilder: (context, state) {
              final storyId = state.pathParameters[RouteParams.storyId]!;
              final chapterId = state.pathParameters[RouteParams.chapterId]!;
              return CustomTransitionPage(
                key: state.pageKey,
                child: Placeholder(), // Replace with ChapterReaderScreen
                transitionsBuilder: (context, animation, secondaryAnimation, child) {
                  return FadeTransition(
                    opacity: animation,
                    child: child,
                  );
                },
              );
            },
          ),

          GoRoute(
            path: '${AppRoutes.authorProfile}/:${RouteParams.authorId}',
            name: 'authorProfile',
            pageBuilder: (context, state) {
              final authorId = state.pathParameters[RouteParams.authorId]!;
              return CustomTransitionPage(
                key: state.pageKey,
                child: Placeholder(), // Replace with AuthorProfileScreen
                transitionsBuilder: (context, animation, secondaryAnimation, child) {
                  return SlideTransition(
                    position: Tween<Offset>(
                      begin: const Offset(1.0, 0.0),
                      end: Offset.zero,
                    ).animate(animation),
                    child: child,
                  );
                },
              );
            },
          ),

          GoRoute(
            path: AppRoutes.search,
            name: 'search',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const Placeholder(), // Replace with SearchScreen
              transitionsBuilder: (context, animation, secondaryAnimation, child) {
                return FadeTransition(
                  opacity: animation,
                  child: child,
                );
              },
            ),
          ),

          GoRoute(
            path: '${AppRoutes.genre}/:${RouteParams.genreId}',
            name: 'genre',
            pageBuilder: (context, state) {
              final genreId = state.pathParameters[RouteParams.genreId]!;
              return CustomTransitionPage(
                key: state.pageKey,
                child: Placeholder(), // Replace with GenreScreen
                transitionsBuilder: (context, animation, secondaryAnimation, child) {
                  return SlideTransition(
                    position: Tween<Offset>(
                      begin: const Offset(0.0, 1.0),
                      end: Offset.zero,
                    ).animate(animation),
                    child: child,
                  );
                },
              );
            },
          ),

          GoRoute(
            path: AppRoutes.subscription,
            name: 'subscription',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const Placeholder(), // Replace with SubscriptionScreen
              transitionsBuilder: (context, animation, secondaryAnimation, child) {
                return SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(0.0, 1.0),
                    end: Offset.zero,
                  ).animate(animation),
                  child: child,
                );
              },
            ),
          ),

          GoRoute(
            path: AppRoutes.settings,
            name: 'settings',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const Placeholder(), // Replace with SettingsScreen
              transitionsBuilder: (context, animation, secondaryAnimation, child) {
                return SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(1.0, 0.0),
                    end: Offset.zero,
                  ).animate(animation),
                  child: child,
                );
              },
            ),
          ),
        ],
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      appBar: AppBar(title: const Text('Error')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              'Page not found: ${state.uri.path}',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => context.go(AppRoutes.home),
              child: const Text('Go Home'),
            ),
          ],
        ),
      ),
    ),
  );
}

// Shell Route with Bottom Navigation Bar
class ScaffoldWithNavBar extends StatelessWidget {
  final Widget child;

  const ScaffoldWithNavBar({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _calculateSelectedIndex(context),
        onDestinationSelected: (index) => _onItemTapped(index, context),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.explore_outlined),
            selectedIcon: Icon(Icons.explore),
            label: 'Explore',
          ),
          NavigationDestination(
            icon: Icon(Icons.library_books_outlined),
            selectedIcon: Icon(Icons.library_books),
            label: 'Library',
          ),
          NavigationDestination(
            icon: Icon(Icons.headphones_outlined),
            selectedIcon: Icon(Icons.headphones),
            label: 'Audio',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }

  int _calculateSelectedIndex(BuildContext context) {
    final location = GoRouterState.of(context).uri.path;
    if (location.startsWith(AppRoutes.home)) return 0;
    if (location.startsWith(AppRoutes.explore)) return 1;
    if (location.startsWith(AppRoutes.library)) return 2;
    if (location.startsWith(AppRoutes.audio)) return 3;
    if (location.startsWith(AppRoutes.profile)) return 4;
    return 0;
  }

  void _onItemTapped(int index, BuildContext context) {
    switch (index) {
      case 0:
        context.go(AppRoutes.home);
        break;
      case 1:
        context.go(AppRoutes.explore);
        break;
      case 2:
        context.go(AppRoutes.library);
        break;
      case 3:
        context.go(AppRoutes.audio);
        break;
      case 4:
        context.go(AppRoutes.profile);
        break;
    }
  }
}

// Extension methods for easy navigation
extension RouterExtension on BuildContext {
  void goToStory(String storyId) {
    push('${AppRoutes.storyDetail}/$storyId');
  }

  void goToChapter(String storyId, String chapterId) {
    push('${AppRoutes.chapterReader}/$storyId/$chapterId');
  }

  void goToAuthor(String authorId) {
    push('${AppRoutes.authorProfile}/$authorId');
  }

  void goToGenre(String genreId) {
    push('${AppRoutes.genre}/$genreId');
  }

  Future<void> goToSubscription() async {
    push(AppRoutes.subscription);
  }

  Future<void> goToSettings() async {
    push(AppRoutes.settings);
  }

  void goHome() {
    go(AppRoutes.home);
  }

  void goExplore() {
    go(AppRoutes.explore);
  }

  void goLibrary() {
    go(AppRoutes.library);
  }

  void goAudio() {
    go(AppRoutes.audio);
  }

  void goProfile() {
    go(AppRoutes.profile);
  }
}
