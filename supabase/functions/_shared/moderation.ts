/** Content moderation gateway — mirrors backend/src/services/moderation/gateway.js */

const OPENAI_MODERATION_URL = 'https://api.openai.com/v1/moderations';
const OPENAI_MODERATION_MODEL = 'omni-moderation-latest';

const HARD_BLOCK_PATTERNS = [
  /\b(child\s*porn|minor\s*sexual)\b/i,
];

const TOXIC_PATTERNS = [
  /\b(kill|hate|stupid|idiot)\b/gi,
  /\b(నువ్వు చంప|ద్వేష)/,
];

export type ModerationResult = {
  isSafe: boolean;
  flaggedReason: string;
  source: 'openai' | 'heuristic';
};

function flaggedCategories(categories: Record<string, boolean> = {}) {
  return Object.entries(categories)
    .filter(([, flagged]) => flagged)
    .map(([name]) => name.replace(/_/g, ' '));
}

async function moderateWithOpenAI(text: string, apiKey: string): Promise<Pick<ModerationResult, 'isSafe' | 'flaggedReason'>> {
  const res = await fetch(OPENAI_MODERATION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: text,
      model: OPENAI_MODERATION_MODEL,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI Moderation API error: ${res.status}`);

  const data = await res.json();
  const result = data?.results?.[0];
  if (!result) throw new Error('OpenAI Moderation API returned no results');

  if (!result.flagged) return { isSafe: true, flaggedReason: '' };

  const categories = flaggedCategories(result.categories);
  return {
    isSafe: false,
    flaggedReason: categories.length > 0 ? categories.join(', ') : 'policy violation',
  };
}

function moderateWithHeuristic(text: string): Pick<ModerationResult, 'isSafe' | 'flaggedReason'> {
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

/** Gateway entry point — the only moderation function Edge Functions should call. */
export async function moderateContent(text: string): Promise<ModerationResult> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');

  if (apiKey) {
    try {
      const result = await moderateWithOpenAI(text, apiKey);
      return { ...result, source: 'openai' };
    } catch (err) {
      console.warn('[moderation] OpenAI unavailable, using heuristic fallback:', (err as Error).message);
    }
  }

  const result = moderateWithHeuristic(text);
  return { ...result, source: 'heuristic' };
}

export function riskScoreFromResult(result: ModerationResult): number {
  return result.isSafe ? 0 : 0.85;
}

export function hasHardBlockViolation(content: string): boolean {
  return HARD_BLOCK_PATTERNS.some((p) => p.test(content || ''));
}