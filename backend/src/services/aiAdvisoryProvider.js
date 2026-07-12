/**
 * Advisory AI provider — LRC-07-D4/D5/D6
 * SpaceXAI (xAI) behind feature flag; heuristics when disabled or unavailable.
 */

const XAI_BASE = 'https://api.x.ai/v1';
const DEFAULT_MODEL = 'grok-4.5';

function advisoryEnabled() {
  return process.env.ADVISORY_AI_ENABLED === 'true' && Boolean(process.env.XAI_API_KEY);
}

function heuristicSuggestions({ genre, excerpt }) {
  const text = String(excerpt || '').slice(0, 2000);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const suggestions = [
    {
      category: 'pacing',
      body: 'Check whether the scene opening establishes stakes within the first two paragraphs.',
      evidence: text.slice(0, 120) || 'Opening passage',
      confidence: 0.62,
      provider: 'heuristic',
    },
    {
      category: 'dialogue',
      body: 'Scan dialogue blocks for distinct character voice — avoid interchangeable phrasing.',
      evidence: 'Manuscript dialogue scan',
      confidence: 0.58,
      provider: 'heuristic',
    },
    {
      category: 'reader_engagement',
      body: `For ${genre || 'this genre'}, verify the chapter ends with a narrative pull into the next beat.`,
      evidence: text.slice(-120) || 'Closing passage',
      confidence: wordCount > 400 ? 0.71 : 0.55,
      provider: 'heuristic',
    },
  ];
  return suggestions.slice(0, 3);
}

async function xaiSuggestions({ genre, excerpt }) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error('XAI_API_KEY not configured');

  const prompt = `You are an advisory literary craft assistant for peer reviewers. Suggest exactly 3 craft observations — never decisions or accept/reject verdicts. Genre: ${genre || 'literary'}.

Return JSON array only:
[{"category":"pacing|dialogue|character|theme|...","body":"actionable craft note","evidence":"quoted phrase from excerpt","confidence":0.0-1.0}]

Manuscript excerpt:
${String(excerpt || '').slice(0, 3500)}`;

  const res = await fetch(`${XAI_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.XAI_ADVISORY_MODEL || DEFAULT_MODEL,
      messages: [
        { role: 'system', content: 'Respond with valid JSON array only. Advisory craft notes — human reviewer decides.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`xAI advisory failed: ${res.status} ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content || '[]';
  const parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, ''));
  if (!Array.isArray(parsed)) throw new Error('xAI returned non-array response');

  return parsed.slice(0, 5).map((row) => ({
    category: String(row.category || 'craft').slice(0, 40),
    body: String(row.body || '').slice(0, 500),
    evidence: String(row.evidence || '').slice(0, 300),
    confidence: Math.min(1, Math.max(0, Number(row.confidence) || 0.6)),
    provider: 'xai',
  })).filter((s) => s.body.length >= 10);
}

/**
 * Generate advisory suggestions — never blocks review on failure.
 */
export async function generateAdvisorySuggestions(ctx = {}) {
  try {
    if (advisoryEnabled()) {
      const rows = await xaiSuggestions(ctx);
      if (rows.length > 0) return rows;
    }
  } catch (err) {
    console.warn('[aiAdvisoryProvider] xAI fallback to heuristics:', err.message);
  }
  return heuristicSuggestions(ctx);
}

export function isAdvisoryAiLive() {
  return advisoryEnabled();
}