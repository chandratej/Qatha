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
  });

  factory Story.fromJson(Map<String, dynamic> json) {
    final creator = json['creators'] as Map<String, dynamic>?;
    return Story(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      genre: json['genre'] as String,
      coverUrl: json['cover_url'] as String?,
      chapterCount: json['chapter_count'] as int? ?? 0,
      totalReaders: json['total_readers'] as int? ?? 0,
      viewsThisWeek: json['views_this_week'] as int? ?? 0,
      authorName: creator?['pen_name'] as String? ?? 'Unknown',
      authorAvatar: creator?['avatar_url'] as String?,
    );
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
  final String? contentHash; // For cache invalidation / version check (blueprint)

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
      id: json['id'] as String,
      storyId: json['story_id'] as String,
      chapterNumber: json['chapter_number'] as int,
      title: json['title'] as String?,
      content: json['content'] as String,
      estimatedReadTimeMinutes: json['estimated_read_time_minutes'] as int? ?? 10,
      viewCount: json['view_count'] as int? ?? 0,
      contentHash: json['content_hash'] as String?,
    );
  }
}