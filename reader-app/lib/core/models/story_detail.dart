import 'story.dart';

class StoryDetail {
  final Story story;
  final List<ChapterSummary> chapters;

  const StoryDetail({required this.story, required this.chapters});

  factory StoryDetail.fromJson(Map<String, dynamic> json) {
    final storyMap = json['story'];
    final chaptersRaw = json['chapters'];
    final chapters = <ChapterSummary>[];
    if (chaptersRaw is List) {
      for (final c in chaptersRaw) {
        if (c is! Map) continue;
        try {
          chapters.add(ChapterSummary.fromJson(Map<String, dynamic>.from(c)));
        } catch (_) {}
      }
    }
    return StoryDetail(
      story: Story.fromJson(
        storyMap is Map ? Map<String, dynamic>.from(storyMap) : <String, dynamic>{},
      ),
      chapters: chapters,
    );
  }
}

class ChapterSummary {
  final String id;
  final int chapterNumber;
  final String? title;
  final int readTimeMinutes;
  final int viewCount;

  const ChapterSummary({
    required this.id,
    required this.chapterNumber,
    this.title,
    this.readTimeMinutes = 10,
    this.viewCount = 0,
  });

  factory ChapterSummary.fromJson(Map<String, dynamic> json) {
    int asInt(dynamic v) {
      if (v is int) return v;
      if (v is num) return v.round();
      if (v is String) return int.tryParse(v) ?? 0;
      return 0;
    }

    return ChapterSummary(
      id: '${json['id'] ?? ''}',
      chapterNumber: asInt(json['chapter_number']),
      title: json['title'] as String?,
      readTimeMinutes: asInt(json['estimated_read_time_minutes']) == 0
          ? 10
          : asInt(json['estimated_read_time_minutes']),
      viewCount: asInt(json['view_count']),
    );
  }
}