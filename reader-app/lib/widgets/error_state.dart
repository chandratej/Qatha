import 'package:flutter/material.dart';
import '../core/theme/katha_theme.dart';
import '../l10n/generated/app_localizations.dart';

class ErrorState extends StatelessWidget {
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;
  final VoidCallback? onRetry;
  final List<int>? offlineChapters;
  /// When set, offline chapter numbers become tappable.
  final ValueChanged<int>? onOpenOfflineChapter;

  const ErrorState({
    super.key,
    required this.message,
    this.actionLabel,
    this.onAction,
    this.onRetry,
    this.offlineChapters,
    this.onOpenOfflineChapter,
  });

  @override
  Widget build(BuildContext context) {
    // Safe for nested Scaffold, IndexedStack, TabBarView, and Flutter web.
    // Never force MediaQuery full-screen height (overflows under bottom nav).
    return LayoutBuilder(
      builder: (context, constraints) {
        final l10n = AppLocalizations.of(context)!;
        final hasBoundedH =
            constraints.hasBoundedHeight && constraints.maxHeight.isFinite;
        final hasBoundedW =
            constraints.hasBoundedWidth && constraints.maxWidth.isFinite;

        final content = Padding(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.cloud_off_rounded,
                  size: 56,
                  color: KathaTheme.mutedInk(context).withValues(alpha: 0.5),
                ),
                const SizedBox(height: 20),
                Text(
                  message,
                  style: Theme.of(context).textTheme.bodyLarge,
                  textAlign: TextAlign.center,
                ),
                if (offlineChapters != null && offlineChapters!.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Text(
                    l10n.errorAvailableOffline,
                    style: Theme.of(context).textTheme.labelMedium,
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    alignment: WrapAlignment.center,
                    children: offlineChapters!.map((n) {
                      final label = onOpenOfflineChapter != null
                          ? l10n.readerOpenOfflineChapter(n)
                          : l10n.errorChapterNumber(n);
                      if (onOpenOfflineChapter == null) {
                        return Text(
                          l10n.errorChapterNumber(n),
                          style: Theme.of(context).textTheme.bodyMedium,
                        );
                      }
                      return ActionChip(
                        label: Text(label),
                        onPressed: () => onOpenOfflineChapter!(n),
                        backgroundColor: KathaColors.gold.withValues(alpha: 0.15),
                      );
                    }).toList(),
                  ),
                ],
                const SizedBox(height: 24),
                Wrap(
                  alignment: WrapAlignment.center,
                  spacing: 12,
                  runSpacing: 8,
                  children: [
                    if (onRetry != null)
                      FilledButton(
                        onPressed: onRetry,
                        child: Text(l10n.errorRetry),
                      ),
                    if (onAction != null && actionLabel != null)
                      OutlinedButton(
                        onPressed: onAction,
                        child: Text(actionLabel!),
                      ),
                  ],
                ),
              ],
            ),
          ),
        );

        if (!hasBoundedH || !hasBoundedW) {
          return Align(
            alignment: Alignment.topCenter,
            child: SingleChildScrollView(child: content),
          );
        }

        return SizedBox(
          width: constraints.maxWidth,
          height: constraints.maxHeight,
          child: SingleChildScrollView(
            child: ConstrainedBox(
              constraints: BoxConstraints(
                minHeight: constraints.maxHeight,
                minWidth: constraints.maxWidth,
              ),
              child: Center(child: content),
            ),
          ),
        );
      },
    );
  }
}
