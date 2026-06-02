import 'package:flutter/material.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _isLoading = false;
  bool _emailSent = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _handleReset() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    // TODO: Implement password reset logic
    await Future.delayed(const Duration(seconds: 1));

    if (mounted) {
      setState(() => _emailSent = true);
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Reset Password')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: _emailSent
              ? Column(
                  children: [
                    const Icon(Icons.email_outlined, size: 80, color: Colors.green),
                    const SizedBox(height: 24),
                    Text('Check Your Email', style: Theme.of(context).textTheme.headlineSmall),
                    const SizedBox(height: 16),
                    Text(
                      'We\'ve sent password reset instructions to ${_emailController.text}',
                      style: Theme.of(context).textTheme.bodyLarge,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Back to Login'),
                      ),
                    ),
                  ],
                )
              : Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const SizedBox(height: 32),
                      Text('Forgot Password?', style: Theme.of(context).textTheme.headlineMedium),
                      const SizedBox(height: 8),
                      Text('Enter your email and we\'ll send you reset instructions', style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: Colors.grey)),
                      const SizedBox(height: 48),
                      TextFormField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        decoration: const InputDecoration(
                          labelText: 'Email',
                          prefixIcon: Icon(Icons.email_outlined),
                          border: OutlineInputBorder(),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) return 'Please enter your email';
                          if (!value.contains('@')) return 'Please enter a valid email';
                          return null;
                        },
                      ),
                      const SizedBox(height: 32),
                      ElevatedButton(
                        onPressed: _isLoading ? null : _handleReset,
                        style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 56)),
                        child: _isLoading ? const CircularProgressIndicator() : const Text('Send Reset Link'),
                      ),
                      const SizedBox(height: 16),
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Back to Login'),
                      ),
                    ],
                  ),
                ),
        ),
      ),
    );
  }
}
