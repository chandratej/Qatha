/** Heuristic moderation provider — internal fallback when no API key or provider is down. */

const TOXIC_PATTERNS = [
  /\b(kill|hate|stupid|idiot)\b/gi,
  /\b(నువ్వు చంప|ద్వేష)/,
];

export function moderateWithHeuristic(text) {
  const content = text || '';
  let hits = 0;

  for (const pattern of TOXIC_PATTERNS) {
    const matches = content.toLowerCase().match(pattern);
    if (matches) hits += matches.length;
  }

  if (hits >= 3) {
    return { isSafe: false, flaggedReason: 'heuristic: toxic language detected' };
  }

  return { isSafe: true, flaggedReason: '' };
}