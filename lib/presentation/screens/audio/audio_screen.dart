/// StoryVerse Audio Screen
/// Audio player and listening queue

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:storyverse/core/theme/app_theme.dart';

class AudioScreen extends ConsumerStatefulWidget {
  const AudioScreen({super.key});

  @override
  ConsumerState<AudioScreen> createState() => _AudioScreenState();
}

class _AudioScreenState extends ConsumerState<AudioScreen> {
  bool isPlaying = false;
  double playbackPosition = 0.35;
  double playbackSpeed = 1.0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.neutralOffWhite,
      appBar: AppBar(
        title: const Text('Audio Player'),
        actions: [
          IconButton(
            icon: const Icon(Icons.queue_music),
            onPressed: _showQueue,
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              // Album Art / Story Cover
              Container(
                width: double.infinity,
                height: 300,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.2),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(24),
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          AppTheme.primaryGold.withOpacity(0.3),
                          AppTheme.accentBronze.withOpacity(0.3),
                        ],
                      ),
                    ),
                    child: const Center(
                      child: Icon(
                        Icons.headphones,
                        size: 80,
                        color: AppTheme.primaryGold,
                      ),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 32),

              // Story Info
              Text(
                'The Last Chapter',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'By Jane Author',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppTheme.neutralGray,
                    ),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 32),

              // Progress Bar
              Column(
                children: [
                  SliderTheme(
                    data: SliderTheme.of(context).copyWith(
                      trackHeight: 4,
                      thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 8),
                      overlayShape: const RoundSliderOverlayShape(overlayRadius: 16),
                      activeTrackColor: AppTheme.primaryGold,
                      inactiveTrackColor: AppTheme.neutralLightGray,
                      thumbColor: AppTheme.primaryGold,
                    ),
                    child: Slider(
                      value: playbackPosition,
                      onChanged: (value) {
                        setState(() {
                          playbackPosition = value;
                        });
                      },
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '12:30',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppTheme.neutralGray,
                              ),
                        ),
                        Text(
                          '35:00',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppTheme.neutralGray,
                              ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // Playback Controls
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  IconButton(
                    icon: const Icon(Icons.skip_previous, size: 40),
                    onPressed: () {},
                    color: AppTheme.neutralDarkGray,
                  ),
                  IconButton(
                    icon: Icon(
                      isPlaying ? Icons.pause_circle : Icons.play_circle,
                      size: 80,
                    ),
                    onPressed: () {
                      setState(() {
                        isPlaying = !isPlaying;
                      });
                    },
                    color: AppTheme.primaryGold,
                  ),
                  IconButton(
                    icon: const Icon(Icons.skip_next, size: 40),
                    onPressed: () {},
                    color: AppTheme.neutralDarkGray,
                  ),
                ],
              ),

              const SizedBox(height: 32),

              // Additional Controls
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildControlButton(
                    icon: Icons.timer_outlined,
                    label: 'Sleep Timer',
                    onTap: _showSleepTimer,
                  ),
                  _buildControlButton(
                    icon: Icons.speed,
                    label: '${playbackSpeed}x Speed',
                    onTap: _showSpeedOptions,
                  ),
                  _buildControlButton(
                    icon: Icons.bookmark_border,
                    label: 'Bookmark',
                    onTap: () {},
                  ),
                ],
              ),

              const SizedBox(height: 32),

              // Premium Notice
              if (true) // Replace with actual premium check
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryGold.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.primaryGold.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.star, color: AppTheme.primaryGold),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Premium Audio',
                              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                    color: AppTheme.primaryGold,
                                  ),
                            ),
                            Text(
                              'Upgrade to unlock AI narration for all stories',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: AppTheme.neutralDarkGray,
                                  ),
                            ),
                          ],
                        ),
                      ),
                      TextButton(
                        onPressed: () {},
                        child: const Text('Upgrade'),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildControlButton({
    required IconData icon,
    required String label,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Column(
          children: [
            Icon(icon, color: AppTheme.neutralDarkGray, size: 28),
            const SizedBox(height: 4),
            Text(
              label,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: AppTheme.neutralGray,
                  ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  void _showQueue() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Up Next',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            _buildQueueItem('Chapter 5', 'The Last Chapter', true),
            _buildQueueItem('Chapter 6', 'The Last Chapter', false),
            _buildQueueItem('Chapter 1', 'Another Story', false),
          ],
        ),
      ),
    );
  }

  Widget _buildQueueItem(String chapter, String story, bool isPlaying) {
    return ListTile(
      leading: Icon(
        isPlaying ? Icons.volume_up : Icons.music_note,
        color: isPlaying ? AppTheme.primaryGold : AppTheme.neutralGray,
      ),
      title: Text(chapter),
      subtitle: Text(story),
      trailing: isPlaying
          ? Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.primaryGold.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                'Playing',
                style: TextStyle(
                  color: AppTheme.primaryGold,
                  fontSize: 12,
                ),
              ),
            )
          : const Icon(Icons.more_vert),
    );
  }

  void _showSleepTimer() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Sleep Timer',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                '15 min',
                '30 min',
                '45 min',
                '1 hour',
                'End of chapter'
              ]
                  .map((option) => ChoiceChip(
                        label: Text(option),
                        onSelected: (selected) {
                          Navigator.pop(context);
                        },
                      ))
                  .toList(),
            ),
          ],
        ),
      ),
    );
  }

  void _showSpeedOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Playback Speed',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0]
                  .map((speed) => ChoiceChip(
                        label: Text('${speed}x'),
                        selected: playbackSpeed == speed,
                        onSelected: (selected) {
                          if (selected) {
                            setState(() {
                              playbackSpeed = speed;
                            });
                          }
                          Navigator.pop(context);
                        },
                      ))
                  .toList(),
            ),
          ],
        ),
      ),
    );
  }
}
