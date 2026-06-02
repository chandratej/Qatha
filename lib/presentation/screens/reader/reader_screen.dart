/// StoryVerse Reader Screen
/// Immersive reading experience with customization options

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:storyverse/core/theme/app_theme.dart';
import 'package:go_router/go_router.dart';

class ReaderScreen extends ConsumerStatefulWidget {
  final String storyId;
  final String? chapterId;

  const ReaderScreen({super.key, required this.storyId, this.chapterId});

  @override
  ConsumerState<ReaderScreen> createState() => _ReaderScreenState();
}

class _ReaderScreenState extends ConsumerState<ReaderScreen> {
  int currentChapter = 1;
  double fontSize = 18;
  ReadingTheme currentTheme = ReadingTheme.light;
  bool showControls = true;

  enum ReadingTheme { light, dark, sepia }

  @override
  Widget build(BuildContext context) {
    Color backgroundColor = _getBackgroundColor();
    Color textColor = _getTextColor();

    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: showControls
          ? AppBar(
              backgroundColor: backgroundColor,
              leading: IconButton(
                icon: Icon(Icons.arrow_back, color: textColor),
                onPressed: () => Navigator.pop(context),
              ),
              title: Text(
                'Chapter $currentChapter',
                style: TextStyle(color: textColor),
              ),
              actions: [
                IconButton(
                  icon: Icon(Icons.bookmark_border, color: textColor),
                  onPressed: () {},
                ),
                IconButton(
                  icon: Icon(Icons.settings, color: textColor),
                  onPressed: _showSettings,
                ),
              ],
            )
          : null,
      body: Stack(
        children: [
          // Reading Content
          GestureDetector(
            onTap: () {
              setState(() {
                showControls = !showControls;
              });
            },
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Chapter Title
                  Text(
                    'Chapter $currentChapter: The Beginning',
                    style: TextStyle(
                      fontSize: fontSize * 1.4,
                      fontWeight: FontWeight.bold,
                      color: textColor,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Chapter Content
                  ...List.generate(
                    20,
                    (index) => Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: Text(
                        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
                        style: TextStyle(
                          fontSize: fontSize,
                          color: textColor,
                          height: 1.8,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 48),

                  // Chapter Navigation
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      if (currentChapter > 1)
                        ElevatedButton.icon(
                          onPressed: () {
                            setState(() {
                              currentChapter--;
                            });
                          },
                          icon: const Icon(Icons.chevron_left),
                          label: const Text('Previous'),
                        )
                      else
                        const SizedBox(width: 100),
                      ElevatedButton.icon(
                        onPressed: () {
                          setState(() {
                            currentChapter++;
                          });
                        },
                        label: const Text('Next Chapter'),
                        icon: const Icon(Icons.chevron_right),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // Bottom Controls (Hidden by default)
          if (showControls)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                decoration: BoxDecoration(
                  color: backgroundColor,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 10,
                      offset: const Offset(0, -5),
                    ),
                  ],
                ),
                padding: const EdgeInsets.all(16),
                child: SafeArea(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _buildBottomAction(
                        icon: Icons.list,
                        label: 'Contents',
                        onTap: _showChapterList,
                        color: textColor,
                      ),
                      _buildBottomAction(
                        icon: Icons.text_fields,
                        label: 'Aa',
                        onTap: _showSettings,
                        color: textColor,
                      ),
                      _buildBottomAction(
                        icon: Icons.bookmark_border,
                        label: 'Bookmark',
                        onTap: () {},
                        color: textColor,
                      ),
                      _buildBottomAction(
                        icon: Icons.share,
                        label: 'Share',
                        onTap: () {},
                        color: textColor,
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Color _getBackgroundColor() {
    switch (currentTheme) {
      case ReadingTheme.dark:
        return AppTheme.darkModeBackground;
      case ReadingTheme.sepia:
        return AppTheme.sepiaModeBackground;
      case ReadingTheme.light:
      default:
        return AppTheme.lightModeBackground;
    }
  }

  Color _getTextColor() {
    switch (currentTheme) {
      case ReadingTheme.dark:
        return AppTheme.darkModeText;
      case ReadingTheme.sepia:
        return AppTheme.sepiaModeText;
      case ReadingTheme.light:
      default:
        return AppTheme.lightModeText;
    }
  }

  Widget _buildBottomAction({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    required Color color,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showSettings() {
    showModalBottomSheet(
      context: context,
      backgroundColor: _getBackgroundColor(),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Reading Settings',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: _getTextColor(),
                    ),
              ),
              const SizedBox(height: 24),

              // Theme Selection
              Text(
                'Theme',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: _getTextColor(),
                    ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _buildThemeOption(
                    context,
                    'Light',
                    ReadingTheme.light,
                    setModalState,
                    AppTheme.lightModeBackground,
                    AppTheme.lightModeText,
                  ),
                  const SizedBox(width: 12),
                  _buildThemeOption(
                    context,
                    'Sepia',
                    ReadingTheme.sepia,
                    setModalState,
                    AppTheme.sepiaModeBackground,
                    AppTheme.sepiaModeText,
                  ),
                  const SizedBox(width: 12),
                  _buildThemeOption(
                    context,
                    'Dark',
                    ReadingTheme.dark,
                    setModalState,
                    AppTheme.darkModeBackground,
                    AppTheme.darkModeText,
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // Font Size
              Text(
                'Font Size',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: _getTextColor(),
                    ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Text('A', style: TextStyle(fontSize: 14)),
                  Expanded(
                    child: SliderTheme(
                      data: SliderTheme.of(context).copyWith(
                        trackHeight: 4,
                        thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 8),
                        activeTrackColor: AppTheme.primaryGold,
                        inactiveTrackColor: AppTheme.neutralLightGray,
                        thumbColor: AppTheme.primaryGold,
                      ),
                      child: Slider(
                        value: fontSize,
                        min: 12,
                        max: 28,
                        divisions: 8,
                        onChanged: (value) {
                          setModalState(() {
                            fontSize = value;
                          });
                          setState(() {
                            fontSize = value;
                          });
                        },
                      ),
                    ),
                  ),
                  const Text('A', style: TextStyle(fontSize: 24)),
                ],
              ),

              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Done'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildThemeOption(
    BuildContext context,
    String label,
    ReadingTheme theme,
    StateSetter setModalState,
    Color bgColor,
    Color textColor,
  ) {
    final isSelected = currentTheme == theme;
    return Expanded(
      child: InkWell(
        onTap: () {
          setModalState(() {
            currentTheme = theme;
          });
          setState(() {
            currentTheme = theme;
          });
        },
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: bgColor,
            border: Border.all(
              color: isSelected ? AppTheme.primaryGold : Colors.transparent,
              width: 2,
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                color: textColor,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _showChapterList() {
    showModalBottomSheet(
      context: context,
      backgroundColor: _getBackgroundColor(),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Chapters',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: _getTextColor(),
                  ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 300,
              child: ListView.builder(
                itemCount: 10,
                itemBuilder: (context, index) {
                  final chapterNum = index + 1;
                  final isCurrent = chapterNum == currentChapter;
                  return ListTile(
                    title: Text(
                      'Chapter $chapterNum',
                      style: TextStyle(
                        color: _getTextColor(),
                        fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                    subtitle: Text(
                      'Released ${index + 1} days ago',
                      style: TextStyle(color: AppTheme.neutralGray),
                    ),
                    trailing: isCurrent
                        ? const Icon(Icons.play_circle, color: AppTheme.primaryGold)
                        : null,
                    onTap: () {
                      setState(() {
                        currentChapter = chapterNum;
                      });
                      Navigator.pop(context);
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
