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
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.wifi_off_rounded, size: 56, color: KathaColors.inkMuted.withValues(alpha: 0.5)),
            const SizedBox(height: 20),
            Text(message, style: Theme.of(context).textTheme.titleLarge, textAlign: TextAlign.center),
            if (offlineChapters != null && offlineChapters!.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text('Available offline:', style: Theme.of(context).textTheme.labelMedium),
              const SizedBox(height: 8),
              ...offlineChapters!.map((n) => Text('Chapter $n', style: Theme.of(context).textTheme.bodyMedium)),
            ],
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (onRetry != null)
                  FilledButton(onPressed: onRetry, child: const Text('Retry')),
                if (onAction != null && actionLabel != null) ...[
                  const SizedBox(width: 12),
                  OutlinedButton(onPressed: onAction, child: Text(actionLabel!)),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}