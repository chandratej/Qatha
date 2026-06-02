import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:storyverse/core/routes/app_routes.dart';
import 'package:storyverse/features/auth/providers/auth_providers.dart';

class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({super.key});

  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _handleSignup() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      await ref.read(signupProvider((
        email: _emailController.text.trim(),
        password: _passwordController.text,
        displayName: _nameController.text.trim().isEmpty ? null : _nameController.text.trim(),
      )));
      if (mounted) context.go(AppRoutes.home);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Sign up failed: ${e.toString()}'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create Account')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 32),
                Text('Join StoryVerse', style: Theme.of(context).textTheme.headlineMedium),
                const SizedBox(height: 8),
                Text('Start your literary journey', style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: Colors.grey)),
                const SizedBox(height: 48),
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    labelText: 'Display Name (Optional)',
                    prefixIcon: Icon(Icons.person_outlined),
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),
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
                const SizedBox(height: 16),
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  decoration: InputDecoration(
                    labelText: 'Password',
                    prefixIcon: const Icon(Icons.lock_outlined),
                    border: const OutlineInputBorder(),
                    suffixIcon: IconButton(
                      icon: Icon(_obscurePassword ? Icons.visibility_off : Icons.visibility),
                      onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) return 'Please enter your password';
                    if (value.length < 8) return 'Password must be at least 8 characters';
                    return null;
                  },
                ),
                const SizedBox(height: 32),
                ElevatedButton(
                  onPressed: _isLoading ? null : _handleSignup,
                  style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 56)),
                  child: _isLoading ? const CircularProgressIndicator() : const Text('Create Account'),
                ),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: () => context.pop(),
                  child: const Text('Already have an account? Sign In'),
                ),
                const Divider(height: 32),
                OutlinedButton.icon(
                  onPressed: () async {
                    try {
                      await ref.read(googleSignInProvider);
                      if (mounted) context.go(AppRoutes.home);
                    } catch (e) {
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Google sign-in failed: ${e.toString()}'), backgroundColor: Colors.red),
                        );
                      }
                    }
                  },
                  icon: const Icon(Icons.login),
                  label: const Text('Continue with Google'),
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: () async {
                    try {
                      await ref.read(appleSignInProvider);
                      if (mounted) context.go(AppRoutes.home);
                    } catch (e) {
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Apple sign-in failed: ${e.toString()}'), backgroundColor: Colors.red),
                        );
                      }
                    }
                  },
                  icon: const Icon(Icons.apple),
                  label: const Text('Continue with Apple'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
