/** PRD §10 — Community governance */

export const REPORT_CATEGORIES = [
  { id: 'copyright', label: 'Copyright' },
  { id: 'spam', label: 'Spam' },
  { id: 'abuse', label: 'Abuse' },
  { id: 'adult_content', label: 'Adult Content' },
  { id: 'wrong_category', label: 'Wrong Category' },
  { id: 'offensive_content', label: 'Offensive Content' },
] as const;

export type ReportCategoryId = (typeof REPORT_CATEGORIES)[number]['id'];

export const REPORT_STATUSES = ['open', 'threshold_met', 'moderator_review', 'community_review', 'resolved', 'appealed'] as const;

export const GOVERNANCE_SAFEGUARDS = {
  abuseDetection: true,
  rateLimitReportsPerDay: 5,
  appealEnabled: true,
  auditLogEnabled: true,
  reportsDoNotAutoPenalize: true,
} as const;