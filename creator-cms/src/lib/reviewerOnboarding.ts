const ONBOARDING_KEY = 'katha_reviewer_onboarding';

export type ReviewerOnboardingStatus =
  | 'not_applied'
  | 'applied'
  | 'training'
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
    status: 'certified',
    trainingCompleted: true,
    certifiedAt: new Date().toISOString(),
  };
  return saveReviewerOnboarding(record);
}