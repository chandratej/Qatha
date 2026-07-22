/// A parsed `/s/{storyId}/{chapterNumber}` share link — matches the shape the
/// backend's `share.js` OG page and the app's `https`/`katha://` intent-filters
/// both use, so one parser handles cold-start App Links and the custom-scheme
/// fallback identically.
class PendingChapterLink {
  final String storyId;
  final int chapterNumber;

  const PendingChapterLink({required this.storyId, required this.chapterNumber});

  /// `https://katha.app/s/{storyId}/{n}` -> host is the domain, path is `/s/{id}/{n}`.
  /// `katha://s/{storyId}/{n}` -> scheme has no authority concept for custom
  /// schemes, so Uri parses `s` as the host and `{id}/{n}` as the path. Folding
  /// the host into the segment list when the scheme isn't http(s) normalizes both.
  static PendingChapterLink? tryParse(Uri uri) {
    final isWeb = uri.scheme == 'https' || uri.scheme == 'http';
    final segments = <String>[
      if (!isWeb && uri.host.isNotEmpty) uri.host,
      ...uri.pathSegments,
    ].where((s) => s.isNotEmpty).toList();

    if (segments.length != 3 || segments[0] != 's') return null;
    final storyId = segments[1];
    final chapterNumber = int.tryParse(segments[2]);
    if (storyId.isEmpty || chapterNumber == null || chapterNumber < 1) return null;
    return PendingChapterLink(storyId: storyId, chapterNumber: chapterNumber);
  }
}
