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

  /// Lazy tabs — only build a tab after it has been visited once.
  /// Prevents Settings/Browse layout or API errors from breaking Home on start.
  final Set<int> _visited = {0};

  static const _tabs = [
    _NavTab(
      icon: Icons.home_rounded,
      activeIcon: Icons.home,
      label: 'Home',
    ),
    _NavTab(
      icon: Icons.explore_outlined,
      activeIcon: Icons.explore,
      label: 'Browse',
    ),
    _NavTab(
      icon: Icons.tune_rounded,
      activeIcon: Icons.tune,
      label: 'Settings',
    ),
  ];

  Widget _pageFor(int i) {
    switch (i) {
      case 0:
        return const HomeScreen();
      case 1:
        return const BrowseScreen();
      case 2:
        return const SettingsScreen();
      default:
        return const SizedBox.shrink();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _index,
        sizing: StackFit.expand,
        children: List.generate(_tabs.length, (i) {
          if (!_visited.contains(i)) {
            return const SizedBox.expand();
          }
          return KeyedSubtree(
            key: ValueKey('tab_$i'),
            child: _pageFor(i),
          );
        }),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) {
          setState(() {
            _index = i;
            _visited.add(i);
          });
        },
        backgroundColor: Theme.of(context).brightness == Brightness.dark
            ? KathaColors.darkSurface
            : Colors.white,
        indicatorColor: KathaColors.gold.withValues(alpha: 0.18),
        destinations: _tabs
            .map(
              (t) => NavigationDestination(
                icon: Icon(t.icon),
                selectedIcon: Icon(t.activeIcon, color: KathaColors.gold),
                label: t.label,
              ),
            )
            .toList(),
      ),
    );
  }
}

class _NavTab {
  final IconData icon;
  final IconData activeIcon;
  final String label;

  const _NavTab({
    required this.icon,
    required this.activeIcon,
    required this.label,
  });
}
