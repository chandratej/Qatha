import 'package:flutter/material.dart';
import 'package:storyverse/core/constants/app_colors.dart';
import 'package:storyverse/domain/league/league_config.dart';
import 'badge_size.dart';

/// League badge widget for displaying story league status
class LeagueBadge extends StatelessWidget {
  final String leagueId;
  final BadgeSize size;
  final bool showLabel;
  final bool showGradient;

  const LeagueBadge({
    super.key,
    required this.leagueId,
    this.size = BadgeSize.medium,
    this.showLabel = true,
    this.showGradient = true,
  });

  @override
  Widget build(BuildContext context) {
    final league = LeagueConfig.getLeagueById(leagueId);
    if (league == null) return const SizedBox.shrink();

    final color = _getLeagueColor(leagueId);
    final gradient = _getLeagueGradient(leagueId);

    return Container(
      width: size.size,
      height: size.size + (showLabel ? 20 : 0),
      decoration: BoxDecoration(
        gradient: showGradient && gradient != null ? gradient : null,
        color: showGradient ? null : color,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.3),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            _getLeagueIcon(leagueId),
            color: Colors.white,
            size: size.size * 0.5,
          ),
          if (showLabel)
            Text(
              league.tier.name.toUpperCase(),
              style: TextStyle(
                color: Colors.white,
                fontSize: size.fontSize * 0.7,
                fontWeight: FontWeight.bold,
              ),
            ),
        ],
      ),
    );
  }

  Color _getLeagueColor(String leagueId) {
    switch (leagueId) {
      case 'archive':
        return AppColors.archive;
      case 'manuscript':
        return AppColors.manuscript;
      case 'published':
        return AppColors.published;
      case 'acclaimed':
        return AppColors.acclaimed;
      case 'celebrated':
        return AppColors.celebrated;
      case 'distinguished':
        return AppColors.distinguished;
      case 'masterwork':
        return AppColors.masterwork;
      case 'legendary':
        return AppColors.legendary;
      case 'hall_of_fame':
        return AppColors.hallOfFame;
      case 'heritage':
        return AppColors.heritage;
      case 'classic':
        return AppColors.classic;
      case 'timeless':
        return AppColors.timeless;
      case 'immortal':
        return AppColors.immortal;
      default:
        return AppColors.gray400;
    }
  }

  LinearGradient? _getLeagueGradient(String leagueId) {
    switch (leagueId) {
      case 'immortal':
        return const LinearGradient(
          colors: [AppColors.immortal, AppColors.premiumGold],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        );
      case 'legendary':
        return const LinearGradient(
          colors: [AppColors.legendary, AppColors.accent],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        );
      default:
        return null;
    }
  }

  IconData _getLeagueIcon(String leagueId) {
    switch (leagueId) {
      case 'archive':
        return Icons.archive_outlined;
      case 'manuscript':
        return Icons.description_outlined;
      case 'published':
        return Icons.book_outlined;
      case 'acclaimed':
        return Icons.star_outline;
      case 'celebrated':
        return Icons.emoji_events_outlined;
      case 'distinguished':
        return Icons.workspace_premium_outlined;
      case 'masterwork':
        return Icons.auto_stories;
      case 'legendary':
        return Icons.shield_outlined;
      case 'hall_of_fame':
        return Icons.military_tech_outlined;
      case 'heritage':
        return Icons.account_balance_outlined;
      case 'classic':
        return Icons.collections_bookmark_outlined;
      case 'timeless':
        return Icons.schedule_outlined;
      case 'immortal':
        return Icons.local_fire_department_outlined;
      default:
        return Icons.book_outlined;
    }
  }
}
