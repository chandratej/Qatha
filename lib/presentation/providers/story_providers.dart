import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:dio/dio.dart';
import 'package:hive/hive.dart';
import '../../data/datasources/remote/story_remote_data_source.dart';
import '../../data/datasources/local/story_local_data_source.dart';
import '../../data/repositories/story_repository_impl.dart';
import '../../domain/repositories/story_repository.dart';
import '../../domain/usecases/story_usecases.dart';
import '../../core/constants/app_constants.dart';

/// Firebase Firestore provider
final firestoreProvider = Provider<FirebaseFirestore>((ref) {
  return FirebaseFirestore.instance;
});

/// Dio HTTP client provider
final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(BaseOptions(
    baseUrl: AppConstants.apiBaseUrl,
    connectTimeout: const Duration(seconds: AppConstants.apiTimeoutSeconds),
    receiveTimeout: const Duration(seconds: AppConstants.apiTimeoutSeconds),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  ));

  // Add interceptors for logging and auth
  dio.interceptors.add(LogInterceptor(
    requestBody: true,
    responseBody: true,
    error: true,
  ));

  return dio;
});

/// Hive stories box provider
final storiesBoxProvider = Provider<Box<dynamic>>((ref) {
  return Hive.box(AppConstants.hiveStoriesBox);
});

/// Hive chapters box provider
final chaptersBoxProvider = Provider<Box<dynamic>>((ref) {
  return Hive.box(AppConstants.hiveChaptersBox);
});

/// Hive reading progress box provider
final progressBoxProvider = Provider<Box<dynamic>>((ref) {
  return Hive.box(AppConstants.hiveProgressBox);
});

/// Story remote data source provider
final storyRemoteDataSourceProvider = Provider<StoryRemoteDataSource>((ref) {
  final firestore = ref.watch(firestoreProvider);
  final dio = ref.watch(dioProvider);

  return StoryRemoteDataSourceImpl(
    firestore: firestore,
    dio: dio,
  );
});

/// Story local data source provider
final storyLocalDataSourceProvider = Provider<StoryLocalDataSource>((ref) {
  final storiesBox = ref.watch(storiesBoxProvider);
  final chaptersBox = ref.watch(chaptersBoxProvider);
  final progressBox = ref.watch(progressBoxProvider);

  return StoryLocalDataSourceImpl(
    storiesBox: storiesBox,
    chaptersBox: chaptersBox,
    progressBox: progressBox,
  );
});

/// Story repository provider
final storyRepositoryProvider = Provider<StoryRepository>((ref) {
  final remoteDataSource = ref.watch(storyRemoteDataSourceProvider);
  final localDataSource = ref.watch(storyLocalDataSourceProvider);

  return StoryRepositoryImpl(
    remoteDataSource: remoteDataSource,
    localDataSource: localDataSource,
  );
});

/// Use Cases Providers

final getStoriesProvider = Provider<GetStories>((ref) {
  final repository = ref.watch(storyRepositoryProvider);
  return GetStories(repository);
});

final getStoryByIdProvider = Provider<GetStoryById>((ref) {
  final repository = ref.watch(storyRepositoryProvider);
  return GetStoryById(repository);
});

final getChaptersProvider = Provider<GetChapters>((ref) {
  final repository = ref.watch(storyRepositoryProvider);
  return GetChapters(repository);
});

final getChapterProvider = Provider<GetChapter>((ref) {
  final repository = ref.watch(storyRepositoryProvider);
  return GetChapter(repository);
});

final searchStoriesProvider = Provider<SearchStories>((ref) {
  final repository = ref.watch(storyRepositoryProvider);
  return SearchStories(repository);
});

final getTrendingStoriesProvider = Provider<GetTrendingStories>((ref) {
  final repository = ref.watch(storyRepositoryProvider);
  return GetTrendingStories(repository);
});

final getRecommendedStoriesProvider = Provider<GetRecommendedStories>((ref) {
  final repository = ref.watch(storyRepositoryProvider);
  return GetRecommendedStories(repository);
});

final getNearPromotionStoriesProvider = Provider<GetNearPromotionStories>((ref) {
  final repository = ref.watch(storyRepositoryProvider);
  return GetNearPromotionStories(repository);
});

final getRecentlyPromotedStoriesProvider = Provider<GetRecentlyPromotedStories>((ref) {
  final repository = ref.watch(storyRepositoryProvider);
  return GetRecentlyPromotedStories(repository);
});

final getArchiveDiscoveriesProvider = Provider<GetArchiveDiscoveries>((ref) {
  final repository = ref.watch(storyRepositoryProvider);
  return GetArchiveDiscoveries(repository);
});

final getPremiumSpotlightProvider = Provider<GetPremiumSpotlight>((ref) {
  final repository = ref.watch(storyRepositoryProvider);
  return GetPremiumSpotlight(repository);
});

final getImmortalCollectionProvider = Provider<GetImmortalCollection>((ref) {
  final repository = ref.watch(storyRepositoryProvider);
  return GetImmortalCollection(repository);
});

final getDailyLiteraryPickProvider = Provider<GetDailyLiteraryPick>((ref) {
  final repository = ref.watch(storyRepositoryProvider);
  return GetDailyLiteraryPick(repository);
});

final recordReadingProgressProvider = Provider<RecordReadingProgress>((ref) {
  final repository = ref.watch(storyRepositoryProvider);
  return RecordReadingProgress(repository);
});

final getReadingProgressProvider = Provider<GetReadingProgress>((ref) {
  final repository = ref.watch(storyRepositoryProvider);
  return GetReadingProgress(repository);
});

final incrementStoryViewsProvider = Provider<IncrementStoryViews>((ref) {
  final repository = ref.watch(storyRepositoryProvider);
  return IncrementStoryViews(repository);
});
