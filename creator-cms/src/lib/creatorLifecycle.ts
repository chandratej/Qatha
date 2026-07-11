/**
 * Creator lifecycle + persona sync — Vol_01-02/03 (V01-02-D2)
 */

import { creatorLifecycleFsm, type CreatorLifecycleStage } from '../../../packages/shared/fsm';
import { defaultPersonaFromOnboarding, type CreatorPersona } from '../../../packages/shared/creator-persona';
import { api } from './api';

export function deriveLifecycleStage(signals: {
  accountReady?: boolean;
  hasStories?: boolean;
  hasChapters?: boolean;
  hasPublished?: boolean;
  onboardingComplete?: boolean;
}): CreatorLifecycleStage {
  if (signals.hasPublished) return 'first_publish';
  if (signals.hasChapters) return 'first_draft';
  if (signals.hasStories) return 'onboarding';
  if (signals.accountReady) return 'registered';
  return creatorLifecycleFsm.initial;
}

export function derivePersona(signals: {
  wantsToReview?: boolean;
  hasPublished?: boolean;
}): CreatorPersona {
  return defaultPersonaFromOnboarding(signals);
}

/** Persist lifecycle + persona to backend when available. */
export async function syncCreatorProfileFromOnboarding(signals: {
  accountReady?: boolean;
  hasStories?: boolean;
  hasChapters?: boolean;
  hasPublished?: boolean;
  onboardingComplete?: boolean;
  wantsToReview?: boolean;
}): Promise<void> {
  const lifecycle_stage = deriveLifecycleStage(signals);
  const creator_persona = derivePersona({
    wantsToReview: signals.wantsToReview,
    hasPublished: signals.hasPublished,
  });

  try {
    await api.patchCreatorLifecycle({ lifecycle_stage, creator_persona });
  } catch {
    // Non-blocking — local onboarding still works in mock/dev
  }
}