import 'package:flutter/material.dart';
import '../core/theme/katha_theme.dart';

class ErrorState extends StatelessWidget {
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;
  final VoidCallback? onRetry;
  final List<int>? offlineChapters;

  const ErrorState({
    super.key,
    required this.message,
    this.actionLabel,
    this.onAction,
    this.onRetry,
    this.offlineChapters,
  });

  @override
  Widget build(BuildContext context) {
    // Safe for nested Scaffold, IndexedStack, TabBarView, and Flutter web.
    // Never force MediaQuery full-screen height (overflows under bottom nav).
    return LayoutBuilder(
      builder: (context, constraints) {
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
                  color: KathaColors.inkMuted.withValues(alpha: 0.5),
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
                    'Available offline:',
                    style: Theme.of(context).textTheme.labelMedium,
                  ),
                  const SizedBox(height: 8),
                  ...offlineChapters!.map(
                    (n) => Text(
                      'Chapter $n',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
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
                        child: const Text('Retry'),
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
