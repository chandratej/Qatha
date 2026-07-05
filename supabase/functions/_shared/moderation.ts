/** Shared moderation helpers for Edge Functions (mirrors Node moderation.js). */

const HARD_BLOCK_PATTERNS = [
  /\b(child\s*porn|minor\s*sexual)\b/i,
];

export function scoreHeuristicToxicity(content: string): number {
  const lower = (content || '').toLowerCase();
  const toxicPatterns = [
    /\b(kill|hate|stupid|idiot)\b/gi,
    /\b(నువ్వు చంప|ద్వేష)/,
  ];
  let hits = 0;
  for (const pattern of toxicPatterns) {
    const matches = lower.match(pattern);
    if (matches) hits += matches.length;
  }
  return Math.min(0.95, hits * 0.25);
}

export async function analyzeWithPerspective(content: string, apiKey: string): Promise<number> {
  const res = await fetch(
    `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        comment: { text: content },
        languages: ['te', 'en'],
        requestedAttributes: { TOXICITY: {} },
      }),
    },
  );
  if (!res.ok) throw new Error(`Perspective API error: ${res.status}`);
  const data = await res.json();
  return data?.attributeScores?.TOXICITY?.summaryScore?.value ?? 0;
}

export function hasHardBlockViolation(content: string): boolean {
  return HARD_BLOCK_PATTERNS.some((p) => p.test(content || ''));
}

export async function resolveToxicityScore(content: string): Promise<number> {
  const apiKey = Deno.env.get('PERSPECTIVE_API_KEY');
  if (apiKey) {
    try {
      return await analyzeWithPerspective(content, apiKey);
    } catch {
      return scoreHeuristicToxicity(content);
    }
  }
  return scoreHeuristicToxicity(content);
}