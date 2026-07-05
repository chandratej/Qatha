import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../core/models/story.dart';
import '../core/theme/katha_theme.dart';

class StoryCard extends StatelessWidget {
  final Story story;
  final VoidCallback onTap;
  final int index;

  const StoryCard({
    super.key,
    required this.story,
    required this.onTap,
    this.index = 0,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: isDark ? KathaColors.darkSurface : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isDark
                ? Colors.white.withValues(alpha: 0.08)
                : KathaColors.ink.withValues(alpha: 0.08), // sync with CMS --border
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.06),
              blurRadius: 20,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.horizontal(left: Radius.circular(20)),
              child: SizedBox(
                width: 100,
                height: 140,
                child: story.coverUrl != null
                    ? CachedNetworkImage(
                        imageUrl: story.coverUrl!,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => _coverPlaceholder(isDark),
                        errorWidget: (context, url, error) => _coverPlaceholder(isDark),
                      )
                    : _coverPlaceholder(isDark),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      story.title,
                      style: Theme.of(context).textTheme.titleLarge,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      story.authorName,
                      style: Theme.of(context).textTheme.labelMedium,
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _chip(context, story.genreLabel),
                        const SizedBox(width: 8),
                        Text(
                          '${story.chapterCount} ch',
                          style: Theme.of(context).textTheme.labelMedium,
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    // Per decisions: clear meta (reads, chapters, progress/status)
                    Row(
                      children: [
                        Icon(
                          Icons.verified_outlined,
                          size: 13,
                          color: KathaColors.gold.withValues(alpha: 0.8),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          story.readersLabel,
                          style: Theme.of(context).textTheme.labelMedium?.copyWith(
                                color: KathaColors.goldDark,
                                fontSize: 11,
                              ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    )
        .animate()
        .fadeIn(duration: 400.ms, delay: (index * 80).ms)
        .slideY(begin: 0.1, end: 0, duration: 400.ms, delay: (index * 80).ms);
  }

  Widget _coverPlaceholder(bool isDark) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isDark
              ? [KathaColors.darkElevated, KathaColors.ember.withValues(alpha: 0.3)]
              : [KathaColors.paperWarm, KathaColors.goldLight.withValues(alpha: 0.5)],
        ),
      ),
      child: const Center(
        child: Text('కథ', style: TextStyle(fontSize: 28, color: KathaColors.gold)),
      ),
    );
  }

  Widget _chip(BuildContext context, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: KathaColors.gold.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(100),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: KathaColors.goldDark,
              fontSize: 11,
            ),
      ),
    );
  }
}