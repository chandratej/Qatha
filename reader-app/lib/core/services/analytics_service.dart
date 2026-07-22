import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class AnalyticsService {
  AnalyticsService._();
  static final AnalyticsService instance = AnalyticsService._();

  String? userId;

  void setUserId(String? id) => userId = id;

  Future<void> track(String event, [Map<String, dynamic>? properties]) async {
    // Best-effort only — never block UI or crash when API is offline
    try {
      await http
          .post(
            Uri.parse('${AppConfig.apiBase}/analytics/events'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'event': event,
              'user_id': userId,
              'properties': {
                ...?properties,
                'platform': 'web',
                'timestamp': DateTime.now().toIso8601String(),
              },
            }),
          )
          .timeout(const Duration(seconds: 2));
    } catch (_) {}
  }

  Future<void> appInstall() => track('app_install');
  Future<void> homepageView() => track('homepage_view');
  Future<void> chapterOpened(String storyId, int chapterNum) =>
      track('chapter_opened', {'story_id': storyId, 'chapter_number': chapterNum});
  Future<void> chapterCompleted(String storyId, int chapterNum) =>
      track('chapter_completed', {'story_id': storyId, 'chapter_number': chapterNum});
  Future<void> otpGateShown(String storyId) => track('otp_gate_shown', {'story_id': storyId});
  Future<void> paywallShown(String storyId) => track('paywall_shown', {'story_id': storyId});
  Future<void> subscriptionConfirmed() => track('subscription_confirmed');

  Future<void> shareTapped(String storyId, int chapterNumber) =>
      track('share_tapped', {'story_id': storyId, 'chapter_number': chapterNumber});
  Future<void> coldLandingView(String storyId, int chapterNumber, {required bool hasAccount}) =>
      track('cold_landing_view', {
        'story_id': storyId,
        'chapter_number': chapterNumber,
        'has_account': hasAccount,
      });
  Future<void> coldLandingToSignupConversion(String storyId) =>
      track('cold_landing_to_signup_conversion', {'story_id': storyId});
}