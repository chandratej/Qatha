import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/config/app_config.dart';
import '../core/providers/auth_state.dart' show AuthState, AuthUser;
import '../core/services/auth_service.dart';
import '../core/theme/katha_theme.dart';
import '../core/utils/motion.dart';
import '../l10n/generated/app_localizations.dart';

/// Cascading Auth Gate for readers: Google (primary when configured) → email magic link.
/// If `GOOGLE_WEB_CLIENT_ID` is missing from the build, email is primary so first-time
/// signup still fulfills “sign in to continue reading.”
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
  /// Prefer email when Google Web Client ID was not baked into this build.
  late bool _emailStep = !AppConfig.googleSignInConfigured;
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
            AppLocalizations.of(context)!
                .readerAuthWelcomeTrial(result.user.launchTrialDays!),
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
    if (!AppConfig.googleSignInConfigured) {
      setState(() {
        _emailStep = true;
        _error = AppLocalizations.of(context)!.readerAuthGoogleUnavailable;
      });
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      final result = await _auth.signInWithGoogle();
      await _completeSession(result);
    } catch (e) {
      final raw = e.toString().replaceFirst('Exception: ', '');
      final missingGoogle = raw.contains('GOOGLE_WEB_CLIENT_ID_MISSING') ||
          raw.contains('no ID token') ||
          raw.contains('GOOGLE_WEB_CLIENT_ID');
      if (!mounted) return;
      if (missingGoogle) {
        setState(() {
          _emailStep = true;
          _error = AppLocalizations.of(context)!.readerAuthGoogleFailedUseEmail;
          _loading = false;
        });
        return;
      }
      setState(() => _error = raw);
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
    final l10n = AppLocalizations.of(context)!;
    final googleReady = AppConfig.googleSignInConfigured;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (googleReady) ...[
          SizedBox(
            height: 52,
            child: FilledButton.icon(
              onPressed: _loading ? null : _signInWithGoogle,
              icon: const Icon(Icons.g_mobiledata, size: 28),
              label: Text(l10n.buttonSignInWithGoogle),
              style: FilledButton.styleFrom(backgroundColor: KathaColors.gold),
            ),
          ),
          const SizedBox(height: 16),
          OutlinedButton(
            onPressed: _loading
                ? null
                : () => setState(() {
                      _emailStep = true;
                      _error = null;
                    }),
            child: Text(l10n.buttonContinueWithEmail),
          ),
        ] else ...[
          SizedBox(
            height: 52,
            child: FilledButton.icon(
              onPressed: _loading
                  ? null
                  : () => setState(() {
                        _emailStep = true;
                        _error = null;
                      }),
              icon: const Icon(Icons.email_outlined, size: 22),
              label: Text(l10n.buttonContinueWithEmail),
              style: FilledButton.styleFrom(backgroundColor: KathaColors.gold),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            l10n.readerAuthGoogleUnavailable,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.grey[600],
                ),
            textAlign: TextAlign.center,
          ),
        ],
      ],
    );
  }

  Widget _buildEmailFallback() {
    final l10n = AppLocalizations.of(context)!;
    if (!_emailSent) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(l10n.readerAuthEmailHeadline, style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text(
            l10n.readerAuthEmailSubheadline,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
          ),
          const SizedBox(height: 24),
          TextField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            autocorrect: false,
            decoration: InputDecoration(
              labelText: l10n.readerAuthEmailLabel,
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
              child: Text(_loading ? l10n.buttonSending : l10n.buttonSendSignInCode),
            ),
          ),
          if (AppConfig.googleSignInConfigured)
            TextButton(
              onPressed: () => setState(() {
                _emailStep = false;
                _error = null;
              }),
              child: Text(l10n.buttonBackToGoogleSignIn),
            ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(l10n.readerAuthCheckEmailHeadline, style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 8),
        Text(
          l10n.readerAuthCodeSentTo(_emailController.text.trim()),
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
            labelText: l10n.readerAuthSignInCodeLabel,
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
            child: Text(_loading ? l10n.buttonVerifying : l10n.buttonVerifyAndContinue),
          ),
        ),
        TextButton(
          onPressed: _loading ? null : _sendEmailLink,
          child: Text(l10n.buttonResendCode),
        ),
        TextButton(
          onPressed: () => setState(() { _emailSent = false; _otpController.clear(); _error = null; }),
          child: Text(l10n.buttonUseDifferentEmail),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
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
                l10n.readerAuthSubtitle,
                style: Theme.of(context).textTheme.bodyMedium,
              ).withEntrance(context, (w) => w.animate().fadeIn(delay: 80.ms)),
              const SizedBox(height: 10),
              Text(
                l10n.readerAuthPromiseNote,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey[600],
                      height: 1.35,
                    ),
              ).withEntrance(context, (w) => w.animate().fadeIn(delay: 100.ms)),
              const SizedBox(height: 28),
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
                l10n.readerAuthCreatorNote,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(color: Colors.grey[500]),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text.rich(
                TextSpan(
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(color: Colors.grey[500]),
                  children: [
                    const TextSpan(text: 'By continuing you agree to our '),
                    TextSpan(
                      text: 'Terms',
                      style: TextStyle(
                        color: KathaColors.gold,
                        decoration: TextDecoration.underline,
                      ),
                      recognizer: TapGestureRecognizer()
                        ..onTap = () => launchUrl(
                              Uri.parse(AppConfig.termsUrl),
                              mode: LaunchMode.externalApplication,
                            ),
                    ),
                    const TextSpan(text: ' & '),
                    TextSpan(
                      text: 'Privacy',
                      style: TextStyle(
                        color: KathaColors.gold,
                        decoration: TextDecoration.underline,
                      ),
                      recognizer: TapGestureRecognizer()
                        ..onTap = () => launchUrl(
                              Uri.parse(AppConfig.privacyUrl),
                              mode: LaunchMode.externalApplication,
                            ),
                    ),
                  ],
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}