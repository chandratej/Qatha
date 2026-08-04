/** Script-aware word counting — uses Intl.Segmenter when available. */
export function countWordsInPlainText(text: string, locale = 'en'): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;

  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const segmenter = new Intl.Segmenter(locale, { granularity: 'word' });
      let count = 0;
      for (const part of segmenter.segment(trimmed)) {
        if (part.isWordLike) count += 1;
      }
      return count;
    } catch {
      /* fall through */
    }
  }

  return trimmed.split(/\s+/).filter(Boolean).length;
}

/**
 * Consistent word count after HTML strip (whitespace tokens).
 * Used for UI display; chapter length is not a publish barrier.
 */
export function countWordsForPublishGate(htmlOrPlain: string): number {
  const plain = String(htmlOrPlain || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!plain) return 0;
  return plain.split(/\s+/).filter(Boolean).length;
}

export function plainTextFromHtml(html: string): string {
  if (!html) return '';
  if (typeof document !== 'undefined') {
    const div = document.createElement('div');
    div.innerHTML = html;
    return (div.textContent || '').trim();
  }
  // SSR / non-DOM fallback — strip tags like the publish gate.
  return String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function countWordsInHtml(html: string, locale = 'en'): number {
  return countWordsInPlainText(plainTextFromHtml(html), locale);
}

export function countWordsInScenes(
  scenes: Array<{ content?: string }>,
  locale = 'en',
): number {
  return scenes.reduce((total, scene) => total + countWordsInHtml(scene.content || '', locale), 0);
}

/** Scene word total using the shared whitespace algorithm. */
export function countPublishWordsInScenes(scenes: Array<{ content?: string }>): number {
  return scenes.reduce(
    (total, scene) => total + countWordsForPublishGate(scene.content || ''),
    0,
  );
}