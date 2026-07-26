import 'package:google_sign_in/google_sign_in.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthUser, AuthState;
import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/app_config.dart';
import '../providers/auth_state.dart';
import 'launch_offer_service.dart';

/// Reader auth: Cascading Auth Gate (Google primary → email magic link fallback).
/// Phone OTP is NOT used for readers — it is reserved for Creator CMS payout/KYC.
/// WhatsApp OTP delivery (whatsapp-otp edge function) is shared but creator-only.
class AuthService {
  AuthService();

  final _supabase = Supabase.instance.client;
  final _secureStorage = const FlutterSecureStorage();
  final _deviceInfo = DeviceInfoPlugin();

  static const _deviceIdKey = 'device_id';
  static const _googleConfirmedKey = 'google_account_confirmed';

  GoogleSignIn? _googleSignIn;

  GoogleSignIn get googleSignIn {
    _googleSignIn ??= GoogleSignIn(
      scopes: ['email', 'profile'],
      serverClientId: AppConfig.googleWebClientId.isNotEmpty
          ? AppConfig.googleWebClientId
          : null,
    );
    return _googleSignIn!;
  }

  /// Primary reader path — explicit account picker on first use (no silent auto-select).
  Future<({AuthUser user, String accessToken})> signInWithGoogle() async {
    if (!AppConfig.googleSignInConfigured) {
      throw Exception(
        'GOOGLE_WEB_CLIENT_ID_MISSING',
      );
    }

    final account = await googleSignIn.signIn();
    if (account == null) {
      throw Exception('Google sign-in cancelled');
    }

    final googleAuth = await account.authentication;
    final idToken = googleAuth.idToken;
    if (idToken == null) {
      throw Exception(
        'GOOGLE_WEB_CLIENT_ID_MISSING',
      );
    }

    final response = await _supabase.auth.signInWithIdToken(
      provider: OAuthProvider.google,
      idToken: idToken,
      accessToken: googleAuth.accessToken,
    );

    final session = response.session;
    if (session == null) {
      throw Exception('Google sign-in failed — no Supabase session');
    }

    await _secureStorage.write(key: _googleConfirmedKey, value: account.id);

    return _finishReaderSession(
      session,
      displayName: account.displayName,
      email: account.email,
    );
  }

  /// Manual fallback when Google is dismissed or unavailable.
  Future<void> sendEmailMagicLink(String email) async {
    final trimmed = email.trim().toLowerCase();
    if (!trimmed.contains('@')) {
      throw Exception('Enter a valid email address');
    }
    await _supabase.auth.signInWithOtp(
      email: trimmed,
      emailRedirectTo: AppConfig.authRedirectUrl,
    );
  }

  Future<({AuthUser user, String accessToken})> verifyEmailOtp(
    String email,
    String token,
  ) async {
    final response = await _supabase.auth.verifyOTP(
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: OtpType.email,
    );

    final session = response.session;
    if (session == null) {
      throw Exception('Email verification failed');
    }

    return _finishReaderSession(session, email: email.trim().toLowerCase());
  }

  /// Restore an existing Supabase session (called on app init).
  Future<({AuthUser user, String accessToken})?> restoreSession() async {
    final session = _supabase.auth.currentSession;
    if (session == null) return null;
    return _finishReaderSession(session, skipDeviceRegister: true);
  }

  Future<({AuthUser user, String accessToken})> _finishReaderSession(
    Session session, {
    String? displayName,
    String? email,
    String? phone,
    bool skipDeviceRegister = false,
  }) async {
    final userId = session.user.id;
    final resolvedEmail = email ?? session.user.email;
    final resolvedPhone = phone ?? session.user.phone ?? '';

    if (!skipDeviceRegister) {
      await _registerDevice(userId);
    }

    final isNew = await _ensureReaderProfile(
      userId,
      displayName: displayName,
      email: resolvedEmail,
      phone: resolvedPhone,
    );

    if (isNew) {
      await _applyLaunchTrialIfEligible(userId);
    }

    var profile = await _fetchProfile(userId);
    final offer = LaunchOfferService.instance.config;
    if (isNew && offer.hasLaunchTrial) {
      profile = profile.copyWith(
        subscriptionStatus: 'trial',
        launchTrialGranted: true,
        launchTrialDays: offer.trialDays,
        trialEndsAt: DateTime.now().add(Duration(days: offer.trialDays)).toIso8601String(),
      );
    }
    return (user: profile, accessToken: session.accessToken);
  }

  Future<bool> _ensureReaderProfile(
    String userId, {
    String? displayName,
    String? email,
    String? phone,
  }) async {
    final existing = await _supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

    if (existing != null) return false;

    await _supabase.from('profiles').insert({
      'id': userId,
      'display_name': displayName ?? email?.split('@').first ?? 'Reader',
      'role': 'reader',
      if (phone != null && phone.isNotEmpty) 'phone': phone,
    });
    return true;
  }

  Future<void> _applyLaunchTrialIfEligible(String userId) async {
    final offer = LaunchOfferService.instance.config;
    if (offer.mode == 'immediate' || offer.trialDays <= 0) return;

    final trialEnds = DateTime.now().add(Duration(days: offer.trialDays));
    try {
      await _supabase.from('profiles').update({
        'subscription_status': 'trial',
        'trial_ends_at': trialEnds.toIso8601String(),
      }).eq('id', userId);
    } catch (e) {
      print('Launch trial grant warning: $e');
    }
  }

  Future<AuthUser> _fetchProfile(String userId) async {
    final response = await _supabase
        .from('profiles')
        .select()
        .eq('id', userId)
        .single();

    return AuthUser.fromJson({
      'id': response['id'],
      'phone': response['phone'] ?? '',
      'email': _supabase.auth.currentUser?.email,
      'display_name': response['display_name'] ?? 'Reader',
      'role': response['role'] ?? 'reader',
      'subscription_status': response['subscription_status'] ?? 'free',
      'trial_ends_at': response['trial_ends_at'],
    });
  }

  Future<void> _registerDevice(String userId) async {
    String? deviceId = await _secureStorage.read(key: _deviceIdKey);
    if (deviceId == null) {
      deviceId = '${DateTime.now().millisecondsSinceEpoch}${(await _getDeviceLabel()).hashCode}';
      await _secureStorage.write(key: _deviceIdKey, value: deviceId);
    }

    try {
      await _supabase.functions.invoke(
        'register-device',
        body: {
          'device_id': deviceId,
          'device_label': await _getDeviceLabel(),
          'user_id': userId,
        },
      );
    } catch (e) {
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
    try {
      await googleSignIn.signOut();
    } catch (_) {}
    await _supabase.auth.signOut();
  }
}