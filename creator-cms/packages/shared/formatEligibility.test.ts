import { describe, expect, it } from 'vitest';
import {
  clearsMonetizationUnitGate,
  evaluateContestEligibility,
  formatEligibilityProfile,
  freeUnitsForContentType,
  isFormatMonetizable,
  DEFAULT_CONTEST_MIN_UNITS,
  DEFAULT_MONETIZE_MIN_UNITS,
  COLLECTION_MONETIZE_MIN_UNITS,
} from './formatEligibility';

describe('formatEligibility (Format Spec v1)', () => {
  it('serialized / chat / interactive use 25 contest and 50 monetize', () => {
    for (const id of ['serialized_story', 'epistolary_chat', 'interactive_branching']) {
      const p = formatEligibilityProfile(id);
      expect(p.contestMinUnits).toBe(DEFAULT_CONTEST_MIN_UNITS);
      expect(p.monetizeMinUnits).toBe(DEFAULT_MONETIZE_MIN_UNITS);
      expect(p.monetizationMode).toBe('full_path');
      expect(isFormatMonetizable(id)).toBe(true);
    }
  });

  it('collection monetizes at 5 stories and forces free unit 1', () => {
    const p = formatEligibilityProfile('short_story_collection');
    expect(p.monetizeMinUnits).toBe(COLLECTION_MONETIZE_MIN_UNITS);
    expect(p.contestMinUnits).toBeNull();
    expect(p.contestPerStoryNoReentry).toBe(true);
    expect(freeUnitsForContentType('short_story_collection')).toBe(1);
    expect(clearsMonetizationUnitGate('short_story_collection', 4).met).toBe(false);
    expect(clearsMonetizationUnitGate('short_story_collection', 5).met).toBe(true);
  });

  it('short / flash / interactive flash are non-monetized', () => {
    for (const id of ['short_story', 'flash_fiction', 'interactive_flash']) {
      expect(isFormatMonetizable(id)).toBe(false);
      expect(clearsMonetizationUnitGate(id, 100).met).toBe(false);
    }
  });

  it('contest: continuous needs 25 units', () => {
    const fail = evaluateContestEligibility({
      contentTypeId: 'serialized_story',
      publishedUnits: 24,
    });
    expect(fail.eligible).toBe(false);
    const ok = evaluateContestEligibility({
      contentTypeId: 'serialized_story',
      publishedUnits: 25,
    });
    expect(ok.eligible).toBe(true);
  });

  it('contest: per-story no re-entry after win', () => {
    const blocked = evaluateContestEligibility({
      contentTypeId: 'short_story',
      publishedUnits: 1,
      hasWonContest: true,
    });
    expect(blocked.eligible).toBe(false);
    const ok = evaluateContestEligibility({
      contentTypeId: 'short_story',
      publishedUnits: 1,
      hasWonContest: false,
      moderationPassed: true,
      wordCountOk: true,
    });
    expect(ok.eligible).toBe(true);
  });

  it('interactive flash requires 2–3 branch points', () => {
    const bad = evaluateContestEligibility({
      contentTypeId: 'interactive_flash',
      publishedUnits: 1,
      branchPointCount: 1,
    });
    expect(bad.eligible).toBe(false);
    const good = evaluateContestEligibility({
      contentTypeId: 'interactive_flash',
      publishedUnits: 1,
      branchPointCount: 2,
    });
    expect(good.eligible).toBe(true);
  });
});
