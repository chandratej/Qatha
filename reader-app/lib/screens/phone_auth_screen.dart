import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../core/providers/auth_state.dart';
import '../core/services/auth_service.dart';
import '../core/theme/katha_theme.dart';

class PhoneAuthScreen extends StatefulWidget {
  final VoidCallback? onSuccess;

  const PhoneAuthScreen({super.key, this.onSuccess});

  @override
  State<PhoneAuthScreen> createState() => _PhoneAuthScreenState();
}

class _PhoneAuthScreenState extends State<PhoneAuthScreen> {
  final _auth = AuthService();
  final _phoneController = TextEditingController(text: '+91');
  final _otpController = TextEditingController();
  bool _otpSent = false;
  bool _loading = false;
  String? _error;
  String? _hint;
  int _resendSeconds = 0;

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  void _startResendTimer([int seconds = 60]) {
    setState(() => _resendSeconds = seconds);
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      if (!mounted) return false;
      setState(() => _resendSeconds = (_resendSeconds - 1).clamp(0, 120));
      return _resendSeconds > 0;
    });
  }

  Future<void> _sendOtp({bool isResend = false}) async {
    setState(() { _loading = true; _error = null; });
    try {
      await _auth.sendOtp(_phoneController.text.trim());
      setState(() {
        _otpSent = true;
        _hint = 'OTP sent via Supabase (check your SMS)';
      });
      if (!isResend) _startResendTimer();
    } catch (e) {
      final msg = e.toString().replaceFirst('Exception: ', '');
      setState(() => _error = msg);
      if (msg.toLowerCase().contains('rate') || msg.toLowerCase().contains('too many')) {
        _startResendTimer(120);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _verify() async {
    final authState = context.read<AuthState>();
    setState(() { _loading = true; _error = null; });
    try {
      final result = await _auth.verifyOtp(_phoneController.text.trim(), _otpController.text.trim());
      await authState.setSession(result.user, result.accessToken);
      if (mounted) {
        if (result.user.launchTrialGranted && result.user.launchTrialDays != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Welcome! ${result.user.launchTrialDays}-day unlimited reading unlocked.'),
              backgroundColor: KathaColors.gold,
            ),
          );
        }
        if (widget.onSuccess != null) {
          widget.onSuccess!();
        } else {
          Navigator.pop(context, true);
        }
      }
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Widget _buildPhoneInput() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('Enter your phone', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 8),
        Text('We\'ll send you an OTP to verify', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.grey[600])),
        const SizedBox(height: 32),
        TextField(
          controller: _phoneController,
          keyboardType: TextInputType.phone,
          decoration: InputDecoration(
            labelText: 'Phone number',
            hintText: '9876543210',
            prefixText: '+91 ',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            prefixIcon: const Icon(Icons.phone_android),
          ),
          onSubmitted: (_) => _sendOtp(),
        ),
        const SizedBox(height: 20),
        SizedBox(
          height: 52,
          child: FilledButton(
            onPressed: _loading ? null : _sendOtp,
            style: FilledButton.styleFrom(backgroundColor: KathaColors.gold),
            child: _loading
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Send OTP'),
          ),
        ),
      ],
    );
  }

  Widget _buildOTPInput() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('Enter OTP', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 8),
        Text('We sent a code to +91${_phoneController.text.replaceAll('+91', '')}', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.grey[600])),
        const SizedBox(height: 32),
        TextField(
          controller: _otpController,
          keyboardType: TextInputType.number,
          maxLength: 6,
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 22, letterSpacing: 10, fontWeight: FontWeight.w600),
          decoration: InputDecoration(
            labelText: '6-digit OTP',
            counterText: '',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
          onSubmitted: (_) => _verify(),
        ),
        if (_hint != null) ...[
          const SizedBox(height: 8),
          Text(_hint!, style: Theme.of(context).textTheme.labelMedium?.copyWith(color: KathaColors.goldDark), textAlign: TextAlign.center),
        ],
        const SizedBox(height: 16),
        SizedBox(
          height: 52,
          child: FilledButton(
            onPressed: _loading ? null : _verify,
            style: FilledButton.styleFrom(backgroundColor: KathaColors.gold),
            child: _loading ? const Text('Verifying...') : const Text('Verify & Continue'),
          ),
        ),
        const SizedBox(height: 12),
        if (_resendSeconds > 0)
          Center(child: Text('Resend OTP in ${_resendSeconds}s', style: TextStyle(color: Colors.grey[600])))
        else
          TextButton(
            onPressed: _loading ? null : () => _sendOtp(isResend: true),
            child: const Text('Didn\'t receive? Resend OTP'),
          ),
        TextButton(
          onPressed: () => setState(() { _otpSent = false; _error = null; _otpController.clear(); }),
          child: const Text('Change phone number'),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  IconButton(onPressed: () => Navigator.maybePop(context), icon: const Icon(Icons.close)),
                  const Spacer(),
                ],
              ),
              const Spacer(),
              Text('కథ', style: Theme.of(context).textTheme.displayLarge?.copyWith(
                    foreground: Paint()..shader = const LinearGradient(colors: [KathaColors.gold, KathaColors.ember]).createShader(const Rect.fromLTWH(0, 0, 80, 40)),
                  )).animate().fadeIn(),
              const SizedBox(height: 8),
              Text('Sign in to continue reading', style: Theme.of(context).textTheme.bodyMedium).animate().fadeIn(delay: 80.ms),
              const SizedBox(height: 36),
              if (!_otpSent) _buildPhoneInput() else _buildOTPInput(),
              if (_error != null) ...[
                const SizedBox(height: 18),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(8)),
                  child: Text(_error!, style: TextStyle(color: Colors.red.shade800), textAlign: TextAlign.center),
                ),
              ],
              const Spacer(flex: 2),
              Text('By continuing you agree to our Terms & Privacy', style: Theme.of(context).textTheme.labelSmall?.copyWith(color: Colors.grey[500]), textAlign: TextAlign.center),
            ],
          ),
        ),
      ),
    );
  }
}