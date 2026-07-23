/// Tracks elapsed in-session reading time for the opt-in eye-break reminder
/// (§2.5) — a process-lifetime singleton (not per-screen state) so the clock
/// survives chapter-to-chapter navigation, which recreates ReaderScreen.
class ReadingSessionService {
  ReadingSessionService._();
  static final ReadingSessionService instance = ReadingSessionService._();

  DateTime _windowStart = DateTime.now();

  int elapsedMinutes() => DateTime.now().difference(_windowStart).inMinutes;

  /// Call after showing (or explicitly skipping) the reminder so the next
  /// one is measured from here, not from app/session start.
  void resetWindow() => _windowStart = DateTime.now();
}
