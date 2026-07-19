import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:katha_reader/core/models/story.dart';
import 'package:katha_reader/widgets/story_card.dart';

void main() {
  testWidgets('StoryCard fits long title + author without overflow', (tester) async {
    // Constrain to a phone-like width so we catch real overflow.
    await tester.binding.setSurfaceSize(const Size(390, 800));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    final story = Story(
      id: 'long-1',
      title:
          'ఒక చాలా పొడవైన కథా శీర్షిక — monsoon valley secrets and the long road home',
      genre: 'family_drama',
      chapterCount: 24,
      totalReaders: 0,
      authorName: 'సుధా రాణి · pen name near the character limit example',
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              StoryCard(story: story, onTap: () {}, index: 0),
            ],
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    expect(find.text('24 ch'), findsOneWidget);
    expect(find.byIcon(Icons.people_outline), findsOneWidget);
    expect(find.byIcon(Icons.verified_outlined), findsNothing);
  });
}
