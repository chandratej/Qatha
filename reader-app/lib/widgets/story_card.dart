import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../core/models/story.dart';
import '../core/theme/katha_theme.dart';
import '../core/utils/motion.dart';
import '../l10n/generated/app_localizations.dart';
import 'story_cover_art.dart';

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

  /// Minimum card height — the card grows with content instead of
  /// overflowing: larger font-scale settings and tall Telugu conjunct
  /// stacks were pushing past a fixed height by a few pixels.
  static const double cardHeight = 148;
  static const double coverWidth = 100;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final l10n = AppLocalizations.of(context)!;

    final card = Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          constraints: const BoxConstraints(minHeight: cardHeight),
          margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(
            color: isDark ? KathaColors.darkSurface : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isDark
                  ? Colors.white.withValues(alpha: 0.08)
                  : KathaColors.ink.withValues(alpha: 0.08),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.06),
                blurRadius: 20,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          // IntrinsicHeight lets the cover stretch to whatever height the
          // text column needs — content drives height, never overflow.
          child: IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SizedBox(
                  width: coverWidth,
                  child: story.coverUrl != null
                      ? CachedNetworkImage(
                          imageUrl: story.coverUrl!,
                          fit: BoxFit.cover,
                          width: coverWidth,
                          placeholder: (context, url) => _generatedCover(),
                          errorWidget: (context, url, error) =>
                              _generatedCover(),
                        )
                      : _generatedCover(),
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          story.title,
                          style: Theme.of(context).textTheme.titleLarge,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          story.authorName,
                          style: Theme.of(context).textTheme.labelMedium,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 4,
                          crossAxisAlignment: WrapCrossAlignment.center,
                          children: [
                            _chip(context, story.genreLabel),
                            if (story.isMatureThemed)
                              _chip(context, l10n.maturityMature, muted: true),
                            Text(
                              l10n.storyCardChapterCount(story.chapterCount),
                              style: Theme.of(context).textTheme.labelMedium,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(
                              Icons.people_outline,
                              size: 13,
                              color: KathaColors.gold.withValues(alpha: 0.8),
                            ),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                story.readersLabel,
                                style: Theme.of(context)
                                    .textTheme
                                    .labelMedium
                                    ?.copyWith(
                                      color: KathaColors.goldDark,
                                      fontSize: 11,
                                    ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
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
        ),
      ),
    );

    // Opacity-only animation avoids slide transforms that break web layout.
    if (reduceMotion(context)) return card;
    return card.animate().fadeIn(duration: 400.ms, delay: (index * 80).ms);
  }

  Widget _generatedCover() {
    return StoryCoverArt(title: story.title, seed: story.id);
  }

  Widget _chip(BuildContext context, String label, {bool muted = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        color: muted
            ? KathaTheme.mutedInk(context).withValues(alpha: 0.14)
            : KathaColors.gold.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(100),
      ),
      child: Text(
        label,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: muted ? KathaTheme.mutedInk(context) : KathaColors.goldDark,
              fontSize: 11,
            ),
      ),
    );
  }
}
