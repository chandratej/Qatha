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

export function plainTextFromHtml(html: string): string {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || '').trim();
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