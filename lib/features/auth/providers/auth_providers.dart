import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:storyverse/domain/repositories/auth_repository.dart';
import 'package:storyverse/core/di/dependency_injection.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) => sl<AuthRepository>());

final authStateProvider = StreamProvider((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return repository.authState;
});

final loginProvider = FutureProvider.family<void, ({String email, String password})>((ref, params) async {
  final repository = ref.watch(authRepositoryProvider);
  await repository.signInWithEmailAndPassword(email: params.email, password: params.password);
});

final signupProvider = FutureProvider.family<void, ({String email, String password, String? displayName})>((ref, params) async {
  final repository = ref.watch(authRepositoryProvider);
  await repository.signUpWithEmailAndPassword(
    email: params.email,
    password: params.password,
    displayName: params.displayName,
  );
});

final googleSignInProvider = FutureProvider<void>((ref) async {
  final repository = ref.watch(authRepositoryProvider);
  await repository.signInWithGoogle();
});

final appleSignInProvider = FutureProvider<void>((ref) async {
  final repository = ref.watch(authRepositoryProvider);
  await repository.signInWithApple();
});

final anonymousSignInProvider = FutureProvider<void>((ref) async {
  final repository = ref.watch(authRepositoryProvider);
  await repository.signInAnonymously();
});

final signOutProvider = FutureProvider<void>((ref) async {
  final repository = ref.watch(authRepositoryProvider);
  await repository.signOut();
});

final resetPasswordProvider = FutureProvider.family<void, String>((ref, email) async {
  final repository = ref.watch(authRepositoryProvider);
  await repository.sendPasswordResetEmail(email: email);
});

final currentUserProvider = StreamProvider((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return repository.currentUserStream;
});
