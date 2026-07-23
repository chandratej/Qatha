class Story {
  final String id;
  final String title;
  final String? description;
  final String genre;
  final String? coverUrl;
  final int chapterCount;
  final int totalReaders;
  final int viewsThisWeek;
  final String authorName;
  final String? authorAvatar;
  final String ageRating;
  /// Per-story free-chapter sample size, derived server-side from creator-band
  /// data (or a manual override) — see freeChapterThreshold.js. Null when the
  /// backend hasn't resolved one (e.g. an older cached response).
  final int? resolvedFreeChapters;
  final String? freeChapterSource;

  const Story({
    required this.id,
    required this.title,
    this.description,
    required this.genre,
    this.coverUrl,
    required this.chapterCount,
    required this.totalReaders,
    this.viewsThisWeek = 0,
    required this.authorName,
    this.authorAvatar,
    this.ageRating = 'all_ages',
    this.resolvedFreeChapters,
    this.freeChapterSource,
  });

  /// Defensive parse — one bad row must not kill the whole feed.
  factory Story.fromJson(Map<String, dynamic> json) {
    final creatorRaw = json['creators'];
    Map<String, dynamic>? creator;
    if (creatorRaw is Map) {
      creator = Map<String, dynamic>.from(creatorRaw);
    } else if (creatorRaw is List && creatorRaw.isNotEmpty && creatorRaw.first is Map) {
      creator = Map<String, dynamic>.from(creatorRaw.first as Map);
    }

    return Story(
      id: '${json['id'] ?? ''}',
      title: (json['title'] as String?)?.trim().isNotEmpty == true
          ? (json['title'] as String).trim()
          : 'Untitled',
      description: json['description'] as String?,
      genre: (json['genre'] as String?)?.trim().isNotEmpty == true
          ? (json['genre'] as String)
          : 'general',
      coverUrl: json['cover_url'] as String?,
      chapterCount: _asInt(json['chapter_count']),
      totalReaders: _asInt(json['total_readers']),
      viewsThisWeek: _asInt(json['views_this_week']),
      authorName: (creator?['pen_name'] as String?)?.trim().isNotEmpty == true
          ? (creator!['pen_name'] as String)
          : 'Author',
      authorAvatar: creator?['avatar_url'] as String?,
      ageRating: (json['age_rating'] as String?)?.trim().isNotEmpty == true
          ? (json['age_rating'] as String)
          : 'all_ages',
      resolvedFreeChapters: json['resolved_free_chapters'] != null
          ? _asInt(json['resolved_free_chapters'])
          : null,
      freeChapterSource: json['free_chapter_source'] as String?,
    );
  }

  /// Content maturity signal (§2.4) — a visible trust signal, not a hard
  /// age-gate. Only surfaced when it deviates from the default so the tag
  /// stays non-intrusive rather than labeling every card "General".
  bool get isMatureThemed => ageRating == 'mature';
  String get maturityLabel => isMatureThemed ? 'Mature Themes' : 'General';

  static int _asInt(dynamic v) {
    if (v is int) return v;
    if (v is num) return v.round();
    if (v is String) return int.tryParse(v) ?? 0;
    return 0;
  }

  String get genreLabel {
    switch (genre) {
      case 'romance':
        return 'Romance';
      case 'family_drama':
        return 'Family Drama';
      case 'suspense':
        return 'Suspense';
      default:
        return genre;
    }
  }

  String get readersLabel {
    if (totalReaders >= 1000) {
      return '${(totalReaders / 1000).toStringAsFixed(1)}K readers';
    }
    return '$totalReaders readers';
  }
}

class Chapter {
  final String id;
  final String storyId;
  final int chapterNumber;
  final String? title;
  final String content;
  final int estimatedReadTimeMinutes;
  final int viewCount;
  final String? contentHash;

  const Chapter({
    required this.id,
    required this.storyId,
    required this.chapterNumber,
    this.title,
    required this.content,
    this.estimatedReadTimeMinutes = 10,
    this.viewCount = 0,
    this.contentHash,
  });

  factory Chapter.fromJson(Map<String, dynamic> json) {
    return Chapter(
      id: '${json['id'] ?? ''}',
      storyId: '${json['story_id'] ?? ''}',
      chapterNumber: Story._asInt(json['chapter_number']),
      title: json['title'] as String?,
      content: (json['content'] as String?) ?? '',
      estimatedReadTimeMinutes: Story._asInt(json['estimated_read_time_minutes']) == 0
          ? 10
          : Story._asInt(json['estimated_read_time_minutes']),
      viewCount: Story._asInt(json['view_count']),
      contentHash: json['content_hash'] as String?,
    );
  }
}
