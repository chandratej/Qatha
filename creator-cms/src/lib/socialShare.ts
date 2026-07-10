/** Social share helpers — WhatsApp / X deep links (DEC-008, DEC-025). */

export type ShareChannel = 'whatsapp' | 'x' | 'copy';

export function buildShareMessage(
  storyTitle: string,
  chapterTitle?: string,
  chapterNumber?: number,
): string {
  const ch = chapterNumber != null ? `Chapter ${chapterNumber}` : '';
  const title = chapterTitle?.trim() || storyTitle;
  const head = [title, ch].filter(Boolean).join(' · ');
  // Bilingual pride line — highest-leverage organic brand on WhatsApp
  return `${head}\n\nమనసులో నిలిచే కథలు · Read on Katha — Telugu stories. No ads. No coins.`;
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