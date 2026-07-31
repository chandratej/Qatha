import { describe, expect, it } from 'vitest';
import { FEATURE_FLAGS, isFeatureEnabled } from '../config/feature_flags';
import { CREATOR_AI } from './constants';

describe('Craft Moat feature flags', () => {
  it('keeps generative AI off (Constitution §1)', () => {
    expect(FEATURE_FLAGS.aiWriter).toBe(false);
    expect(CREATOR_AI.generativeEnabled).toBe(false);
  });

  it('enables Tier 1 craft entities and tab integrity', () => {
    expect(isFeatureEnabled('craftEntities')).toBe(true);
    expect(isFeatureEnabled('hideIncompleteStudioTabs')).toBe(true);
  });

  it('keeps Tier 2 craft surfaces off until behavior trigger', () => {
    expect(FEATURE_FLAGS.craftTier2).toBe(false);
  });
});
