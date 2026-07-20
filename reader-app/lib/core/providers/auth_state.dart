import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/auth_service.dart';

class AuthUser {
  final String id;
  final String phone;
  final String? email;
  final String displayName;
  final String subscriptionStatus;
  final String? trialEndsAt;
  final bool launchTrialGranted;
  final int? launchTrialDays;

  String get identityLabel => email?.isNotEmpty == true
      ? email!
      : (phone.isNotEmpty ? phone : displayName);

  const AuthUser({
    required this.id,
    required this.phone,
    this.email,
    required this.displayName,
    this.subscriptionStatus = 'free',
    this.trialEndsAt,
    this.launchTrialGranted = false,
    this.launchTrialDays,
  });

  bool get isSubscribed =>
      subscriptionStatus == 'active' ||
      subscriptionStatus == 'trial' ||
      subscriptionStatus == 'grace_period';

  bool get isOnLaunchTrial {
    if (subscriptionStatus != 'trial' || trialEndsAt == null) return false;
    return DateTime.parse(trialEndsAt!).isAfter(DateTime.now());
  }

  Duration? get trialRemaining {
    if (trialEndsAt == null) return null;
    final end = DateTime.parse(trialEndsAt!);
    final diff = end.difference(DateTime.now());
    return diff.isNegative ? Duration.zero : diff;
  }

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as String,
      phone: json['phone'] as String? ?? '',
      email: json['email'] as String?,
      displayName: json['display_name'] as String? ?? 'Reader',
      subscriptionStatus: json['subscription_status'] as String? ?? 'free',
      trialEndsAt: json['trial_ends_at'] as String?,
      launchTrialGranted: json['launch_trial_granted'] as bool? ?? false,
      launchTrialDays: json['launch_trial_days'] as int?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'phone': phone,
        if (email != null) 'email': email,
        'display_name': displayName,
        'subscription_status': subscriptionStatus,
        if (trialEndsAt != null) 'trial_ends_at': trialEndsAt,
        'launch_trial_granted': launchTrialGranted,
        if (launchTrialDays != null) 'launch_trial_days': launchTrialDays,
      };

  AuthUser copyWith({
    String? subscriptionStatus,
    String? trialEndsAt,
    bool? launchTrialGranted,
    int? launchTrialDays,
  }) {
    return AuthUser(
      id: id,
      phone: phone,
      displayName: displayName,
      subscriptionStatus: subscriptionStatus ?? this.subscriptionStatus,
      trialEndsAt: trialEndsAt ?? this.trialEndsAt,
      launchTrialGranted: launchTrialGranted ?? this.launchTrialGranted,
      launchTrialDays: launchTrialDays ?? this.launchTrialDays,
    );
  }
}

class AuthState extends ChangeNotifier {
  AuthUser? _user;
  String? _token;
  bool _loading = true;

  AuthUser? get user => _user;
  String? get token => _token;
  bool get loading => _loading;
  bool get isLoggedIn => _user != null;
  bool get isSubscribed => _user?.isSubscribed ?? false;
  bool get isOnLaunchTrial => _user?.isOnLaunchTrial ?? false;

  Future<void> init() async {
    try {
      // Constructing AuthService reads Supabase.instance, which throws if
      // Supabase.initialize() failed at boot — keep it inside the try so
      // that case falls back to the cached prefs session below, same as
      // any other restoreSession() failure.
      final auth = AuthService();
      final restored = await auth.restoreSession();
      if (restored != null) {
        _user = restored.user;
        _token = restored.accessToken;
        await _persist();
      } else {
        final prefs = await SharedPreferences.getInstance();
        final userJson = prefs.getString('katha_user');
        _token = prefs.getString('katha_token');
        if (userJson != null) {
          _user = AuthUser.fromJson(jsonDecode(userJson) as Map<String, dynamic>);
        }
      }
    } catch (_) {
      final prefs = await SharedPreferences.getInstance();
      final userJson = prefs.getString('katha_user');
      _token = prefs.getString('katha_token');
      if (userJson != null) {
        _user = AuthUser.fromJson(jsonDecode(userJson) as Map<String, dynamic>);
      }
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> _persist() async {
    final prefs = await SharedPreferences.getInstance();
    if (_user != null) {
      await prefs.setString('katha_user', jsonEncode(_user!.toJson()));
      if (_token != null) await prefs.setString('katha_token', _token!);
    } else {
      await prefs.remove('katha_user');
      await prefs.remove('katha_token');
    }
  }

  Future<void> setSession(AuthUser user, String token) async {
    _user = user;
    _token = token;
    await _persist();
    notifyListeners();
  }

  Future<void> setSubscriptionStatus(String status, {String? trialEndsAt}) async {
    if (_user == null) return;
    _user = _user!.copyWith(subscriptionStatus: status, trialEndsAt: trialEndsAt);
    await _persist();
    notifyListeners();
  }

  Future<void> logout() async {
    await AuthService().signOut();
    _user = null;
    _token = null;
    await _persist();
    notifyListeners();
  }
}