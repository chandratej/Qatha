import 'dart:async';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/app_config.dart';
import '../providers/auth_state.dart';

class AuthService {
  AuthService();

  final _supabase = Supabase.instance.client;
  final _secureStorage = const FlutterSecureStorage();
  final _deviceInfo = DeviceInfoPlugin();

  static const _deviceIdKey = 'device_id';

  Future<String?> sendOtp(String phone) async {
    // Use Supabase Auth Phone OTP directly (per katha-auth-architecture-decision_auth.md)
    // SMS delivery handled by configured Send SMS Hook + India CPaaS (MSG91 etc.)
    await _supabase.auth.signInWithOtp(phone: phone);
    return null; // Supabase handles the flow; no verificationId needed client-side for SMS
  }

  Future<({AuthUser user, String accessToken})> verifyOtp(String phone, String otp) async {
    final response = await _supabase.auth.verifyOTP(
      phone: phone,
      token: otp,
      type: OtpType.sms,
    );

    final session = response.session;
    if (session == null) {
      throw Exception('OTP verification failed - no session');
    }

    final accessToken = session.accessToken;
    final userId = session.user.id;

    // Ensure device is registered (for device limit logic)
    await _registerDevice(userId);

    // Fetch or create profile (RLS will protect)
    final profile = await _getOrCreateProfile(userId, phone);

    return (
      user: profile,
      accessToken: accessToken,
    );
  }

  Future<AuthUser> _getOrCreateProfile(String userId, String phone) async {
    // Use direct Supabase query (RLS enforced)
    var response = await _supabase
        .from('profiles')
        .select()
        .eq('id', userId)
        .maybeSingle();

    if (response == null) {
      // Create basic profile on first auth (phone path)
      response = await _supabase.from('profiles').insert({
        'id': userId,
        'phone': phone,
        'role': 'reader',
        'display_name': 'Reader',
      }).select().single();
    }

    return AuthUser.fromJson({
      'id': response['id'],
      'phone': response['phone'] ?? phone,
      'display_name': response['display_name'] ?? 'Reader',
      'role': response['role'] ?? 'reader',
      'subscription_status': response['subscription_status'] ?? 'free',
      'trial_ends_at': response['trial_ends_at'],
      // Add other fields as needed
    });
  }

  Future<void> _registerDevice(String userId) async {
    // Client-generated device id for device limit tracking (per decision doc)
    String? deviceId = await _secureStorage.read(key: _deviceIdKey);
    if (deviceId == null) {
      deviceId = DateTime.now().millisecondsSinceEpoch.toString() + 
                 (await _getDeviceLabel()).hashCode.toString();
      await _secureStorage.write(key: _deviceIdKey, value: deviceId);
    }

    final deviceLabel = await _getDeviceLabel();

    // Call Edge Function for device registration / limit enforcement (service_role inside)
    // For now, call a placeholder; in full impl this would be supabase.functions.invoke('register-device'...
    try {
      await _supabase.functions.invoke(
        'register-device',
        body: {
          'device_id': deviceId,
          'device_label': deviceLabel,
          'user_id': userId,
        },
      );
    } catch (e) {
      // Non-fatal in MVP; device tracking is best-effort
      print('Device register warning: $e');
    }
  }

  Future<String> _getDeviceLabel() async {
    try {
      final androidInfo = await _deviceInfo.androidInfo;
      return '${androidInfo.manufacturer} ${androidInfo.model}';
    } catch (_) {
      return 'Unknown Device';
    }
  }

  Future<void> signOut() async {
    await _supabase.auth.signOut();
  }
}