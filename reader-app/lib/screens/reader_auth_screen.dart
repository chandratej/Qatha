import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../core/providers/auth_state.dart' show AuthState, AuthUser;
import '../core/services/auth_service.dart';
import '../core/theme/katha_theme.dart';
import '../core/utils/motion.dart';

/// Cascading Auth Gate for readers: Google (primary) → email magic link (fallback).
/// Phone OTP is not offered here — reserved for Creator CMS payout/KYC verification.
class ReaderAuthScreen extends StatefulWidget {
  final VoidCallback? onSuccess;

  const ReaderAuthScreen({super.key, this.onSuccess});

  @override
  State<ReaderAuthScreen> createState() => _ReaderAuthScreenState();
}

class _ReaderAuthScreenState extends State<ReaderAuthScreen> {
  final _auth = AuthService();
  final _emailController = TextEditingController();
  final _otpController = TextEditingController();

  bool _loading = false;
  bool _emailStep = false;
  bool _emailSent = false;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _completeSession(({AuthUser user, String accessToken}) result) async {
    final authState = context.read<AuthState>();
    await authState.setSession(result.user, result.accessToken);

    if (!mounted) return;

    if (result.user.launchTrialGranted && result.user.launchTrialDays != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Welcome! ${result.user.launchTrialDays}-day unlimited reading unlocked.',
          ),
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

  Future<void> _signInWithGoogle() async {
    setState(() { _loading = true; _error = null; });
    try {
      final result = await _auth.signInWithGoogle();
      await _completeSession(result);
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _sendEmailLink() async {
    setState(() { _loading = true; _error = null; });
    try {
      await _auth.sendEmailMagicLink(_emailController.text.trim());
      setState(() => _emailSent = true);
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _verifyEmailOtp() async {
    setState(() { _loading = true; _error = null; });
    try {
      final result = await _auth.verifyEmailOtp(
        _emailController.text.trim(),
        _otpController.text.trim(),
      );
      await _completeSession(result);
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Widget _buildGooglePrimary() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          height: 52,
          child: FilledButton.icon(
            onPressed: _loading ? null : _signInWithGoogle,
            icon: const Icon(Icons.g_mobiledata, size: 28),
            label: const Text('Continue with Google'),
            style: FilledButton.styleFrom(backgroundColor: KathaColors.gold),
          ),
        ),
        const SizedBox(height: 16),
        OutlinedButton(
          onPressed: _loading ? null : () => setState(() { _emailStep = true; _error = null; }),
          child: const Text('Continue with email'),
        ),
      ],
    );
  }

  Widget _buildEmailFallback() {
    if (!_emailSent) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Sign in with email', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text(
            'We\'ll send a one-time code to your inbox',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
          ),
          const SizedBox(height: 24),
          TextField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            autocorrect: false,
            decoration: InputDecoration(
              labelText: 'Email address',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              prefixIcon: const Icon(Icons.email_outlined),
            ),
            onSubmitted: (_) => _sendEmailLink(),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 52,
            child: FilledButton(
              onPressed: _loading ? null : _sendEmailLink,
              style: FilledButton.styleFrom(backgroundColor: KathaColors.gold),
              child: _loading ? const Text('Sending…') : const Text('Send sign-in code'),
            ),
          ),
          TextButton(
            onPressed: () => setState(() { _emailStep = false; _error = null; }),
            child: const Text('Back to Google sign-in'),
          ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('Check your email', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 8),
        Text(
          'Enter the code sent to ${_emailController.text.trim()}',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
        ),
        const SizedBox(height: 24),
        TextField(
          controller: _otpController,
          keyboardType: TextInputType.number,
          maxLength: 8,
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 20, letterSpacing: 6, fontWeight: FontWeight.w600),
          decoration: InputDecoration(
            labelText: 'Sign-in code',
            counterText: '',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
          onSubmitted: (_) => _verifyEmailOtp(),
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 52,
          child: FilledButton(
            onPressed: _loading ? null : _verifyEmailOtp,
            style: FilledButton.styleFrom(backgroundColor: KathaColors.gold),
            child: _loading ? const Text('Verifying…') : const Text('Verify & Continue'),
          ),
        ),
        TextButton(
          onPressed: _loading ? null : _sendEmailLink,
          child: const Text('Resend code'),
        ),
        TextButton(
          onPressed: () => setState(() { _emailSent = false; _otpController.clear(); _error = null; }),
          child: const Text('Use a different email'),
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
                  IconButton(
                    onPressed: () => Navigator.maybePop(context),
                    icon: const Icon(Icons.close),
                  ),
                  const Spacer(),
                ],
              ),
              const Spacer(),
              Text(
                'కథ',
                style: Theme.of(context).textTheme.displayLarge?.copyWith(
                  foreground: Paint()
                    ..shader = const LinearGradient(
                      colors: [KathaColors.gold, KathaColors.ember],
                    ).createShader(const Rect.fromLTWH(0, 0, 80, 40)),
                ),
              ).withEntrance(context, (w) => w.animate().fadeIn()),
              const SizedBox(height: 8),
              Text(
                'Sign in to continue reading',
                style: Theme.of(context).textTheme.bodyMedium,
              ).withEntrance(context, (w) => w.animate().fadeIn(delay: 80.ms)),
              const SizedBox(height: 36),
              if (_emailStep) _buildEmailFallback() else _buildGooglePrimary(),
              if (_error != null) ...[
                const SizedBox(height: 18),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _error!,
                    style: TextStyle(color: Colors.red.shade800),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
              const Spacer(flex: 2),
              Text(
                'Creators verify phone separately in Creator Studio for payouts.',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(color: Colors.grey[500]),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'By continuing you agree to our Terms & Privacy',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(color: Colors.grey[500]),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}