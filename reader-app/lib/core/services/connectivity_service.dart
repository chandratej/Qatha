import 'package:connectivity_plus/connectivity_plus.dart';

/// Lightweight connectivity helper with tiny memoization to avoid repeated native calls during prefetch/scroll.
class ConnectivityService {
  final _connectivity = Connectivity();
  bool? _lastHasConn;
  DateTime _lastCheck = DateTime.fromMillisecondsSinceEpoch(0);

  Future<bool> isOnWifi() async {
    final results = await _connectivity.checkConnectivity();
    return results.contains(ConnectivityResult.wifi);
  }

  Future<bool> hasConnection() async {
    final now = DateTime.now();
    if (_lastHasConn != null && now.difference(_lastCheck).inSeconds < 8) {
      return _lastHasConn!;
    }
    final results = await _connectivity.checkConnectivity();
    _lastHasConn = !results.contains(ConnectivityResult.none);
    _lastCheck = now;
    return _lastHasConn!;
  }
}
