import 'package:equatable/equatable.dart';

/// Base class for all failures in the application
abstract class Failure extends Equatable {
  final String message;
  final int? code;

  const Failure({required this.message, this.code});

  @override
  List<Object?> get props => [message, code];
}

/// Authentication failures
class AuthFailure extends Failure {
  const AuthFailure({required super.message, super.code});
}

class ServerFailure extends Failure {
  const ServerFailure({required super.message, super.code});
}

class CacheFailure extends Failure {
  const CacheFailure({required super.message, super.code});
}

class NetworkFailure extends Failure {
  const NetworkFailure({required super.message, super.code = -1});
}

class ValidationFailure extends Failure {
  const ValidationFailure({required super.message, super.code});
}

class PaymentFailure extends Failure {
  const PaymentFailure({required super.message, super.code});
}

class PermissionFailure extends Failure {
  const PermissionFailure({required super.message, super.code});
}
