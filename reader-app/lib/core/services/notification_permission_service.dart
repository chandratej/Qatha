import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import '../providers/app_state.dart';
import '../../l10n/generated/app_localizations.dart';
import '../theme/katha_theme.dart';

/// Deferred notification-permission timing (§2.3). Never requested at first
/// launch — only the first time the reader completes their first free story
/// arc (proxied here by reaching the paywall, since that only happens once a
/// reader has read through their entire free sample) or follows an author.
///
/// The "follows an author" trigger from the spec is not wired yet: no follow
/// feature exists anywhere in this app or the backend as of this build — see
/// katha-reader-app-completion-and-beautification-prompt.md §2.3. This only
/// implements the free-sample-completion trigger; wire the follow trigger in
/// alongside whenever a follow-an-author feature is actually built.
class NotificationPermissionService {
  NotificationPermissionService._();
  static final instance = NotificationPermissionService._();

  /// Shows a one-time explainer, then the OS prompt if the reader accepts.
  /// No-op if already shown once (in this app session or a prior one) —
  /// never re-prompts, denied or not.
  Future<void> maybeRequestOnFirstFreeArcComplete(
    BuildContext context,
    AppState appState,
  ) async {
    if (appState.notificationPromptShown) return;
    if (!context.mounted) return;

    final l10n = AppLocalizations.of(context)!;
    final accepted = await showModalBottomSheet<bool>(
          context: context,
          backgroundColor: Colors.transparent,
          builder: (sheetCtx) => _ExplainerSheet(
            title: l10n.notificationPermissionTitle,
            body: l10n.notificationArcCompletePrompt,
          ),
        ) ??
        false;

    // Shown once, regardless of the reader's choice — this satisfies "never
    // re-prompt aggressively" even for "not now" (Settings carries a single
    // gentle reminder instead, see settings_screen.dart).
    appState.markNotificationPromptShown();

    if (accepted) {
      await Permission.notification.request();
    }
  }

  Future<PermissionStatus> status() => Permission.notification.status;

  Future<void> openSettings() => openAppSettings();
}

class _ExplainerSheet extends StatelessWidget {
  final String title;
  final String body;

  const _ExplainerSheet({required this.title, required this.body});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return SafeArea(
      child: Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: isDark ? KathaColors.darkElevated : Colors.white,
          borderRadius: BorderRadius.circular(24),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Icon(
              Icons.notifications_active_outlined,
              color: KathaColors.gold,
              size: 32,
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: Theme.of(context).textTheme.titleLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              body,
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context, false),
                    child: Text(l10n.buttonNotNow),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: KathaColors.gold,
                      foregroundColor: Colors.white,
                    ),
                    onPressed: () => Navigator.pop(context, true),
                    child: Text(l10n.buttonAllow),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
