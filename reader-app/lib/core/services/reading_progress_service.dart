import 'package:shared_preferences/shared_preferences.dart';

/// Local scroll-position cache — survives app restarts (research: ritual bond / continue reading).
class ReadingProgressService {
  ReadingProgressService._();
  static final instance = ReadingProgressService._();

  static const _scrollPrefix = 'katha_scroll_';

  Future<int?> getScrollPct(String storyId, int chapterNumber) async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt('$_scrollPrefix${storyId}_$chapterNumber');
  }

  Future<void> saveScrollPct(String storyId, int chapterNumber, int pct) async {
    if (pct <= 0) return;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('$_scrollPrefix${storyId}_$chapterNumber', pct.clamp(0, 100));
  }

  Future<void> clearChapter(String storyId, int chapterNumber) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('$_scrollPrefix${storyId}_$chapterNumber');
  }
}