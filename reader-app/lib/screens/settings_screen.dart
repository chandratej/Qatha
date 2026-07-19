import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/providers/app_state.dart';
import '../core/providers/auth_state.dart';
import '../core/services/launch_offer_service.dart';
import '../core/theme/katha_theme.dart';
import 'reader_auth_screen.dart';

String _subscriptionLabel(AuthState auth) {
  if (auth.user?.subscriptionStatus == 'active') {
    return 'Katha Unlimited — Active';
  }
  if (auth.isOnLaunchTrial) {
    final days = auth.user?.trialRemaining?.inDays ?? 0;
    return 'Launch trial — $days days of unlimited reading left';
  }
  final gate = LaunchOfferService.instance.config.subscriptionGateChapter;
  return 'Free — ₹99/month from Chapter $gate';
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

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const _SectionTitle('Reading'),
          _SettingCard(
            icon: Icons.text_fields,
            title: 'Font size',
            subtitle:
                'Size ${appState.fontScale} of 5 — tap Aa in reader for live preview',
            child: _SegmentRow<int>(
              values: const [1, 2, 3, 4, 5],
              labels: const ['S', 'M', 'L', 'XL', 'XXL'],
              selected: appState.fontScale,
              onSelected: appState.setFontScale,
            ),
          ),
          _SettingCard(
            icon: Icons.format_line_spacing,
            title: 'Line spacing',
            subtitle: appState.lineHeightScale == 1
                ? 'Compact'
                : appState.lineHeightScale == 3
                    ? 'Spacious (dyslexia friendly)'
                    : 'Comfort (recommended)',
            child: _SegmentRow<int>(
              values: const [1, 2, 3],
              labels: const ['Compact', 'Comfort', 'Spacious'],
              selected: appState.lineHeightScale,
              onSelected: appState.setLineHeightScale,
            ),
          ),
          _SettingCard(
            icon: Icons.format_align_left,
            title: 'Text alignment',
            subtitle: appState.isLeftAlign
                ? 'Left (recommended for readability)'
                : 'Justified',
            child: _SegmentRow<String>(
              values: const ['left', 'justify'],
              labels: const ['Left', 'Justified'],
              selected: appState.textAlign,
              onSelected: appState.setTextAlign,
            ),
          ),
          _NavCard(
            icon: isDark ? Icons.dark_mode : Icons.light_mode,
            title: 'Theme',
            subtitle: isDark ? 'Dark' : 'Light',
            onTap: () => appState.toggleTheme(),
          ),
          const SizedBox(height: 24),
          const _SectionTitle('Account'),
          if (auth.isLoggedIn && auth.user != null) ...[
            _NavCard(
              icon: Icons.person,
              title: auth.user!.displayName,
              subtitle: auth.user!.identityLabel,
            ),
            _SettingCard(
              icon: Icons.workspace_premium,
              title: 'Subscription',
              subtitle: _subscriptionLabel(auth),
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
                            const SnackBar(
                              content: Text(
                                'Open a locked chapter to subscribe with UPI — ₹99/mo · up to 60% to writers.',
                              ),
                            ),
                          );
                        },
                        child: const Text('Subscribe'),
                      ),
                    ),
            ),
            _NavCard(
              icon: Icons.logout,
              title: 'Sign out',
              onTap: () => auth.logout(),
            ),
          ] else
            _NavCard(
              icon: Icons.login,
              title: 'Sign in',
              subtitle: 'Google or email — required from Chapter 4',
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ReaderAuthScreen()),
              ),
            ),
          const SizedBox(height: 24),
          const _SectionTitle('Notifications'),
          _SwitchCard(
            icon: Icons.auto_stories,
            title: 'New chapters',
            subtitle: 'When authors you read publish',
            value: appState.notifyNewChapters,
            onChanged: appState.setNotifyNewChapters,
          ),
          _SwitchCard(
            icon: Icons.schedule,
            title: 'Subscription reminders',
            subtitle: '3 days before renewal',
            value: appState.notifySubscription,
            onChanged: appState.setNotifySubscription,
          ),
          _SwitchCard(
            icon: Icons.trending_up,
            title: 'Weekly trending',
            subtitle: 'Sunday digest',
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
                const Icon(Icons.chevron_right, size: 20, color: KathaColors.inkMuted),
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
