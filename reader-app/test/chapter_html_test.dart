import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:katha_reader/core/utils/chapter_html.dart';
import 'package:katha_reader/widgets/chapter_body.dart';

void main() {
  group('chapter_html sanitize', () {
    test('strips highlight spans and never leaks tags in plain text', () {
      const raw = '''
<p>ఆ రోజు <span style="background-color: rgb(255, 243, 205);">ఉదయం</span>,</p>
<hr class="scene-break" data-scene-break="true" />
<p>తర్వాత.</p>
''';
      final cleaned = sanitizePublishedHtml(raw);
      expect(cleaned.contains('background-color'), isFalse);
      expect(cleaned.contains('rgb(255'), isFalse);

      final plain = chapterPlainText(raw);
      expect(containsRawMarkupLeak(plain), isFalse);
      expect(plain.contains('<p>'), isFalse);
      expect(plain.contains('<span'), isFalse);
      expect(plain.contains('<hr'), isFalse);
      expect(plain, contains('ఉదయం'));
      expect(plain, contains('***'));
    });

    test('detects HTML bodies', () {
      expect(looksLikeHtml('<p>hello</p>'), isTrue);
      expect(looksLikeHtml('plain telugu prose'), isFalse);
    });

    test('parseChapterBlocks yields prose without raw tags', () {
      const raw = '''
<p>First paragraph with <span style="background-color: rgb(255, 243, 205);">highlight</span>.</p>
<hr class="scene-break" data-scene-break="true" />
<p>Second paragraph.</p>
''';
      final blocks = parseChapterBlocks(raw);
      expect(blocks.length, greaterThanOrEqualTo(3));
      expect(blocks.whereType<SceneBreakBlock>(), isNotEmpty);
      final texts = blocks.whereType<ParagraphBlock>().map((b) => b.text).join(' | ');
      expect(containsRawMarkupLeak(texts), isFalse);
      expect(texts, contains('First paragraph'));
      expect(texts, contains('highlight'));
      expect(texts, contains('Second paragraph'));
      expect(texts.contains('<p>'), isFalse);
      expect(texts.contains('<span'), isFalse);
      expect(texts.contains('<hr'), isFalse);
    });
  });

  group('ChapterBody widget', () {
    testWidgets('does not paint raw <p>, <span, or <hr in the tree text', (
      tester,
    ) async {
      const raw = '''
<p>First paragraph with <span style="background-color: rgb(255, 243, 205);">highlight</span>.</p>
<hr class="scene-break" data-scene-break="true" />
<p>Second paragraph.</p>
''';

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: ChapterBody(
                content: raw,
                isDark: false,
                fontScale: 2,
                lineHeight: 1.82,
                textAlign: TextAlign.left,
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.textContaining('First paragraph'), findsOneWidget);
      expect(find.textContaining('Second paragraph'), findsOneWidget);
      expect(find.text('• • •'), findsOneWidget);

      // Collect every Text widget's data — none may still show markup.
      final texts = find.byType(Text).evaluate().map((e) {
        final w = e.widget as Text;
        return w.data ?? '';
      }).join('\n');

      expect(texts.contains('<p>'), isFalse);
      expect(texts.contains('<span'), isFalse);
      expect(texts.contains('<hr'), isFalse);
      expect(texts.contains('background-color'), isFalse);
    });
  });
}
