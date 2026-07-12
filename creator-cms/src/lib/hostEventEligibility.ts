/**
 * Elite host privilege — admin/founder OR top-25 ranked author/reviewer.
 */

import type { AuthUser } from '../context/AuthContext';

export const ELITE_HOST_RANK_THRESHOLD = 25;

export interface HostEligibilityContext {
  authorRank?: number | null;
  reviewerRank?: number | null;
}

export type HostEligibilityUser = Pick<AuthUser, 'id' | 'role'> & {
  author_rank?: number | null;
  reviewer_rank?: number | null;
};

export function canHostEvent(
  user: HostEligibilityUser | null,
  context?: HostEligibilityContext,
): boolean {
  if (!user) return false;

  const privilegedRoles = new Set(['admin', 'founder']);
  if (privilegedRoles.has(user.role)) return true;

  const authorRank = context?.authorRank ?? user.author_rank ?? null;
  const reviewerRank = context?.reviewerRank ?? user.reviewer_rank ?? null;

  if (authorRank != null && authorRank > 0 && authorRank <= ELITE_HOST_RANK_THRESHOLD) {
    return true;
  }
  if (reviewerRank != null && reviewerRank > 0 && reviewerRank <= ELITE_HOST_RANK_THRESHOLD) {
    return true;
  }

  return false;
}

export function hostEligibilityMessage(locale: 'en' | 'te'): string {
  if (locale === 'te') {
    return 'ఈవెంట్ హోస్ట్ చేయడం ఎలిట్ సృజనకర్తలకు మాత్రమే — అగ్ర 25 ర్యాంక్ రచయితలు, రివ్యూయర్లు, లేదా కథా ఫౌండర్లు.';
  }
  return 'Hosting events is an elite privilege — top-25 ranked authors, reviewers, or Katha founders only.';
}