import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../domain/entities/story.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../widgets/league/league_badge.dart';

/// Premium story card widget for home screen sections
class StoryCard extends StatelessWidget {
  final Story story;
  final VoidCallback? onTap;
  final bool showLeagueBadge;
  final bool isCompact;

  const StoryCard({
    super.key,
    required this.story,
    this.onTap,
    this.showLeagueBadge = true,
    this.isCompact = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Card(
      elevation: 2,
      shadowColor: theme.colorScheme.shadow.withValues(alpha: 0.1),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        splashFactory: InkRipple.splashFactory,
        highlightColor: theme.colorScheme.primaryContainer.withValues(alpha: 0.1),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cover Image
            Container(
              width: isCompact ? 80 : 100,
              height: isCompact ? 120 : 150,
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceVariant,
                image: story.coverUrl.isNotEmpty
                    ? DecorationImage(
                        image: NetworkImage(story.coverUrl),
                        fit: BoxFit.cover,
                      )
                    : null,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(12),
                  bottomLeft: Radius.circular(12),
                ),
              ),
              child: story.coverUrl.isEmpty
                  ? Icon(
                      Icons.menu_book_rounded,
                      size: isCompact ? 32 : 40,
                      color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.5),
                    )
                  : null,
            ),
            
            // Story Details
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title
                    Text(
                      story.title,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: theme.colorScheme.onSurface,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    
                    const SizedBox(height: 4),
                    
                    // Author
                    Text(
                      'by ${story.authorName}',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    
                    if (showLeagueBadge) ...[
                      const SizedBox(height: 8),
                      
                      // League Badge
                      LeagueBadge(
                        leagueId: story.leagueId,
                        size: isCompact ? BadgeSize.small : BadgeSize.medium,
                      ),
                    ],
                    
                    const Spacer(),
                    
                    // Stats Row
                    Row(
                      children: [
                        // Rating
                        Icon(
                          Icons.star_rounded,
                          size: 16,
                          color: theme.colorScheme.primary,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          story.averageRating.toStringAsFixed(1),
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        
                        const SizedBox(width: 12),
                        
                        // Readers
                        Icon(
                          Icons.people_outline_rounded,
                          size: 16,
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          _formatNumber(story.readerCount),
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                        
                        const Spacer(),
                        
                        // Completion Rate
                        if (story.completionRate > 0)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: _getCompletionColor(theme).withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              '${story.completionRate.round()}%',
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: _getCompletionColor(theme),
                                fontWeight: FontWeight.w600,
                              ),
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
    );
  }

  Color _getCompletionColor(ThemeData theme) {
    if (story.completionRate >= AppConstants.highCompletionThreshold) {
      return Colors.green;
    } else if (story.completionRate >= AppConstants.mediumCompletionThreshold) {
      return Colors.orange;
    } else {
      return Colors.red;
    }
  }

  String _formatNumber(int number) {
    if (number >= 1000000) {
      return '${(number / 1000000).toStringAsFixed(1)}M';
    } else if (number >= 1000) {
      return '${(number / 1000).toStringAsFixed(1)}K';
    }
    return number.toString();
  }
}

/// Grid story card for explore and collection screens
class StoryGridCard extends StatelessWidget {
  final Story story;
  final VoidCallback? onTap;
  final double aspectRatio;

  const StoryGridCard({
    super.key,
    required this.story,
    this.onTap,
    this.aspectRatio = 0.67,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Card(
      elevation: 2,
      shadowColor: theme.colorScheme.shadow.withValues(alpha: 0.1),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        splashFactory: InkRipple.splashFactory,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cover Image
            AspectRatio(
              aspectRatio: aspectRatio,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (story.coverUrl.isNotEmpty)
                    Image.network(
                      story.coverUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return Container(
                          color: theme.colorScheme.surfaceVariant,
                          child: Icon(
                            Icons.menu_book_rounded,
                            size: 40,
                            color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.5),
                          ),
                        );
                      },
                      loadingBuilder: (context, child, loadingProgress) {
                        if (loadingProgress == null) return child;
                        return Container(
                          color: theme.colorScheme.surfaceVariant,
                          child: Center(
                            child: CircularProgressIndicator(
                              value: loadingProgress.expectedTotalBytes != null
                                  ? loadingProgress.cumulativeBytesLoaded /
                                      loadingProgress.expectedTotalBytes!
                                  : null,
                              strokeWidth: 2,
                            ),
                          ),
                        );
                      },
                    )
                  else
                    Container(
                      color: theme.colorScheme.surfaceVariant,
                      child: Icon(
                        Icons.menu_book_rounded,
                        size: 40,
                        color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.5),
                      ),
                    ),
                  
                  // League Badge Overlay
                  Positioned(
                    top: 8,
                    right: 8,
                    child: LeagueBadge(
                      leagueId: story.leagueId,
                      size: BadgeSize.small,
                      showLabel: false,
                    ),
                  ),
                ],
              ),
            ),
            
            // Story Info
            Padding(
              padding: const EdgeInsets.all(8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    story.title,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  
                  const SizedBox(height: 2),
                  
                  Text(
                    story.authorName,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  
                  const SizedBox(height: 4),
                  
                  Row(
                    children: [
                      Icon(
                        Icons.star_rounded,
                        size: 14,
                        color: theme.colorScheme.primary,
                      ),
                      const SizedBox(width: 2),
                      Text(
                        story.averageRating.toStringAsFixed(1),
                        style: theme.textTheme.bodySmall,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Horizontal scrolling list of story cards
class StorySection extends StatelessWidget {
  final String title;
  final List<Story> stories;
  final Function(Story)? onStoryTap;
  final VoidCallback? onViewAllTap;
  final bool isCompact;

  const StorySection({
    super.key,
    required this.title,
    required this.stories,
    this.onStoryTap,
    this.onViewAllTap,
    this.isCompact = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    if (stories.isEmpty) return const SizedBox.shrink();
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (onViewAllTap != null && stories.length > 4)
                TextButton(
                  onPressed: onViewAllTap,
                  child: const Text('View All'),
                ),
            ],
          ),
        ),
        
        // Horizontal List
        SizedBox(
          height: isCompact ? 144 : 174,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: stories.length,
            separatorBuilder: (context, index) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final story = stories[index];
              return SizedBox(
                width: isCompact ? 280 : 320,
                child: StoryCard(
                  story: story,
                  onTap: () => onStoryTap?.call(story),
                  isCompact: isCompact,
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
