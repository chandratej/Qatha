import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:provider/provider.dart';
import '../core/providers/app_state.dart';
import '../core/providers/auth_state.dart';
import '../core/services/launch_offer_service.dart';
import '../core/services/notification_permission_service.dart';
import '../core/theme/katha_theme.dart';
import '../l10n/generated/app_localizations.dart';
import 'reader_auth_screen.dart';

String _subscriptionLabel(BuildContext context, AuthState auth) {
  final l10n = AppLocalizations.of(context)!;
  if (auth.user?.subscriptionStatus == 'active') {
    return l10n.settingsSubscriptionActive;
  }
  if (auth.isOnLaunchTrial) {
    final days = auth.user?.trialRemaining?.inDays ?? 0;
    return l10n.settingsSubscriptionTrial(days);
  }
  final gate = LaunchOfferService.instance.config.subscriptionGateChapter;
  return l10n.settingsSubscriptionFree(gate);
}

/// Settings UI with **zero** ListTile / SwitchListTile.
/// ListTile.trailing (and Switch as trailing) throws on Flutter web when the
/// tile is narrower than leading + title + trailing.
class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final auth = context.watch<AuthState>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.settingsTitle)),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          _SectionTitle(l10n.settingsSectionReading),
          _SettingCard(
            icon: Icons.text_fields,
            title: l10n.settingsFontSize,
            subtitle: l10n.settingsFontSizeSubtitle(appState.fontScale),
            child: _SegmentRow<int>(
              values: const [1, 2, 3, 4, 5],
              labels: const ['S', 'M', 'L', 'XL', 'XXL'],
              selected: appState.fontScale,
              onSelected: appState.setFontScale,
            ),
          ),
          _SettingCard(
            icon: Icons.format_line_spacing,
            title: l10n.settingsLineSpacing,
            subtitle: appState.lineHeightScale == 1
                ? l10n.settingsLineSpacingCompact
                : appState.lineHeightScale == 3
                    ? l10n.settingsLineSpacingSpaciousDetail
                    : l10n.settingsLineSpacingComfortDetail,
            child: _SegmentRow<int>(
              values: const [1, 2, 3],
              labels: [
                l10n.settingsLineSpacingCompact,
                l10n.settingsLineSpacingComfort,
                l10n.settingsLineSpacingSpacious,
              ],
              selected: appState.lineHeightScale,
              onSelected: appState.setLineHeightScale,
            ),
          ),
          _SettingCard(
            icon: Icons.format_align_left,
            title: l10n.settingsTextAlignment,
            subtitle: appState.isLeftAlign
                ? l10n.settingsAlignLeftDetail
                : l10n.settingsAlignJustified,
            child: _SegmentRow<String>(
              values: const ['left', 'justify'],
              labels: [l10n.settingsAlignLeft, l10n.settingsAlignJustified],
              selected: appState.textAlign,
              onSelected: appState.setTextAlign,
            ),
          ),
          _SettingCard(
            icon: isDark ? Icons.dark_mode : Icons.light_mode,
            title: l10n.settingsTheme,
            subtitle: appState.themeMode == ThemeMode.system
                ? l10n.settingsThemeSystemDetail
                : (isDark ? l10n.settingsThemeDark : l10n.settingsThemeLight),
            child: _SegmentRow<ThemeMode>(
              values: const [ThemeMode.system, ThemeMode.light, ThemeMode.dark],
              labels: [
                l10n.settingsThemeSystem,
                l10n.settingsThemeLight,
                l10n.settingsThemeDark,
              ],
              selected: appState.themeMode,
              onSelected: appState.setThemeMode,
            ),
          ),
          const SizedBox(height: 24),
          _SectionTitle(l10n.settingsSectionComfort),
          _SwitchCard(
            icon: Icons.motion_photos_off_outlined,
            title: l10n.settingsCalmMotion,
            subtitle: l10n.settingsCalmMotionSubtitle,
            value: appState.calmMotion,
            onChanged: appState.setCalmMotion,
          ),
          _SwitchCard(
            icon: Icons.contrast,
            title: l10n.settingsHighContrast,
            subtitle: l10n.settingsHighContrastSubtitle,
            value: appState.highContrast,
            onChanged: appState.setHighContrast,
          ),
          _SwitchCard(
            icon: Icons.accessibility_new,
            title: l10n.settingsEasyReading,
            subtitle: l10n.settingsEasyReadingSubtitle,
            value: appState.easyReading,
            onChanged: appState.setEasyReading,
          ),
          _SettingCard(
            icon: Icons.self_improvement,
            title: l10n.settingsEyeBreakReminder,
            subtitle: appState.eyeBreakMinutes == 0
                ? l10n.settingsReadingBreaksOff
                : l10n.settingsReadingBreaksOn(appState.eyeBreakMinutes),
            child: _SegmentRow<int>(
              values: const [0, 90, 120],
              labels: [
                l10n.settingsOff,
                l10n.settingsReadingBreaks90,
                l10n.settingsReadingBreaks120,
              ],
              selected: appState.eyeBreakMinutes,
              onSelected: appState.setEyeBreakMinutes,
            ),
          ),
          const SizedBox(height: 24),
          _SectionTitle(l10n.settingsAccount),
          if (auth.isLoggedIn && auth.user != null) ...[
            _NavCard(
              icon: Icons.person,
              title: auth.user!.displayName,
              subtitle: auth.user!.identityLabel,
            ),
            _SettingCard(
              icon: Icons.workspace_premium,
              title: l10n.settingsSubscription,
              subtitle: _subscriptionLabel(context, auth),
              child: auth.isSubscribed
                  ? const Align(
                      alignment: Alignment.centerLeft,
                      child: Icon(Icons.check_circle, color: KathaColors.gold),
                    )
                  : Align(
                      alignment: Alignment.centerLeft,
                      child: TextButton(
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(l10n.settingsSubscribeSnackbar),
                            ),
                          );
                        },
                        child: Text(l10n.buttonSubscribe),
                      ),
                    ),
            ),
            _NavCard(
              icon: Icons.logout,
              title: l10n.settingsSignOut,
              onTap: () => auth.logout(),
            ),
          ] else
            _NavCard(
              icon: Icons.login,
              title: l10n.settingsSignIn,
              subtitle: l10n.settingsSignInSubtitle,
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ReaderAuthScreen()),
              ),
            ),
          const SizedBox(height: 24),
          _SectionTitle(l10n.settingsNotifications),
          if (appState.notificationPromptShown) const _NotificationStatusReminder(),
          _SwitchCard(
            icon: Icons.auto_stories,
            title: l10n.settingsNotifyNewChapters,
            subtitle: l10n.settingsNotifyNewChaptersSubtitle,
            value: appState.notifyNewChapters,
            onChanged: appState.setNotifyNewChapters,
          ),
          _SwitchCard(
            icon: Icons.schedule,
            title: l10n.settingsNotifySubscriptionReminders,
            subtitle: l10n.settingsNotifySubscriptionRemindersSubtitle,
            value: appState.notifySubscription,
            onChanged: appState.setNotifySubscription,
          ),
          _SwitchCard(
            icon: Icons.trending_up,
            title: l10n.settingsNotifyWeeklyTrending,
            subtitle: l10n.settingsNotifyWeeklyTrendingSubtitle,
            value: appState.notifyTrending,
            onChanged: appState.setNotifyTrending,
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle(this.title);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title.toUpperCase(),
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
              letterSpacing: 1.2,
              color: KathaColors.gold,
            ),
      ),
    );
  }
}

class _SettingCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget child;

  const _SettingCard({
    required this.icon,
    required this.title,
    this.subtitle,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Icon(icon, color: KathaColors.gold),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: Theme.of(context).textTheme.titleMedium),
                      if (subtitle != null)
                        Text(
                          subtitle!,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            child,
          ],
        ),
      ),
    );
  }
}

/// Compact choice chips — never ListTile / SegmentedButton trailing layout.
class _SegmentRow<T> extends StatelessWidget {
  final List<T> values;
  final List<String> labels;
  final T selected;
  final ValueChanged<T> onSelected;

  const _SegmentRow({
    required this.values,
    required this.labels,
    required this.selected,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (var i = 0; i < values.length; i++)
          ChoiceChip(
            label: Text(labels[i]),
            selected: values[i] == selected,
            onSelected: (_) => onSelected(values[i]),
            selectedColor: KathaColors.gold.withValues(alpha: 0.25),
            labelStyle: TextStyle(
              color: values[i] == selected ? KathaColors.goldDark : null,
              fontWeight:
                  values[i] == selected ? FontWeight.w600 : FontWeight.w500,
            ),
          ),
      ],
    );
  }
}

class _NavCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback? onTap;

  const _NavCard({
    required this.icon,
    required this.title,
    this.subtitle,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Icon(icon, color: KathaColors.gold),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: Theme.of(context).textTheme.titleMedium),
                    if (subtitle != null)
                      Text(
                        subtitle!,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                  ],
                ),
              ),
              if (onTap != null)
                Icon(Icons.chevron_right, size: 20, color: KathaTheme.mutedInk(context)),
            ],
          ),
        ),
      ),
    );
  }
}

class _SwitchCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _SwitchCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Row(
          children: [
            Icon(icon, color: KathaColors.gold),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.titleMedium),
                  Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Switch(
              value: value,
              onChanged: onChanged,
              activeThumbColor: KathaColors.gold,
            ),
          ],
        ),
      ),
    );
  }
}

/// A single, gentle, permanent reminder that the OS permission is off — shown
/// only after the one-time explainer has already run once (never a repeated
/// nag, per §2.3). Silently renders nothing while permission is granted or
/// the platform doesn't support the check (e.g. web).
class _NotificationStatusReminder extends StatelessWidget {
  const _NotificationStatusReminder();

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return FutureBuilder<PermissionStatus>(
      future: NotificationPermissionService.instance.status(),
      builder: (context, snapshot) {
        final status = snapshot.data;
        if (status == null || status.isGranted) return const SizedBox.shrink();
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          color: KathaColors.gold.withValues(alpha: 0.08),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Icon(Icons.notifications_off_outlined, color: KathaColors.gold),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    l10n.settingsNotificationsReminder,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ),
                TextButton(
                  onPressed: NotificationPermissionService.instance.openSettings,
                  child: Text(l10n.buttonAllow),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
