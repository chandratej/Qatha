import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:dartz/dartz.dart';
import '../../../../core/errors/failures.dart';
import '../../../domain/entities/user.dart';
import '../../../domain/repositories/user_repository.dart';
import '../datasources/auth_remote_data_source.dart';
import '../datasources/auth_local_data_source.dart';
import '../models/user_model.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource remoteDataSource;
  final AuthLocalDataSource localDataSource;
  final FirebaseAuth firebaseAuth;
  final FirebaseFirestore firestore;

  AuthRepositoryImpl({
    required this.remoteDataSource,
    required this.localDataSource,
    required this.firebaseAuth,
    required this.firestore,
  });

  @override
  Future<Either<Failure, User>> signInWithEmail(String email, String password) async {
    try {
      final result = await remoteDataSource.signInWithEmail(email, password);
      
      // Fetch or create user profile
      final userDoc = await firestore.collection('users').doc(result.uid).get();
      
      if (!userDoc.exists) {
        // Create new user profile
        final newUser = UserModel.fromUser(result);
        await firestore.collection('users').doc(result.uid).set(newUser.toMap());
        await localDataSource.cacheUser(newUser);
        return Right(newUser);
      } else {
        final existingUser = UserModel.fromFirestore(userDoc);
        await localDataSource.cacheUser(existingUser);
        return Right(existingUser);
      }
    } on FirebaseException catch (e) {
      return Left(AuthFailure(e.message ?? 'Authentication failed'));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, User>> signUpWithEmail(String email, String password, String displayName) async {
    try {
      final result = await remoteDataSource.signUpWithEmail(email, password);
      
      // Create user profile
      final newUser = UserModel.fromUser(result).copyWith(
        displayName: displayName,
      );
      
      await firestore.collection('users').doc(result.uid).set(newUser.toMap());
      await localDataSource.cacheUser(newUser);
      
      return Right(newUser);
    } on FirebaseException catch (e) {
      return Left(AuthFailure(e.message ?? 'Registration failed'));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, User>> signInWithGoogle() async {
    try {
      final result = await remoteDataSource.signInWithGoogle();
      
      if (result == null) {
        return Left(AuthFailure('Google sign in cancelled'));
      }
      
      final userDoc = await firestore.collection('users').doc(result.uid).get();
      
      if (!userDoc.exists) {
        final newUser = UserModel.fromUser(result);
        await firestore.collection('users').doc(result.uid).set(newUser.toMap());
        await localDataSource.cacheUser(newUser);
        return Right(newUser);
      } else {
        final existingUser = UserModel.fromFirestore(userDoc);
        await localDataSource.cacheUser(existingUser);
        return Right(existingUser);
      }
    } on FirebaseException catch (e) {
      return Left(AuthFailure(e.message ?? 'Google sign in failed'));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, User>> signInWithApple() async {
    try {
      final result = await remoteDataSource.signInWithApple();
      
      if (result == null) {
        return Left(AuthFailure('Apple sign in cancelled'));
      }
      
      final userDoc = await firestore.collection('users').doc(result.uid).get();
      
      if (!userDoc.exists) {
        final newUser = UserModel.fromUser(result);
        await firestore.collection('users').doc(result.uid).set(newUser.toMap());
        await localDataSource.cacheUser(newUser);
        return Right(newUser);
      } else {
        final existingUser = UserModel.fromFirestore(userDoc);
        await localDataSource.cacheUser(existingUser);
        return Right(existingUser);
      }
    } on FirebaseException catch (e) {
      return Left(AuthFailure(e.message ?? 'Apple sign in failed'));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> signOut() async {
    try {
      await remoteDataSource.signOut();
      await localDataSource.clearCache();
      return const Right(null);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, User?>> getCurrentUser() async {
    try {
      final cachedUser = await localDataSource.getCachedUser();
      if (cachedUser != null) {
        return Right(cachedUser);
      }
      
      final currentUser = firebaseAuth.currentUser;
      if (currentUser == null) {
        return const Right(null);
      }
      
      final userDoc = await firestore.collection('users').doc(currentUser.uid).get();
      
      if (!userDoc.exists) {
        return const Right(null);
      }
      
      final user = UserModel.fromFirestore(userDoc);
      await localDataSource.cacheUser(user);
      
      return Right(user);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> sendPasswordResetEmail(String email) async {
    try {
      await remoteDataSource.sendPasswordResetEmail(email);
      return const Right(null);
    } on FirebaseException catch (e) {
      return Left(AuthFailure(e.message ?? 'Failed to send reset email'));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> updateProfile({
    String? displayName,
    String? photoUrl,
  }) async {
    try {
      final currentUser = firebaseAuth.currentUser;
      if (currentUser == null) {
        return Left(AuthFailure('No user logged in'));
      }
      
      await remoteDataSource.updateProfile(
        displayName: displayName,
        photoUrl: photoUrl,
      );
      
      // Update Firestore
      final updates = <String, dynamic>{};
      if (displayName != null) updates['displayName'] = displayName;
      if (photoUrl != null) updates['photoUrl'] = photoUrl;
      
      if (updates.isNotEmpty) {
        await firestore.collection('users').doc(currentUser.uid).update(updates);
      }
      
      // Update cache
      final cachedUser = await localDataSource.getCachedUser();
      if (cachedUser != null) {
        final updatedUser = cachedUser.copyWith(
          displayName: displayName ?? cachedUser.displayName,
          photoUrl: photoUrl ?? cachedUser.photoUrl,
        );
        await localDataSource.cacheUser(updatedUser);
      }
      
      return const Right(null);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Stream<User?> get authStateChanges => 
      firebaseAuth.authStateChanges().asyncMap((firebaseUser) async {
        if (firebaseUser == null) return null;
        
        final userDoc = await firestore.collection('users').doc(firebaseUser.uid).get();
        if (!userDoc.exists) return null;
        
        return UserModel.fromFirestore(userDoc);
      });
}
