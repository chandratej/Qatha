import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/story.dart';
import '../models/story_detail.dart';
import '../providers/auth_state.dart';

class ApiException implements Exception {
  final String code;
  final String userMessage;
  final String action;

  ApiException({required this.code, required this.userMessage, required this.action});

  factory ApiException.fromJson(Map<String, dynamic> json) {
    return ApiException(
      code: json['code'] as String? ?? 'UNKNOWN',
      userMessage: json['user_message'] as String? ?? 'Something went wrong',
      action: json['action'] as String? ?? 'RETRY',
    );
  }
}

class ApiService {
  ApiService({
    String? baseUrl,
    this.userId,
    this.subscriptionStatus,
    this.trialEndsAt,
    this.accessToken,
  }) : baseUrl = baseUrl ?? AppConfig.apiBase;

  final String baseUrl;
  final String? userId;
  final String? subscriptionStatus;
  final String? trialEndsAt;
  final String? accessToken;

  factory ApiService.fromAuth(AuthState auth, {String? baseUrl}) {
    return ApiService(
      baseUrl: baseUrl ?? AppConfig.apiBase,
      userId: auth.user?.id,
      subscriptionStatus: auth.user?.subscriptionStatus,
      trialEndsAt: auth.user?.trialEndsAt,
      accessToken: auth.token,
    );
  }

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (accessToken != null && accessToken!.isNotEmpty)
          'Authorization': 'Bearer $accessToken',
        if (userId != null) 'x-user-id': userId!,
        if (subscriptionStatus != null) 'x-subscription-status': subscriptionStatus!,
        if (trialEndsAt != null) 'x-trial-ends-at': trialEndsAt!,
        // Helps backend bind sessions for OTP rate limiting / device checks (blueprint Phase 1)
        'x-device-id': 'flutter-${DateTime.now().millisecondsSinceEpoch % 999999}',
      };

  Future<List<Story>> fetchStories({String? genre, String sort = 'trending'}) async {
    final params = <String, String>{'sort': sort};
    if (genre != null) params['genre'] = genre;
    final uri = Uri.parse('$baseUrl/stories').replace(queryParameters: params);
    late final http.Response res;
    try {
      res = await http.get(uri, headers: _headers).timeout(const Duration(seconds: 15));
    } catch (e) {
      throw ApiException(
        code: 'NETWORK_OFFLINE',
        userMessage: 'Cannot reach story API ($baseUrl). Is the backend running?',
        action: 'RETRY',
      );
    }
    if (res.statusCode != 200) {
      final err = _parseError(res);
      throw ApiException(
        code: err.code,
        userMessage: '${err.userMessage} (GET $uri → ${res.statusCode})',
        action: err.action,
      );
    }
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    // Reject mock seed payload in production path if backend still returns mock:true with only demos
    final list = data['stories'];
    if (list is! List) return [];
    final stories = <Story>[];
    for (final row in list) {
      if (row is! Map) continue;
      try {
        final story = Story.fromJson(Map<String, dynamic>.from(row));
        if (story.id.isEmpty) continue;
        // Never surface old hard-coded seed ids from a misconfigured mock backend
        if (story.id.startsWith('story-00') && story.id.length <= 10) continue;
        stories.add(story);
      } catch (_) {
        // Skip malformed rows — do not fail the whole catalog
      }
    }
    stories.sort((a, b) => b.chapterCount.compareTo(a.chapterCount));
    return stories;
  }

  Future<DiscoverFeed> fetchDiscover(String genre) async {
    final res = await http.get(Uri.parse('$baseUrl/stories/discover/$genre'), headers: _headers);
    if (res.statusCode != 200) throw _parseError(res);
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    List<Story> parseList(dynamic raw) {
      if (raw is! List) return [];
      final out = <Story>[];
      for (final row in raw) {
        if (row is! Map) continue;
        try {
          final s = Story.fromJson(Map<String, dynamic>.from(row));
          if (s.id.isNotEmpty) out.add(s);
        } catch (_) {}
      }
      return out;
    }
    return DiscoverFeed(
      genre: genre,
      trending: parseList(data['trending']),
      newReleases: parseList(data['new_releases']),
    );
  }

  Future<StoryDetail> fetchStoryDetail(String storyId) async {
    final res = await http.get(Uri.parse('$baseUrl/stories/$storyId'), headers: _headers);
    if (res.statusCode != 200) throw _parseError(res);
    return StoryDetail.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }

  Future<Chapter> fetchChapter(String storyId, int chapterNumber) async {
    final res = await http.get(
      Uri.parse('$baseUrl/chapters/$storyId/$chapterNumber'),
      headers: _headers,
    );
    if (res.statusCode == 403) throw _parseError(res);
    if (res.statusCode != 200) throw _parseError(res);
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return Chapter.fromJson(data['chapter'] as Map<String, dynamic>);
  }

  Future<void> saveProgress({
    required String storyId,
    required String chapterId,
    required int scrollPct,
    int? charOffset,
    bool isCompleted = false,
  }) async {
    if (userId == null) return;
    final progressBody = <String, dynamic>{
      'story_id': storyId,
      'chapter_id': chapterId,
      'scroll_position_pct': scrollPct,
      'is_completed': isCompleted,
    };
    if (charOffset != null) {
      progressBody['last_read_char_offset'] = charOffset;
    }
    await http.post(
      Uri.parse('$baseUrl/chapters/progress'),
      headers: _headers,
      body: jsonEncode(progressBody),
    );
  }

  Future<void> submitReaderFeedback({
    required String storyId,
    required int chapterNumber,
    required String body,
    String feedbackType = 'written_review',
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/engagement/reader-feedback'),
      headers: _headers,
      body: jsonEncode({
        'story_id': storyId,
        'chapter_number': chapterNumber,
        'body': body,
        'feedback_type': feedbackType,
      }),
    );
    if (res.statusCode != 201) throw _parseError(res);
  }

  /// Lightweight readiness probe against the Node API (database-backed catalog).
  Future<bool> healthCheck() async {
    try {
      final res = await http
          .get(Uri.parse('$baseUrl/health'), headers: _headers)
          .timeout(const Duration(seconds: 8));
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  Future<Map<String, dynamic>?> pingStreak() async {
    if (userId == null) return null;
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/engagement/ping-streak'),
        headers: _headers,
      );
      if (res.statusCode == 200) {
        return jsonDecode(res.body) as Map<String, dynamic>;
      }
    } catch (_) {}
    return null;
  }

  ApiException _parseError(http.Response res) {
    try {
      return ApiException.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
    } catch (_) {
      return ApiException(code: 'NETWORK_OFFLINE', userMessage: 'No connection', action: 'RETRY');
    }
  }
}

class DiscoverFeed {
  final String genre;
  final List<Story> trending;
  final List<Story> newReleases;

  const DiscoverFeed({required this.genre, required this.trending, required this.newReleases});
}