import { pushLocalNotification } from './notificationsLocal';

const ONBOARDING_KEY = 'katha_reviewer_onboarding';

export type ReviewerOnboardingStatus =
  | 'not_applied'
  | 'applied'
  | 'training'
  | 'pending_moderation'
  | 'certified'
  | 'suspended';

export interface ReviewerOnboardingRecord {
  userId: string;
  status: ReviewerOnboardingStatus;
  appliedAt?: string;
  certifiedAt?: string;
  genres: string[];
  languages: string[];
  motivation: string;
  trainingCompleted: boolean;
}

export function loadReviewerOnboarding(userId: string): ReviewerOnboardingRecord {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    if (raw) {
      const map = JSON.parse(raw) as Record<string, ReviewerOnboardingRecord>;
      if (map[userId]) return map[userId]!;
    }
  } catch { /* ignore */ }
  return {
    userId,
    status: 'not_applied',
    genres: [],
    languages: ['telugu'],
    motivation: '',
    trainingCompleted: false,
  };
}

export function saveReviewerOnboarding(record: ReviewerOnboardingRecord): ReviewerOnboardingRecord {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    const map = raw ? JSON.parse(raw) as Record<string, ReviewerOnboardingRecord> : {};
    map[record.userId] = record;
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(map));
  } catch { /* ignore */ }
  return record;
}

export function applyToReviewerPool(
  userId: string,
  opts: { genres: string[]; languages: string[]; motivation: string },
): ReviewerOnboardingRecord {
  const record: ReviewerOnboardingRecord = {
    userId,
    status: 'applied',
    appliedAt: new Date().toISOString(),
    genres: opts.genres,
    languages: opts.languages,
    motivation: opts.motivation,
    trainingCompleted: false,
  };
  return saveReviewerOnboarding(record);
}

export function completeReviewerTraining(userId: string): ReviewerOnboardingRecord {
  const current = loadReviewerOnboarding(userId);
  const record: ReviewerOnboardingRecord = {
    ...current,
    status: 'pending_moderation',
    trainingCompleted: true,
  };
  return saveReviewerOnboarding(record);
}

/** Local-only moderation fallback when platform API is off */
export function listPendingReviewerApplicationsLocal(): Array<{
  user_id: string;
  status: string;
  genres: string[];
  motivation: string;
  applied_at?: string;
}> {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    if (!raw) return [];
    const map = JSON.parse(raw) as Record<string, ReviewerOnboardingRecord>;
    return Object.values(map)
      .filter((r) => r.status === 'pending_moderation')
      .map((r) => ({
        user_id: r.userId,
        status: r.status,
        genres: r.genres,
        motivation: r.motivation,
        applied_at: r.appliedAt,
      }));
  } catch {
    return [];
  }
}

export function moderateReviewerApplicationLocal(
  reviewerId: string,
  decision: 'approve' | 'reject',
): ReviewerOnboardingRecord {
  const current = loadReviewerOnboarding(reviewerId);
  if (current.status !== 'pending_moderation') {
    throw new Error('No pending application for this reviewer');
  }
  const record: ReviewerOnboardingRecord = {
    ...current,
    status: decision === 'approve' ? 'certified' : 'suspended',
    certifiedAt: decision === 'approve' ? new Date().toISOString() : undefined,
  };
  const saved = saveReviewerOnboarding(record);
  const approved = decision === 'approve';
  pushLocalNotification(reviewerId, 'moderation_outcome', {
    domain: 'moderation',
    priority: 'actionable',
    title: approved ? 'Reviewer Pool application approved' : 'Reviewer application decision',
    body: approved
      ? 'Welcome to the Reviewer Pool. Complete training to receive assignments.'
      : 'Your Reviewer Pool application was not approved. You may reapply after addressing feedback.',
    action_url: '/reviewers',
  });
  return saved;
}