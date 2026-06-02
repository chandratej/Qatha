import 'package:flutter/material.dart';

/// Placeholder widget for story cards while loading
class StoryCardPlaceholder extends StatelessWidget {
  final bool isGrid;

  const StoryCardPlaceholder({super.key, this.isGrid = false});

  @override
  Widget build(BuildContext context) {
    if (isGrid) {
      return Card(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 200,
              color: Colors.grey[300],
            ),
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildPlaceholderLine(width: 120, height: 16),
                  const SizedBox(height: 8),
                  _buildPlaceholderLine(width: 80, height: 12),
                  const SizedBox(height: 8),
                  _buildPlaceholderLine(width: 100, height: 12),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return Card(
      child: Row(
        children: [
          Container(
            width: 120,
            height: 160,
            color: Colors.grey[300],
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(12.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildPlaceholderLine(width: 150, height: 18),
                  const SizedBox(height: 8),
                  _buildPlaceholderLine(width: 100, height: 14),
                  const SizedBox(height: 8),
                  _buildPlaceholderLine(width: 120, height: 14),
                  const Spacer(),
                  _buildPlaceholderLine(width: 80, height: 12),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlaceholderLine({required double width, required double height}) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.grey[300],
        borderRadius: BorderRadius.circular(4),
      ),
    );
  }
}
