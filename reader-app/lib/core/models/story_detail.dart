import 'story.dart';

class StoryDetail {
  final Story story;
  final List<ChapterSummary> chapters;

  const StoryDetail({required this.story, required this.chapters});

  factory StoryDetail.fromJson(Map<String, dynamic> json) {
    return StoryDetail(
      story: Story.fromJson(json['story'] as Map<String, dynamic>),
      chapters: (json['chapters'] as List<dynamic>)
          .map((c) => ChapterSummary.fromJson(c as Map<String, dynamic>))
          .toList(),
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
    return ChapterSummary(
      id: json['id'] as String,
      chapterNumber: json['chapter_number'] as int,
      title: json['title'] as String?,
      readTimeMinutes: json['estimated_read_time_minutes'] as int? ?? 10,
      viewCount: json['view_count'] as int? ?? 0,
    );
  }
}