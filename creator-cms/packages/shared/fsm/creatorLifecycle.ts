import { createFsm } from './createFsm';

/** Creator lifecycle stages — Vol_01-03 */
export const CREATOR_LIFECYCLE_STAGES = [
  'registered',
  'onboarding',
  'first_draft',
  'first_publish',
  'active',
  'identity_verified',
  'dormant',
  'churned',
] as const;

export type CreatorLifecycleStage = (typeof CREATOR_LIFECYCLE_STAGES)[number];

export const CREATOR_LIFECYCLE_EVENTS = [
  'start_onboarding',
  'complete_onboarding',
  'save_first_draft',
  'publish_first_chapter',
  'verify_identity',
  'resume_activity',
  'mark_dormant',
  'churn',
] as const;

export type CreatorLifecycleEvent = (typeof CREATOR_LIFECYCLE_EVENTS)[number];

export const creatorLifecycleFsm = createFsm<CreatorLifecycleStage, CreatorLifecycleEvent>({
  initial: 'registered',
  transitions: {
    registered: { start_onboarding: 'onboarding' },
    onboarding: { complete_onboarding: 'first_draft', save_first_draft: 'first_draft' },
    first_draft: { publish_first_chapter: 'first_publish' },
    first_publish: { resume_activity: 'active' },
    active: { verify_identity: 'identity_verified', mark_dormant: 'dormant', churn: 'churned' },
    identity_verified: { mark_dormant: 'dormant', churn: 'churned' },
    dormant: { resume_activity: 'active', churn: 'churned' },
    churned: { resume_activity: 'registered' },
  },
});

/** Map onboarding signals to lifecycle events (Wave 1 heuristic). */
export function lifecycleEventFromSignals(signals: {
  onboardingComplete?: boolean;
  hasDraft?: boolean;
  hasPublished?: boolean;
  identityVerified?: boolean;
}): CreatorLifecycleEvent | null {
  if (signals.identityVerified) return 'verify_identity';
  if (signals.hasPublished) return 'publish_first_chapter';
  if (signals.hasDraft) return 'save_first_draft';
  if (signals.onboardingComplete) return 'complete_onboarding';
  return null;
}