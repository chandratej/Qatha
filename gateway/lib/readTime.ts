/** Rough reading time from HTML/plain text (Telugu ~180 wpm). */
export function estimateReadMinutes(text: string): number {
  const plain = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!plain) return 0;
  const words = plain.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}