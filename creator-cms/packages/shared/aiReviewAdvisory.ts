/** LRC-07-D3–D5 — Advisory AI suggestions (human-in-the-loop, never auto-applied) */

export const ADVISORY_SUGGESTION_STATUSES = ['pending', 'accepted', 'ignored'] as const;
export type AdvisorySuggestionStatus = (typeof ADVISORY_SUGGESTION_STATUSES)[number];

export const ADVISORY_PROVIDERS = ['heuristic', 'xai'] as const;
export type AdvisoryProvider = (typeof ADVISORY_PROVIDERS)[number];

export interface AdvisorySuggestion {
  id: string;
  assignment_id: string;
  request_id: string;
  reviewer_slot: string;
  category: string;
  body: string;
  evidence: string;
  confidence: number;
  status: AdvisorySuggestionStatus;
  provider: AdvisoryProvider;
  created_at: string;
  resolved_at?: string | null;
}

export function formatAdvisoryConfidence(confidence: number): string {
  const pct = Math.round(Math.max(0, Math.min(1, confidence)) * 100);
  if (pct >= 80) return 'High';
  if (pct >= 55) return 'Medium';
  return 'Low';
}