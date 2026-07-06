import { moderateWithOpenAI } from './providers/openai.js';
import { moderateWithHeuristic } from './providers/heuristic.js';

/**
 * Content moderation gateway — the only entry point the application should call.
 * Translates provider-specific responses into the internal schema.
 *
 * @returns {{ isSafe: boolean, flaggedReason: string, source: 'openai' | 'heuristic' }}
 */
export async function moderateContent(text) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const result = await moderateWithOpenAI(text, apiKey);
      return { ...result, source: 'openai' };
    } catch (err) {
      console.warn('[moderation] OpenAI unavailable, using heuristic fallback:', err.message);
    }
  }

  const result = moderateWithHeuristic(text);
  return { ...result, source: 'heuristic' };
}

/** Maps gateway result to a 0–1 risk score for analytics columns (not for branching). */
export function riskScoreFromResult(result) {
  return result.isSafe ? 0 : 0.85;
}