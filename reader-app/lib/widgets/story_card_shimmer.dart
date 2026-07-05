import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../core/theme/katha_theme.dart';

class StoryListShimmer extends StatelessWidget {
  final int count;

  const StoryListShimmer({super.key, this.count = 3});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final base = isDark ? KathaColors.darkSurface : Colors.grey.shade300;
    final highlight = isDark ? KathaColors.darkElevated : Colors.grey.shade100;

    return Shimmer.fromColors(
      baseColor: base,
      highlightColor: highlight,
      child: Column(
        children: List.generate(count, (_) => Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: Row(
            children: [
              Container(width: 100, height: 140, decoration: BoxDecoration(color: base, borderRadius: BorderRadius.circular(12))),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(height: 18, width: double.infinity, color: base),
                    const SizedBox(height: 8),
                    Container(height: 14, width: 120, color: base),
                    const SizedBox(height: 16),
                    Container(height: 12, width: 80, color: base),
                  ],
                ),
              ),
            ],
          ),
        )),
      ),
    );
  }
}