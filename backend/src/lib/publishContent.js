/**
 * Publish-pipeline content hygiene.
 * Strips editor-only markup and estimates reading time from real word count.
 */

const WORDS_PER_MINUTE = 180; // Telugu long-form comfort (matches gateway/lib/readTime.ts)

/** Remove highlight/suggestion/track-change chrome that must not ship to readers. */
export function sanitizePublishedContent(html) {
  if (!html || typeof html !== 'string') return '';
  let out = html;

  // Unwrap background-color / highlight spans (keep text). Nested: multi-pass.
  for (let i = 0; i < 5; i++) {
    const next = out.replace(
      /<span\b[^>]*(?:background(?:-color)?\s*:|style\s*=)[^>]*>([\s\S]*?)<\/span>/gi,
      (full, inner) => (/background/i.test(full) ? inner : full),
    );
    if (next === out) break;
    out = next;
  }

  out = out.replace(
    /<span\b[^>]*class\s*=\s*[^>]*?(?:ql-suggestion|suggestion|track-change|comment-anchor)[^>]*>([\s\S]*?)<\/span>/gi,
    '$1',
  );
  out = out.replace(
    /<span\b[^>]*data-(?:comment|annotation|suggestion)[^>]*>\s*<\/span>/gi,
    '',
  );

  out = out.replace(/&nbsp;/g, ' ').replace(/\u00a0/g, ' ');
  out = out.replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '');

  // Normalize scene-break HRs for consistent reader rendering.
  out = out.replace(
    /<hr\b[^>]*(?:scene-break|data-scene-break)[^>]*\/?>/gi,
    '<hr class="scene-break" data-scene-break="true" />',
  );

  return out.trim();
}

/** Plain-text word count from HTML or plain content. */
export function countWordsFromContent(content) {
  if (!content) return 0;
  const plain = String(content)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!plain) return 0;
  return plain.split(/\s+/).filter(Boolean).length;
}

/** Estimated minutes — never under-count real manuscripts as "1 min". */
export function estimateReadTimeMinutes(content) {
  const words = countWordsFromContent(content);
  if (words <= 0) return 1;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/**
 * Known copyrighted film / celebrity IP phrases that must not appear in
 * reader-facing catalog copy. Replacements keep prose readable.
 */
const IP_REPLACEMENTS = [
  { re: /\bS\.?\s*S\.?\s*Rajamouli\b/gi, to: 'a celebrated director' },
  { re: /\bRajamouli\b/gi, to: 'a celebrated director' },
  { re: /\bAllu\s*Arjun\b/gi, to: 'a star performer' },
  { re: /\bRRR\b/g, to: 'an epic period drama' },
  { re: /రౌద్రం\s*రణం\s*రుధిరం/g, to: 'ఒక ఇతిహాస కథ' },
  { re: /రామరాజు/g, to: 'నాయకుడు' },
];

/** Rewrite reader-facing description text that names real film IP. */
export function sanitizeStoryDescription(description) {
  if (!description || typeof description !== 'string') return description;
  let out = description;
  for (const { re, to } of IP_REPLACEMENTS) {
    out = out.replace(re, to);
  }
  return out;
}
