/**
 * Advisory AI governance dashboard — LRC-07 governance
 * AI Council: human-in-the-loop audit before production rollout.
 */

import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { isAdvisoryAiLive } from './aiAdvisoryProvider.js';

/** Mirrors aiReviewAdvisoryStore mock buffer for governance reads */
/** @type {object[]} */
const suggestionsMirror = [];

export function registerAdvisorySuggestionForGovernance(row) {
  if (!isMockMode()) return;
  suggestionsMirror.unshift(row);
  if (suggestionsMirror.length > 200) suggestionsMirror.length = 200;
}

async function loadAllSuggestions() {
  if (isMockMode()) return [...suggestionsMirror];

  const { data, error } = await supabase
    .from('ai_review_suggestions')
    .select('id, status, provider, confidence, category, created_at, resolved_at')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getAdvisoryGovernanceDashboard() {
  const rows = await loadAllSuggestions();
  const summary = {
    total: rows.length,
    pending: 0,
    accepted: 0,
    ignored: 0,
    accept_rate_pct: 0,
    by_provider: {},
    by_category: {},
  };

  let resolved = 0;
  for (const row of rows) {
    if (row.status === 'pending') summary.pending += 1;
    else if (row.status === 'accepted') {
      summary.accepted += 1;
      resolved += 1;
    } else if (row.status === 'ignored') {
      summary.ignored += 1;
      resolved += 1;
    }

    const provider = row.provider || 'unknown';
    summary.by_provider[provider] = (summary.by_provider[provider] || 0) + 1;

    const category = row.category || 'general';
    summary.by_category[category] = (summary.by_category[category] || 0) + 1;
  }

  if (resolved > 0) {
    summary.accept_rate_pct = Math.round((summary.accepted / resolved) * 1000) / 10;
  }

  return {
    generated_at: new Date().toISOString(),
    advisory_ai_live: isAdvisoryAiLive(),
    summary,
    recent: rows.slice(0, 12).map((r) => ({
      id: r.id,
      status: r.status,
      provider: r.provider,
      category: r.category,
      confidence: r.confidence,
      created_at: r.created_at,
      resolved_at: r.resolved_at,
    })),
  };
}