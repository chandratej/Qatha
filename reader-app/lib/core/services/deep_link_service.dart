import 'dart:async';
import 'package:app_links/app_links.dart';
import '../models/pending_chapter_link.dart';

/// Thin wrapper around `app_links` — kept separate from `main.dart` so the
/// parsing logic in [PendingChapterLink] stays testable without a platform channel.
class DeepLinkService {
  DeepLinkService._();
  static final DeepLinkService instance = DeepLinkService._();

  final AppLinks _appLinks = AppLinks();

  /// The link the OS cold-started the app with, if any. Null on a normal launch.
  Future<PendingChapterLink?> getInitialLink() async {
    try {
      final uri = await _appLinks.getInitialLink();
      return uri == null ? null : PendingChapterLink.tryParse(uri);
    } catch (_) {
      return null;
    }
  }

  /// Links received while the app is already running (foreground/background).
  Stream<PendingChapterLink> get onLink => _appLinks.uriLinkStream
      .map(PendingChapterLink.tryParse)
      .where((l) => l != null)
      .cast<PendingChapterLink>();
}
