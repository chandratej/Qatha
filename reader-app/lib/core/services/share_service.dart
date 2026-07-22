import 'package:share_plus/share_plus.dart';
import '../config/app_config.dart';
import 'analytics_service.dart';

/// Builds the WhatsApp/Telegram-optimized share message and hands it to the
/// native share sheet. The link points at the backend's `/s/{storyId}/{n}`
/// OG-preview page (`src/routes/share.js`), which is what unfurls into the
/// unfurled card in chat apps and redirects real visitors into the app.
class ShareService {
  ShareService._();

  static String _oneLineHook(String? description) {
    if (description == null || description.trim().isEmpty) {
      return 'తెలుగు కథలు — Read on Katha.';
    }
    final firstLine = description.trim().split('\n').first;
    return firstLine.length > 140 ? '${firstLine.substring(0, 137)}...' : firstLine;
  }

  static Future<void> shareChapter({
    required String storyId,
    required String storyTitle,
    required int chapterNumber,
    String? chapterTitle,
    String? description,
  }) async {
    final url = '${AppConfig.webBase}/s/$storyId/$chapterNumber';
    final hook = _oneLineHook(description);
    final heading = chapterTitle?.isNotEmpty == true
        ? '$storyTitle — $chapterTitle'
        : storyTitle;

    final text = '$heading\n$hook\n\nRead on Katha — $url';

    await AnalyticsService.instance.shareTapped(storyId, chapterNumber);
    await Share.share(text, subject: storyTitle);
  }
}
