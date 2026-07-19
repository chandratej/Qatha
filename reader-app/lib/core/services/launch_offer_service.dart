import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/launch_offer_config.dart';

class LaunchOfferService {
  LaunchOfferService._();
  static final instance = LaunchOfferService._();

  LaunchOfferConfig _config = LaunchOfferConfig.fallback;
  bool _loaded = false;

  LaunchOfferConfig get config => _config;
  bool get isLoaded => _loaded;

  /// [baseUrl] must not default to [AppConfig.apiBase] (getter is non-const).
  Future<LaunchOfferConfig> fetch({String? baseUrl}) async {
    final resolved = baseUrl ?? AppConfig.apiBase;
    try {
      final root = resolved.replaceAll(RegExp(r'/api$'), '');
      final res = await http
          .get(Uri.parse('$root/api/config/launch-offer'))
          .timeout(const Duration(seconds: 2));
      if (res.statusCode == 200) {
        _config = LaunchOfferConfig.fromJson(
          jsonDecode(res.body) as Map<String, dynamic>,
        );
        _loaded = true;
      }
    } catch (_) {
      _config = LaunchOfferConfig.fallback;
      _loaded = false;
    }
    return _config;
  }
}
