import 'dart:convert';
import 'package:hive_flutter/hive_flutter.dart';
import '../models/story.dart';
import 'api_service.dart';
import 'connectivity_service.dart';

/// High-performance offline cache for instant chapter loads (target <5ms).
/// - Memory hot cache for O(1) current session access.
/// - Hive durable store.
/// - Cache-first + SWR background refresh.
/// - Aggressive predictive prefetch (blueprint-aligned).
/// - Quota + LRU management. Content hash support.
class OfflineCache {
  OfflineCache._();
  static final OfflineCache instance = OfflineCache._();

  static const _boxName = 'chapter_cache';
  static const _maxAgeDays = 45;
  static const _maxChapterBytes = 5 * 1024 * 1024;
  static const _maxTotalChapters = 50;
  static const _defaultPrefetch = 5;

  Box? _box;
  final _connectivity = ConnectivityService();

  // Ultra-fast in-memory layer (current story chapters)
  final Map<String, Chapter> _memoryCache = {};
  final List<String> _accessOrder = [];

  Future<void> init() async {
    await Hive.initFlutter();
    _box = await Hive.openBox<String>(_boxName);
    await purgeOld();
  }

  String _key(String storyId, int chapterNum) => '${storyId}_$chapterNum';

  bool _isValidSize(String content) => content.length <= _maxChapterBytes;

  void _touchMemory(String key) {
    _accessOrder.remove(key);
    _accessOrder.add(key);
    while (_accessOrder.length > _maxTotalChapters) {
      final oldest = _accessOrder.removeAt(0);
      _memoryCache.remove(oldest);
    }
  }

  /// Fast path - returns in milliseconds from memory or Hive. No network.
  Chapter? getCachedChapter(String storyId, int chapterNumber) {
    final key = _key(storyId, chapterNumber);

    final mem = _memoryCache[key];
    if (mem != null) {
      _touchMemory(key);
      return mem;
    }

    final box = _box;
    if (box == null) return null;
    final raw = box.get(key);
    if (raw == null) return null;

    try {
      final data = jsonDecode(raw as String) as Map<String, dynamic>;
      final ch = Chapter.fromJson(data);
      _memoryCache[key] = ch;
      _touchMemory(key);
      return ch;
    } catch (_) {
      return null;
    }
  }

  Future<void> cacheChapter(Chapter chapter) async {
    final box = _box;
    if (box == null || !_isValidSize(chapter.content)) return;

    final key = _key(chapter.storyId, chapter.chapterNumber);
    final payload = {
      'id': chapter.id,
      'story_id': chapter.storyId,
      'chapter_number': chapter.chapterNumber,
      'title': chapter.title,
      'content': chapter.content,
      'estimated_read_time_minutes': chapter.estimatedReadTimeMinutes,
      'view_count': chapter.viewCount,
      'content_hash': chapter.contentHash,
      'cached_at': DateTime.now().toIso8601String(),
    };

    await box.put(key, jsonEncode(payload));

    _memoryCache[key] = chapter;
    _touchMemory(key);

    await _enforceQuota();
  }

  Future<void> _enforceQuota() async {
    final box = _box;
    if (box == null || box.length <= _maxTotalChapters) return;

    // Evict oldest by cached_at
    final entries = <MapEntry<String, DateTime>>[];
    for (final key in box.keys) {
      try {
        final raw = box.get(key) as String?;
        if (raw == null) continue;
        final ts = DateTime.parse(
          ((jsonDecode(raw) as Map)['cached_at'] as String),
        );
        entries.add(MapEntry(key as String, ts));
      } catch (_) {}
    }
    entries.sort((a, b) => a.value.compareTo(b.value));

    for (int i = 0; i < entries.length && box.length > _maxTotalChapters; i++) {
      final k = entries[i].key;
      await box.delete(k);
      _memoryCache.remove(k);
      _accessOrder.remove(k);
    }
  }

  List<int> getCachedChapterNumbers(String storyId) {
    final box = _box;
    if (box == null) return [];
    final prefix = '${storyId}_';
    return box.keys
        .whereType<String>()
        .where((k) => k.startsWith(prefix))
        .map((k) => int.tryParse(k.substring(prefix.length)))
        .whereType<int>()
        .toList()
      ..sort();
  }

  bool isChapterCached(String storyId, int chapterNumber) =>
      getCachedChapter(storyId, chapterNumber) != null;

  /// The key to "snap" UX.
  /// Returns cached data immediately (memory/hive).
  /// Triggers non-blocking background refresh + calls onUpdated only on real change.
  Future<Chapter?> getChapterSmart({
    required String storyId,
    required int chapterNumber,
    required ApiService api,
    void Function(Chapter updated)? onUpdated,
  }) async {
    final cached = getCachedChapter(storyId, chapterNumber);

    if (cached != null) {
      // Seamless: show now
      _refreshInBackground(storyId, chapterNumber, api, cached, onUpdated);
      return cached;
    }

    try {
      final fresh = await api.fetchChapter(storyId, chapterNumber);
      await cacheChapter(fresh);
      return fresh;
    } catch (_) {
      return null;
    }
  }

  Future<void> _refreshInBackground(
    String storyId,
    int chapterNumber,
    ApiService api,
    Chapter current,
    void Function(Chapter)? onUpdated,
  ) async {
    try {
      final fresh = await api.fetchChapter(storyId, chapterNumber);
      final changed = (fresh.contentHash != null && current.contentHash != null)
          ? fresh.contentHash != current.contentHash
          : (fresh.content != current.content || fresh.id != current.id);

      if (changed) {
        await cacheChapter(fresh);
        onUpdated?.call(fresh);
      }
    } catch (_) {}
  }

  /// Much more aggressive prefetching for seamless next-chapter experience.
  Future<void> prefetchNextChapters({
    required String storyId,
    required int currentChapter,
    required ApiService api,
    int count = _defaultPrefetch,
  }) async {
    final hasConn = await _connectivity.hasConnection();
    if (!hasConn) return;

    final wifi = await _connectivity.isOnWifi();
    final toFetch = wifi ? count : (count > 1 ? 2 : 1);

    for (var i = 1; i <= toFetch; i++) {
      final n = currentChapter + i;
      if (isChapterCached(storyId, n)) continue;
      try {
        final ch = await api.fetchChapter(storyId, n);
        await cacheChapter(ch);
      } catch (_) {
        break;
      }
    }
  }

  /// Called from main.dart / home for ritual "continue reading" instant start.
  Future<void> prewarmContinueReading({
    required String storyId,
    required int chapter,
    required ApiService api,
  }) async {
    final cached = getCachedChapter(storyId, chapter);
    if (cached != null) {
      _refreshInBackground(storyId, chapter, api, cached, null);
    }
    // Fire prefetch (non blocking)
    prefetchNextChapters(
      storyId: storyId,
      currentChapter: chapter,
      api: api,
      count: 4,
    );
  }

  Future<void> purgeOld() async {
    final box = _box;
    if (box == null) return;
    final cutoff = DateTime.now().subtract(const Duration(days: _maxAgeDays));
    final toDelete = <String>[];

    for (final key in box.keys) {
      final raw = box.get(key);
      if (raw == null) continue;
      try {
        final ts = DateTime.parse(
          ((jsonDecode(raw as String) as Map)['cached_at'] as String),
        );
        if (ts.isBefore(cutoff)) toDelete.add(key as String);
      } catch (_) {}
    }
    for (final k in toDelete) {
      await box.delete(k);
      _memoryCache.remove(k);
      _accessOrder.remove(k);
    }
  }

  Future<void> invalidateStory(String storyId) async {
    final box = _box;
    if (box == null) return;
    final prefix = '${storyId}_';
    for (final k
        in box.keys
            .whereType<String>()
            .where((k) => k.startsWith(prefix))
            .toList()) {
      await box.delete(k);
      _memoryCache.remove(k);
      _accessOrder.remove(k);
    }
  }
}
