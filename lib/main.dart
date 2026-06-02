/// StoryVerse Main Application Entry Point

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'core/constants/app_constants.dart';
import 'core/theme/app_theme.dart';
import 'core/routes/app_router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  await _initializeFirebase();

  // Initialize Hive for local storage
  await _initializeHive();

  // Set preferred orientations
  await _setPreferredOrientations();

  // Set system UI overlay style
  await _setSystemUIOverlayStyle();

  runApp(
    const ProviderScope(
      child: StoryVerseApp(),
    ),
  );
}

Future<void> _initializeFirebase() async {
  try {
    await Firebase.initializeApp(
      options: const FirebaseOptions(
        appId: '1:000000000000:android:0000000000000000',
        apiKey: 'YOUR_API_KEY',
        projectId: AppConstants.firebaseProjectId,
        messagingSenderId: '000000000000',
        iosBundleId: 'com.storyverse.app',
        androidPackageName: 'com.storyverse.app',
      ),
    );
    debugPrint('Firebase initialized successfully');
  } catch (e) {
    debugPrint('Firebase initialization error: $e');
    // In production, handle this gracefully
  }
}

Future<void> _initializeHive() async {
  try {
    await Hive.initFlutter();
    
    // Open boxes
    await Hive.openBox(AppConstants.hiveUserBox);
    await Hive.openBox(AppConstants.hiveSettingsBox);
    await Hive.openBox(AppConstants.hiveCacheBox);
    
    debugPrint('Hive initialized successfully');
  } catch (e) {
    debugPrint('Hive initialization error: $e');
  }
}

Future<void> _setPreferredOrientations() async {
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
}

Future<void> _setSystemUIOverlayStyle() async {
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      statusBarBrightness: Brightness.light,
      systemNavigationBarColor: Colors.white,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );
}

class StoryVerseApp extends StatelessWidget {
  const StoryVerseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      routerConfig: AppRouter.router,
      builder: (context, child) {
        // Apply custom scroll behavior
        return ScrollConfiguration(
          behavior: const StoryVerseScrollBehavior(),
          child: child ?? const SizedBox.shrink(),
        );
      },
    );
  }
}

/// Custom scroll behavior for smooth scrolling experience
class StoryVerseScrollBehavior extends MaterialScrollBehavior {
  const StoryVerseScrollBehavior();

  @override
  Set<PointerDeviceKind> get dragDevices => {
        PointerDeviceKind.touch,
        PointerDeviceKind.mouse,
        PointerDeviceKind.stylus,
        PointerDeviceKind.trackpad,
      };

  @override
  Widget buildScrollbar(
    BuildContext context,
    Widget child,
    ScrollableDetails details,
  ) {
    // Disable scrollbars for cleaner look on mobile
    return child;
  }
}
