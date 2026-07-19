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

  /// Fixed height that fits title (2 lines) + author + genre chip + readers
  /// under real content lengths without RenderFlex overflow banners.
  static const double cardHeight = 148;
  static const double coverWidth = 100;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final card = Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          height: cardHeight,
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
                        height: cardHeight,
                        placeholder: (context, url) => _coverPlaceholder(isDark),
                        errorWidget: (context, url, error) =>
                            _coverPlaceholder(isDark),
                      )
                    : _coverPlaceholder(isDark),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    mainAxisSize: MainAxisSize.max,
                    children: [
                      Flexible(
                        child: Text(
                          story.title,
                          style: Theme.of(context).textTheme.titleLarge,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        story.authorName,
                        style: Theme.of(context).textTheme.labelMedium,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Flexible(child: _chip(context, story.genreLabel)),
                          const SizedBox(width: 8),
                          Text(
                            '${story.chapterCount} ch',
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
    );

    // Opacity-only animation avoids slide transforms that break web layout.
    return card.animate().fadeIn(duration: 400.ms, delay: (index * 80).ms);
  }

  Widget _coverPlaceholder(bool isDark) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isDark
              ? [
                  KathaColors.darkElevated,
                  KathaColors.ember.withValues(alpha: 0.3),
                ]
              : [
                  KathaColors.paperWarm,
                  KathaColors.goldLight.withValues(alpha: 0.5),
                ],
        ),
      ),
      child: const Center(
        child: Text(
          'కథ',
          style: TextStyle(fontSize: 28, color: KathaColors.gold),
        ),
      ),
    );
  }

  Widget _chip(BuildContext context, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        color: KathaColors.gold.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(100),
      ),
      child: Text(
        label,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: KathaColors.goldDark,
              fontSize: 11,
            ),
      ),
    );
  }
}
