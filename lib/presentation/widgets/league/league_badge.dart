import 'package:flutter/material.dart';
import '../../../../domain/league/league_config.dart';
import '../../../../core/theme/app_theme.dart';

/// Size options for league badges
enum BadgeSize { small, medium, large }

/// Premium league badge widget showing story tier
class LeagueBadge extends StatelessWidget {
  final String leagueId;
  final BadgeSize size;
  final bool showLabel;
  final bool showDescription;

  const LeagueBadge({
    super.key,
    required this.leagueId,
    this.size = BadgeSize.medium,
    this.showLabel = true,
    this.showDescription = false,
  });

  @override
  Widget build(BuildContext context) {
    final league = LeagueConfig.getLeagueById(leagueId);
    final theme = Theme.of(context);
    
    final config = _getSizeConfig(size);
    final iconSize = config['iconSize'] as double;
    final fontSize = config['fontSize'] as TextStyle;
    final padding = config['padding'] as EdgeInsets;
    
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            league.primaryColor,
            league.primaryColor.withValues(alpha: 0.7),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: league.primaryColor.withValues(alpha: 0.3),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Icon
          Icon(
            league.icon,
            size: iconSize,
            color: Colors.white,
          ),
          
          if (showLabel) ...[
            const SizedBox(width: 6),
            
            // League Name
            Text(
              league.name,
              style: fontSize.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ],
      ),
    );
  }

  Map<String, dynamic> _getSizeConfig(BadgeSize size) {
    switch (size) {
      case BadgeSize.small:
        return {
          'iconSize': 14.0,
          'fontSize': Theme.of(context).textTheme.labelSmall,
          'padding': const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
        };
      case BadgeSize.medium:
        return {
          'iconSize': 18.0,
          'fontSize': Theme.of(context).textTheme.labelMedium,
          'padding': const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        };
      case BadgeSize.large:
        return {
          'iconSize': 24.0,
          'fontSize': Theme.of(context).textTheme.labelLarge,
          'padding': const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        };
    }
  }
}

/// League progression indicator showing current and next league
class LeagueProgression extends StatelessWidget {
  final String currentLeagueId;
  final double progressToNext; // 0.0 to 1.0
  final VoidCallback? onViewRequirements;

  const LeagueProgression({
    super.key,
    required this.currentLeagueId,
    required this.progressToNext,
    this.onViewRequirements,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final currentLeague = LeagueConfig.getLeagueById(currentLeagueId);
    final nextLeague = LeagueConfig.getNextLeague(currentLeagueId);
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'League Progress',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (nextLeague != null && onViewRequirements != null)
                TextButton(
                  onPressed: onViewRequirements,
                  style: TextButton.styleFrom(
                    padding: EdgeInsets.zero,
                    minimumSize: const Size(0, 0),
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: Text(
                    'Requirements',
                    style: theme.textTheme.labelSmall,
                  ),
                ),
            ],
          ),
          
          const SizedBox(height: 12),
          
          // Current and Next League
          Row(
            children: [
              // Current League
              Expanded(
                child: Column(
                  children: [
                    LeagueBadge(
                      leagueId: currentLeagueId,
                      size: BadgeSize.medium,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Current',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              
              // Arrow
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Icon(
                  Icons.arrow_forward_rounded,
                  color: theme.colorScheme.onSurfaceVariant,
                  size: 20,
                ),
              ),
              
              // Next League
              Expanded(
                child: Column(
                  children: [
                    if (nextLeague != null) ...[
                      LeagueBadge(
                        leagueId: nextLeague.id,
                        size: BadgeSize.medium,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Next',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ] else ...[
                      Icon(
                        Icons.emoji_events_rounded,
                        size: 24,
                        color: theme.colorScheme.primary,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Max',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Progress Bar
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Progress to ${nextLeague?.name ?? "Top League"}',
                    style: theme.textTheme.bodySmall,
                  ),
                  Text(
                    '${(progressToNext * 100).round()}%',
                    style: theme.textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: theme.colorScheme.primary,
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 6),
              
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: progressToNext.clamp(0.0, 1.0),
                  backgroundColor: theme.colorScheme.outline.withValues(alpha: 0.2),
                  valueColor: AlwaysStoppedAnimation<Color>(
                    nextLeague?.primaryColor ?? theme.colorScheme.primary,
                  ),
                  minHeight: 6,
                ),
              ),
            ],
          ),
          
          // Requirements Preview
          if (nextLeague != null && showDescription) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: theme.colorScheme.outline.withValues(alpha: 0.2),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Promotion Requirements',
                    style: theme.textTheme.labelSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  ..._buildRequirementList(nextLeague, theme),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  List<Widget> _buildRequirementList(LeagueConfig league, ThemeData theme) {
    final requirements = <Widget>[];
    
    if (league.minCompletionRate > 0) {
      requirements.add(_requirementRow(
        icon: Icons.check_circle_outline_rounded,
        text: '${league.minCompletionRate}% min completion',
        theme: theme,
      ));
    }
    
    if (league.minAverageRating > 0) {
      requirements.add(_requirementRow(
        icon: Icons.star_outline_rounded,
        text: '${league.minAverageRating}+ avg rating',
        theme: theme,
      ));
    }
    
    if (league.minReads > 0) {
      requirements.add(_requirementRow(
        icon: Icons.people_outline_rounded,
        text: '${_formatNumber(league.minReads)}+ reads',
        theme: theme,
      ));
    }
    
    if (league.minDaysInLeague > 0) {
      requirements.add(_requirementRow(
        icon: Icons.calendar_today_rounded,
        text: '${league.minDaysInLeague} days in current league',
        theme: theme,
      ));
    }
    
    return requirements;
  }

  Widget _requirementRow({
    required IconData icon,
    required String text,
    required ThemeData theme,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Icon(
            icon,
            size: 14,
            color: theme.colorScheme.onSurfaceVariant,
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              text,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatNumber(int number) {
    if (number >= 1000000) {
      return '${(number / 1000000).toStringAsFixed(1)}M';
    } else if (number >= 1000) {
      return '${(number / 1000).toStringAsFixed(0)}K';
    }
    return number.toString();
  }
}

/// Grid of league badges for explore/filter screens
class LeagueGrid extends StatelessWidget {
  final String? selectedLeagueId;
  final Function(String)? onLeagueSelected;

  const LeagueGrid({
    super.key,
    this.selectedLeagueId,
    this.onLeagueSelected,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final leagues = LeagueConfig.getAllLeagues();
    
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 2.5,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
      ),
      itemCount: leagues.length,
      itemBuilder: (context, index) {
        final league = leagues[index];
        final isSelected = selectedLeagueId == league.id;
        
        return InkWell(
          onTap: () => onLeagueSelected?.call(league.id),
          borderRadius: BorderRadius.circular(8),
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: isSelected
                    ? [league.primaryColor, league.primaryColor.withValues(alpha: 0.7)]
                    : [
                        league.primaryColor.withValues(alpha: 0.1),
                        league.primaryColor.withValues(alpha: 0.05),
                      ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: isSelected
                    ? league.primaryColor
                    : theme.colorScheme.outline.withValues(alpha: 0.2),
                width: isSelected ? 2 : 1,
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  league.icon,
                  size: 18,
                  color: isSelected ? Colors.white : league.primaryColor,
                ),
                const SizedBox(width: 6),
                Text(
                  league.name,
                  style: theme.textTheme.labelMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: isSelected ? Colors.white : league.primaryColor,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
