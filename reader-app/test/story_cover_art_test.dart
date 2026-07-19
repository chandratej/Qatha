import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:katha_reader/widgets/story_cover_art.dart';

void main() {
  Widget host(Widget child) => MaterialApp(
        home: Scaffold(
          body: Center(
            child: SizedBox(width: 100, height: 148, child: child),
          ),
        ),
      );

  testWidgets('renders Telugu title and కథ colophon without overflow',
      (tester) async {
    await tester.pumpWidget(host(const StoryCoverArt(
      title: 'వర్షం వచ్చే ముందు — a long mixed-script title for sizing',
      seed: 'story-1',
    )));
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    expect(
      find.textContaining('వర్షం వచ్చే ముందు'),
      findsOneWidget,
    );
    expect(find.text('కథ'), findsOneWidget);
  });

  testWidgets('same seed always yields the same palette', (tester) async {
    await tester.pumpWidget(host(const StoryCoverArt(
      title: 'Title A',
      seed: 'demo-valley-te',
    )));
    final firstKey = tester
        .widget<Container>(find.byWidgetPredicate((w) =>
            w is Container &&
            w.key is ValueKey &&
            (w.key as ValueKey).value.toString().startsWith('cover-palette-')))
        .key;

    // Different title, same seed — palette must not change.
    await tester.pumpWidget(host(const StoryCoverArt(
      title: 'Completely different title',
      seed: 'demo-valley-te',
    )));
    final secondKey = tester
        .widget<Container>(find.byWidgetPredicate((w) =>
            w is Container &&
            w.key is ValueKey &&
            (w.key as ValueKey).value.toString().startsWith('cover-palette-')))
        .key;

    expect(firstKey, equals(secondKey));
  });
}
