import 'package:get_it/get_it.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:hive/hive.dart';

// Repositories
import 'package:storyverse/data/repositories/auth_repository_impl.dart';
import 'package:storyverse/data/repositories/user_repository_impl.dart';
import 'package:storyverse/data/repositories/story_repository_impl.dart';
import 'package:storyverse/domain/repositories/auth_repository.dart';
import 'package:storyverse/domain/repositories/user_repository.dart';
import 'package:storyverse/domain/repositories/story_repository.dart';

// Data Sources - Auth
import 'package:storyverse/data/datasources/auth_remote_data_source.dart';
import 'package:storyverse/data/datasources/auth_local_data_source.dart';

// Data Sources - User
import 'package:storyverse/data/datasources/user_remote_data_source.dart';
import 'package:storyverse/data/datasources/user_local_data_source.dart';

// Data Sources - Story
import 'package:storyverse/data/datasources/remote/story_remote_data_source.dart';
import 'package:storyverse/data/datasources/local/story_local_data_source.dart';

// Core Constants
import 'package:storyverse/core/constants/app_constants.dart';

final sl = GetIt.instance;

Future<void> initDependencies() async {
  // Initialize Hive boxes
  await _initHive();

  // Firebase instances
  sl.registerLazySingleton<FirebaseAuth>(() => FirebaseAuth.instance);
  sl.registerLazySingleton<CloudFirestore>(() => FirebaseFirestore.instance);
  sl.registerLazySingleton<HiveInterface>(() => Hive);

  // ==================== AUTH ====================
  
  // Auth Data Sources
  sl.registerLazySingleton<AuthRemoteDataSource>(
    () => AuthRemoteDataSourceImpl(
      firebaseAuth: sl(),
      firestore: sl(),
    ),
  );
  
  sl.registerLazySingleton<AuthLocalDataSource>(
    () => AuthLocalDataSourceImpl(
      hive: sl(),
    ),
  );
  
  // Auth Repository
  sl.registerLazySingleton<AuthRepository>(
    () => AuthRepositoryImpl(
      remoteDataSource: sl(),
      localDataSource: sl(),
      firebaseAuth: sl(),
      firestore: sl(),
    ),
  );

  // ==================== USER ====================
  
  // User Data Sources
  sl.registerLazySingleton<UserRemoteDataSource>(
    () => UserRemoteDataSourceImpl(
      firestore: sl(),
    ),
  );
  
  sl.registerLazySingleton<UserLocalDataSource>(
    () => UserLocalDataSourceImpl(
      hive: sl(),
    ),
  );
  
  // User Repository
  sl.registerLazySingleton<UserRepository>(
    () => UserRepositoryImpl(
      remoteDataSource: sl(),
      localDataSource: sl(),
      firestore: sl(),
    ),
  );

  // ==================== STORY ====================
  
  // Story Data Sources
  sl.registerLazySingleton<StoryRemoteDataSource>(
    () => StoryRemoteDataSourceImpl(
      firestore: sl(),
    ),
  );
  
  sl.registerLazySingleton<StoryLocalDataSource>(
    () => StoryLocalDataSourceImpl(
      hive: sl(),
    ),
  );
  
  // Story Repository
  sl.registerLazySingleton<StoryRepository>(
    () => StoryRepositoryImpl(
      remoteDataSource: sl(),
      localDataSource: sl(),
      firestore: sl(),
    ),
  );
}

Future<void> _initHive() async {
  await Hive.initFlutter();
  
  // Open boxes
  await Hive.openBox(AppConstants.userBox);
  await Hive.openBox(AppConstants.settingsBox);
  await Hive.openBox(AppConstants.cacheBox);
  await Hive.openBox(AppConstants.offlineStoriesBox);
  await Hive.openBox(AppConstants.audioCacheBox);
  await Hive.openBox(AppConstants.onboardingBox);
}
