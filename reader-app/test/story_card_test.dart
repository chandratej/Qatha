import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:katha_reader/core/models/story.dart';
import 'package:katha_reader/core/theme/katha_theme.dart';
import 'package:katha_reader/widgets/story_card.dart';

/// Register the real Noto Sans Telugu metrics under every family the card's
/// text styles reference — the default test font is far shorter than real
/// Telugu conjunct stacks, which is exactly how overflow bugs slip past CI.
Future<void> loadTeluguTestFont() async {
  final file = File('test/fixtures/NotoSansTelugu.ttf');
  if (!file.existsSync()) return;
  final bytes = file.readAsBytesSync();
  for (final family in [
    'NotoSansTelugu',
    'NotoSansTelugu-SemiBold',
    'Outfit',
    'Outfit-Medium',
    'Outfit-SemiBold',
  ]) {
    final loader = FontLoader(family)
      ..addFont(Future.value(ByteData.view(bytes.buffer)));
    await loader.load();
  }
}

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

  testWidgets(
      'StoryCard never overflows at max font scale with tall Telugu content',
      (tester) async {
    // Narrow phone + fontScale 5 + conjunct-heavy Telugu — the exact
    // conditions behind the "BOTTOM OVERFLOWED BY N PIXELS" banners.
    await tester.binding.setSurfaceSize(const Size(360, 780));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    final story = Story(
      id: 'overflow-probe',
      title: 'క్షాత్రవృత్తి — స్త్రీశక్తి మహాక్షేత్రంలో ఒక సుదీర్ఘ కథా శీర్షిక',
      genre: 'family_drama',
      chapterCount: 120,
      totalReaders: 125000,
      authorName: 'శ్రీమతి సూర్యకాంతం చిలకమర్తి వెంకటసుబ్బమ్మ',
    );

    await loadTeluguTestFont();

    // OS accessibility text scaling stacks on the in-app font scale —
    // the real-device trigger for the 2–3px overflow banners.
    for (final fontScale in [2, 3, 5]) {
      for (final textScale in [1.0, 1.3]) {
        await tester.pumpWidget(
          MaterialApp(
            theme: KathaTheme.light(fontScale: fontScale),
            home: MediaQuery(
              data: MediaQueryData(textScaler: TextScaler.linear(textScale)),
              child: Scaffold(
                body: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    StoryCard(story: story, onTap: () {}, index: 0),
                  ],
                ),
              ),
            ),
          ),
        );
        await tester.pumpAndSettle();
        // google_fonts may throw async fetch errors in tests; only layout
        // overflow counts as failure here.
        final overflow = <String>[];
        for (Object? e = tester.takeException();
            e != null;
            e = tester.takeException()) {
          if (e.toString().toLowerCase().contains('overflow')) {
            overflow.add(e.toString().split('\n').first);
          }
        }
        expect(overflow, isEmpty,
            reason:
                'RenderFlex overflow at fontScale $fontScale × textScale $textScale: $overflow');
      }
    }
  });
}
