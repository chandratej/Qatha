import 'package:flutter/widgets.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';

/// True when decorative animation should be skipped — either the OS
/// accessibility setting (reduce motion) or Katha's in-app calm-motion
/// comfort toggle. Subscribes to AppState so a toggle takes effect live.
bool reduceMotion(BuildContext context) {
  final osReduced = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
  bool calm;
  try {
    calm = context.select<AppState, bool>((appState) => appState.calmMotion);
  } on ProviderNotFoundException {
    // Widget rendered outside the app scaffold (tests, previews) — the
    // OS accessibility setting still applies.
    calm = false;
  }
  return osReduced || calm;
}

extension CalmMotionX on Widget {
  /// Apply a decorative entrance effect unless motion is reduced.
  /// Usage: `widget.withEntrance(context, (w) => w.animate().fadeIn())`.
  Widget withEntrance(BuildContext context, Widget Function(Widget) effect) =>
      reduceMotion(context) ? this : effect(this);
}
