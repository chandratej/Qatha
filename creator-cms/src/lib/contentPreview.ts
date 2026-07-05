/** Shared renderer: stored HTML → readable plain-text preview. */
export function storedContentToPreviewText(content: string, maxLength = 200): string {
  if (!content) return '';

  const div = document.createElement('div');
  div.innerHTML = content;

  const text = (div.textContent || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) return 'Empty';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}