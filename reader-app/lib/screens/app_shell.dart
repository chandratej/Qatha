import 'package:flutter/material.dart';
import '../core/theme/katha_theme.dart';
import 'browse_screen.dart';
import 'home_screen.dart';
import 'settings_screen.dart';

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _index = 0;

  static const _tabs = [
    _NavTab(icon: Icons.home_rounded, activeIcon: Icons.home, label: 'Home', labelTe: 'హోమ్'),
    _NavTab(icon: Icons.explore_outlined, activeIcon: Icons.explore, label: 'Browse', labelTe: 'వెతకండి'),
    _NavTab(icon: Icons.tune_rounded, activeIcon: Icons.tune, label: 'Settings', labelTe: 'సెట్టింగ్స్'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _index,
        children: const [
          HomeScreen(),
          BrowseScreen(),
          SettingsScreen(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        backgroundColor: Theme.of(context).brightness == Brightness.dark
            ? KathaColors.darkSurface
            : Colors.white,
        indicatorColor: KathaColors.gold.withValues(alpha: 0.18),
        destinations: _tabs
            .map((t) => NavigationDestination(
                  icon: Icon(t.icon),
                  selectedIcon: Icon(t.activeIcon, color: KathaColors.gold),
                  label: t.label,
                ))
            .toList(),
      ),
    );
  }
}

class _NavTab {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final String labelTe;

  const _NavTab({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.labelTe,
  });
}