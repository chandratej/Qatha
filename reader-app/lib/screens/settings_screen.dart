import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/providers/app_state.dart';
import '../core/providers/auth_state.dart';
import '../core/services/launch_offer_service.dart';
import '../core/theme/katha_theme.dart';
import 'reader_auth_screen.dart';

String _subscriptionLabel(AuthState auth) {
  if (auth.user?.subscriptionStatus == 'active') return 'Katha Unlimited — Active';
  if (auth.isOnLaunchTrial) {
    final days = auth.user?.trialRemaining?.inDays ?? 0;
    return 'Launch trial — $days days of unlimited reading left';
  }
  final gate = LaunchOfferService.instance.config.subscriptionGateChapter;
  return 'Free — ₹99/month from Chapter $gate';
}

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
          _SectionTitle('Reading'),
          _Tile(
            icon: Icons.text_fields,
            title: 'Font size',
            subtitle: 'Size ${appState.fontScale} of 5 — tap Aa in reader for live preview',
            trailing: SegmentedButton<int>(
              segments: const [
                ButtonSegment(value: 1, label: Text('S')),
                ButtonSegment(value: 2, label: Text('M')),
                ButtonSegment(value: 3, label: Text('L')),
                ButtonSegment(value: 4, label: Text('XL')),
                ButtonSegment(value: 5, label: Text('XXL')),
              ],
              selected: {appState.fontScale},
              onSelectionChanged: (s) => appState.setFontScale(s.first),
            ),
          ),
          _Tile(
            icon: Icons.format_line_spacing,
            title: 'Line spacing',
            subtitle: appState.lineHeightScale == 1 ? 'Compact' : appState.lineHeightScale == 3 ? 'Spacious (dyslexia friendly)' : 'Comfort (recommended)',
            trailing: SegmentedButton<int>(
              segments: const [
                ButtonSegment(value: 1, label: Text('C')),
                ButtonSegment(value: 2, label: Text('R')),
                ButtonSegment(value: 3, label: Text('S')),
              ],
              selected: {appState.lineHeightScale},
              onSelectionChanged: (s) => appState.setLineHeightScale(s.first),
            ),
          ),
          _Tile(
            icon: Icons.format_align_left,
            title: 'Text alignment',
            subtitle: appState.isLeftAlign ? 'Left (recommended for readability)' : 'Justify',
            trailing: SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'left', label: Text('Left')),
                ButtonSegment(value: 'justify', label: Text('Just')),
              ],
              selected: {appState.textAlign},
              onSelectionChanged: (s) => appState.setTextAlign(s.first),
            ),
          ),
          _Tile(
            icon: isDark ? Icons.dark_mode : Icons.light_mode,
            title: 'Theme',
            subtitle: isDark ? 'Dark' : 'Light',
            onTap: () => appState.toggleTheme(),
          ),
          const SizedBox(height: 24),
          _SectionTitle('Account'),
          if (auth.isLoggedIn) ...[
            _Tile(icon: Icons.person, title: auth.user!.displayName, subtitle: auth.user!.identityLabel),
            _Tile(
              icon: Icons.workspace_premium,
              title: 'Subscription',
              subtitle: _subscriptionLabel(auth),
              trailing: auth.isSubscribed
                  ? const Icon(Icons.check_circle, color: KathaColors.gold)
                  : TextButton(
                      onPressed: () {
                        // Deep-link readers to browse → pick a story for paywall context
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
            _Tile(
              icon: Icons.logout,
              title: 'Sign out',
              onTap: () => auth.logout(),
            ),
          ] else
            _Tile(
              icon: Icons.login,
              title: 'Sign in',
              subtitle: 'Google or email — required from Chapter 4',
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ReaderAuthScreen())),
            ),
          const SizedBox(height: 24),
          _SectionTitle('Notifications'),
          SwitchListTile(
            secondary: const Icon(Icons.auto_stories, color: KathaColors.gold),
            title: const Text('New chapters'),
            subtitle: const Text('When authors you read publish'),
            value: appState.notifyNewChapters,
            onChanged: appState.setNotifyNewChapters,
          ),
          SwitchListTile(
            secondary: const Icon(Icons.schedule, color: KathaColors.gold),
            title: const Text('Subscription reminders'),
            subtitle: const Text('3 days before renewal'),
            value: appState.notifySubscription,
            onChanged: appState.setNotifySubscription,
          ),
          SwitchListTile(
            secondary: const Icon(Icons.trending_up, color: KathaColors.gold),
            title: const Text('Weekly trending'),
            subtitle: const Text('Sunday digest'),
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
      child: Text(title.toUpperCase(), style: Theme.of(context).textTheme.labelMedium?.copyWith(letterSpacing: 1.2, color: KathaColors.gold)),
    );
  }
}

class _Tile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;

  const _Tile({required this.icon, required this.title, this.subtitle, this.trailing, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Icon(icon, color: KathaColors.gold),
        title: Text(title),
        subtitle: subtitle != null ? Text(subtitle!) : null,
        trailing: trailing ?? (onTap != null ? const Icon(Icons.chevron_right) : null),
        onTap: onTap,
      ),
    );
  }
}