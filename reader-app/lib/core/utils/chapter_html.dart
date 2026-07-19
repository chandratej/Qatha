// Quill/editor HTML helpers for the chapter reader.
// Published chapter bodies are HTML strings (Quill output). Never pass them
// straight into a Text widget — tags will show as literal characters.

/// True when [raw] looks like markup rather than plain prose.
bool looksLikeHtml(String raw) {
  return RegExp(r'<[a-zA-Z][!/?]?[^>]*>').hasMatch(raw);
}

/// Strip editor-only formatting that must never ship to readers:
/// highlight/suggestion spans, track-changes, comment anchors, empty paras.
String sanitizePublishedHtml(String html) {
  if (html.isEmpty) return html;
  var out = html;

  // Unwrap highlight / background-color spans (keep inner text).
  // Run a few passes for nested spans.
  for (var i = 0; i < 4; i++) {
    final next = out.replaceAllMapped(
      RegExp(
        r'<span\b[^>]*(?:background(?:-color)?\s*:|style\s*=)[^>]*>([\s\S]*?)</span>',
        caseSensitive: false,
      ),
      (m) {
        final attrs = m.group(0) ?? '';
        // Only unwrap when this is a highlight-style span, not semantic ones.
        if (attrs.toLowerCase().contains('background')) {
          return m.group(1) ?? '';
        }
        return m.group(0) ?? '';
      },
    );
    if (next == out) break;
    out = next;
  }

  // Unwrap generic suggestion / track-change / comment wrappers.
  out = out.replaceAllMapped(
    RegExp(
      r'<span\b[^>]*class\s*=\s*[^>]*?(?:ql-suggestion|suggestion|track-change|comment-anchor)[^>]*>([\s\S]*?)</span>',
      caseSensitive: false,
    ),
    (m) => m.group(1) ?? '',
  );

  // Drop empty comment / annotation anchors.
  out = out.replaceAll(
    RegExp(
      r'<span\b[^>]*data-(?:comment|annotation|suggestion)[^>]*>\s*</span>',
      caseSensitive: false,
    ),
    '',
  );

  // Normalize non-breaking spaces and empty paragraphs.
  out = out.replaceAll('&nbsp;', ' ').replaceAll('\u00a0', ' ');
  out = out.replaceAll(
    RegExp(r'<p>\s*<br\s*/?>\s*</p>', caseSensitive: false),
    '',
  );

  // Scene-break HR: keep a simple marker the reader can style.
  out = out.replaceAllMapped(
    RegExp(
      r'<hr\b[^>]*(?:scene-break|data-scene-break)[^>]*/?>',
      caseSensitive: false,
    ),
    (_) => '<hr class="scene-break" />',
  );

  return out.trim();
}

/// Visible plain text for tests / analytics — tags must not appear here.
String chapterPlainText(String raw) {
  final cleaned = looksLikeHtml(raw) ? sanitizePublishedHtml(raw) : raw;
  return cleaned
      .replaceAll(RegExp(r'<br\s*/?>', caseSensitive: false), '\n')
      .replaceAll(RegExp(r'</p\s*>', caseSensitive: false), '\n\n')
      .replaceAll(RegExp(r'<hr[^>]*/?>', caseSensitive: false), '\n***\n')
      .replaceAll(RegExp(r'<[^>]+>'), ' ')
      .replaceAll(RegExp(r'[ \t]+\n'), '\n')
      .replaceAll(RegExp(r'\n{3,}'), '\n\n')
      .replaceAll(RegExp(r'[ \t]{2,}'), ' ')
      .trim();
}

/// True if rendered/plain output still leaks raw markup (regression guard).
bool containsRawMarkupLeak(String plain) {
  return RegExp(r'<(?:p|span|hr|div|br)\b', caseSensitive: false).hasMatch(plain) ||
      plain.contains('background-color') ||
      plain.contains('data-scene-break');
}
