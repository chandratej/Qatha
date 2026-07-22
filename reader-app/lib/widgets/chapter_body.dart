import 'package:flutter/material.dart';
import '../core/theme/katha_theme.dart';
import '../core/utils/chapter_html.dart';

/// Renders published chapter content (HTML or plain) without leaking tags.
class ChapterBody extends StatelessWidget {
  final String content;
  final ReadingTone tone;
  final int fontScale;
  final double lineHeight;
  final TextAlign textAlign;

  const ChapterBody({
    super.key,
    required this.content,
    required this.tone,
    required this.fontScale,
    required this.lineHeight,
    required this.textAlign,
  });

  @override
  Widget build(BuildContext context) {
    final style = KathaTheme.readingStyle(
      tone: tone,
      fontScale: fontScale,
      lineHeight: lineHeight,
    );

    final blocks = parseChapterBlocks(content);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final block in blocks)
          if (block is SceneBreakBlock)
            _sceneBreak(style)
          else if (block is ParagraphBlock)
            Padding(
              padding: const EdgeInsets.only(bottom: 22),
              child: Text(block.text, style: style, textAlign: textAlign),
            ),
      ],
    );
  }

  Widget _sceneBreak(TextStyle style) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 32),
      child: Center(
        child: Text(
          '• • •',
          style: style.copyWith(
            color: KathaTheme.readingMuted(tone),
            letterSpacing: 12,
            fontSize: (style.fontSize ?? 16) * 0.82,
            fontWeight: FontWeight.w400,
          ),
        ),
      ),
    );
  }
}

/// Structural blocks produced from HTML or plain chapter bodies.
sealed class ChapterBlock {
  const ChapterBlock();
}

class ParagraphBlock extends ChapterBlock {
  final String text;
  const ParagraphBlock(this.text);
}

class SceneBreakBlock extends ChapterBlock {
  const SceneBreakBlock();
}

/// Parse chapter body into reader blocks. Sanitizes editor chrome first.
List<ChapterBlock> parseChapterBlocks(String raw) {
  if (raw.trim().isEmpty) return const [];

  if (!looksLikeHtml(raw)) {
    return _plainToBlocks(raw);
  }

  final html = sanitizePublishedHtml(raw);
  return _htmlToBlocks(html);
}

List<ChapterBlock> _plainToBlocks(String content) {
  final paras = content.split('\n\n').where((p) => p.trim().isNotEmpty);
  final out = <ChapterBlock>[];
  for (final p in paras) {
    final trimmed = p.trim();
    if (trimmed == '***' || RegExp(r'^[\*\-\•\.\s]{2,}$').hasMatch(trimmed)) {
      out.add(const SceneBreakBlock());
    } else {
      out.add(ParagraphBlock(trimmed));
    }
  }
  return out;
}

List<ChapterBlock> _htmlToBlocks(String html) {
  final out = <ChapterBlock>[];

  // Split on block-level boundaries while keeping scene-break markers.
  final parts = html.split(
    RegExp(
      r'(?=<p\b)|(?=<hr\b)|(?=<div\b)|(?=<h[1-6]\b)',
      caseSensitive: false,
    ),
  );

  for (final part in parts) {
    final chunk = part.trim();
    if (chunk.isEmpty) continue;

    if (RegExp(r'^<hr\b', caseSensitive: false).hasMatch(chunk) ||
        RegExp(r'scene-break', caseSensitive: false).hasMatch(chunk) &&
            RegExp(r'<hr\b', caseSensitive: false).hasMatch(chunk)) {
      out.add(const SceneBreakBlock());
      // Remainder after self-closing hr (if any text glued on).
      final after = chunk.replaceFirst(
        RegExp(r'<hr\b[^>]*/?>', caseSensitive: false),
        '',
      );
      final text = _stripTagsToText(after);
      if (text.isNotEmpty) out.add(ParagraphBlock(text));
      continue;
    }

    final text = _stripTagsToText(chunk);
    if (text.isEmpty) continue;

    // Multiple paragraphs glued: split on double newlines introduced by </p>
    for (final para in text.split(RegExp(r'\n{2,}'))) {
      final t = para.trim();
      if (t.isEmpty) continue;
      if (t == '***') {
        out.add(const SceneBreakBlock());
      } else {
        out.add(ParagraphBlock(t));
      }
    }
  }

  if (out.isEmpty) {
    final fallback = _stripTagsToText(html);
    if (fallback.isNotEmpty) out.add(ParagraphBlock(fallback));
  }

  return out;
}

String _stripTagsToText(String html) {
  return html
      .replaceAll(RegExp(r'<br\s*/?>', caseSensitive: false), '\n')
      .replaceAll(RegExp(r'</p\s*>', caseSensitive: false), '\n\n')
      .replaceAll(RegExp(r'</div\s*>', caseSensitive: false), '\n\n')
      .replaceAll(RegExp(r'</h[1-6]\s*>', caseSensitive: false), '\n\n')
      .replaceAll(RegExp(r'<[^>]+>'), '')
      .replaceAll('&nbsp;', ' ')
      .replaceAll('&amp;', '&')
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&quot;', '"')
      .replaceAll(RegExp(r'[ \t]+\n'), '\n')
      .replaceAll(RegExp(r'\n{3,}'), '\n\n')
      .replaceAll(RegExp(r'[ \t]{2,}'), ' ')
      .trim();
}
