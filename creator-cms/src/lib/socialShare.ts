/** Social share helpers — WhatsApp / X deep links for chapter growth loop (V3 §4.5). */

export function buildShareMessage(storyTitle: string, chapterTitle?: string, chapterNumber?: number): string {
  const ch = chapterNumber != null ? `Chapter ${chapterNumber}` : '';
  const title = chapterTitle?.trim() || storyTitle;
  return [title, ch, 'Read on Katha — Telugu stories. No ads. No coins.'].filter(Boolean).join(' · ');
}

export function shareViaWhatsApp(url: string, message?: string): void {
  const text = encodeURIComponent(message ? `${message}\n\n${url}` : url);
  window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
}

export function shareViaX(url: string, message?: string): void {
  const params = new URLSearchParams({
    url,
    ...(message ? { text: message } : {}),
  });
  window.open(`https://twitter.com/intent/tweet?${params}`, '_blank', 'noopener,noreferrer');
}