import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:crypto/crypto.dart';
import 'dart:convert';
import 'dart:math';

abstract class AuthRemoteDataSource {
  Future<User> signInWithEmail(String email, String password);
  Future<User> signUpWithEmail(String email, String password);
  Future<User?> signInWithGoogle();
  Future<User?> signInWithApple();
  Future<void> signOut();
  Future<void> sendPasswordResetEmail(String email);
  Future<void> updateProfile({String? displayName, String? photoUrl});
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final FirebaseAuth firebaseAuth;
  final GoogleSignIn googleSignIn;

  AuthRemoteDataSourceImpl({
    required this.firebaseAuth,
    required this.googleSignIn,
  });

  @override
  Future<User> signInWithEmail(String email, String password) async {
    final credential = EmailAuthProvider.credential(
      email: email,
      password: password,
    );
    
    final result = await firebaseAuth.signInWithCredential(credential);
    return result.user!;
  }

  @override
  Future<User> signUpWithEmail(String email, String password) async {
    final credential = EmailAuthProvider.credential(
      email: email,
      password: password,
    );
    
    final result = await firebaseAuth.createUserAndRetrieveData(credential);
    return result.user!;
  }

  @override
  Future<User?> signInWithGoogle() async {
    try {
      final GoogleSignInAccount? googleUser = await googleSignIn.signIn();
      
      if (googleUser == null) {
        return null;
      }
      
      final GoogleSignInAuthentication googleAuth = 
          await googleUser.authentication;
      
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );
      
      final result = await firebaseAuth.signInWithCredential(credential);
      return result.user;
    } catch (e) {
      rethrow;
    }
  }

  @override
  Future<User?> signInWithApple() async {
    try {
      // Only available on iOS/macOS
      final rawNonce = _generateNonce();
      final nonce = sha256ofString(rawNonce);
      
      final appleCredential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
        nonce: nonce,
      );
      
      final oauthCredential = OAuthProvider("apple.com").credential(
        idToken: appleCredential.identityToken,
        rawNonce: rawNonce,
      );
      
      final result = await firebaseAuth.signInWithCredential(oauthCredential);
      return result.user;
    } catch (e) {
      // Apple Sign In not available on this platform
      return null;
    }
  }

  @override
  Future<void> signOut() async {
    await Future.wait([
      firebaseAuth.signOut(),
      googleSignIn.signOut(),
    ]);
  }

  @override
  Future<void> sendPasswordResetEmail(String email) async {
    await firebaseAuth.sendPasswordResetEmail(email: email);
  }

  @override
  Future<void> updateProfile({String? displayName, String? photoUrl}) async {
    final user = firebaseAuth.currentUser;
    if (user == null) {
      throw Exception('No user logged in');
    }
    
    await user.updateProfile(
      displayName: displayName ?? user.displayName,
      photoURL: photoUrl ?? user.photoURL,
    );
  }

  String _generateNonce([int length = 32]) {
    final charset = 
        '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._';
    final random = Random.secure();
    return List.generate(length, (_) => charset[random.nextInt(charset.length)])
        .join();
  }

  String sha256ofString(String input) {
    final bytes = utf8.encode(input);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }
}

extension on FirebaseAuth {
  Future<UserCredential> createUserAndRetrieveData(Credential credential) async {
    final result = await createUserWithCredential(credential);
    return result;
  }
}
