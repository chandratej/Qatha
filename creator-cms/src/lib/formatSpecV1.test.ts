/**
 * Format Spec v1 — shared packages exercised from CMS vitest root.
 */
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
} from '../../../packages/shared/formatEligibility';
import {
  cumulativeWordsFromUnits,
  evaluateReaderTier,
  wordMidpointForFormat,
} from '../../../packages/shared/readerTiers';
import {
  softWordTargetForContentType,
  hardPublishWordBandForContentType,
  getContentTypeDef,
  discoveryFormatFromPublishedChapters,
} from '../../../packages/shared/content-types';
import { describeStoryMonetizationProgress } from '../../../packages/shared/readerTiers';
import { buildStoryEarningsRows, tierBadgeLabel } from './payouts';

describe('Format Spec v1 gates', () => {
  it('continuous formats: contest 25 · monetize 50', () => {
    for (const id of ['serialized_story', 'epistolary_chat', 'interactive_branching']) {
      const p = formatEligibilityProfile(id);
      expect(p.contestMinUnits).toBe(DEFAULT_CONTEST_MIN_UNITS);
      expect(p.monetizeMinUnits).toBe(DEFAULT_MONETIZE_MIN_UNITS);
      expect(isFormatMonetizable(id)).toBe(true);
    }
  });

  it('collection: monetize 5, free unit 1', () => {
    expect(formatEligibilityProfile('short_story_collection').monetizeMinUnits).toBe(
      COLLECTION_MONETIZE_MIN_UNITS,
    );
    expect(freeUnitsForContentType('short_story_collection')).toBe(1);
    expect(clearsMonetizationUnitGate('short_story_collection', 5).met).toBe(true);
  });

  it('contest no-reentry + interactive flash branches', () => {
    expect(
      evaluateContestEligibility({
        contentTypeId: 'short_story',
        publishedUnits: 1,
        hasWonContest: true,
      }).eligible,
    ).toBe(false);
    expect(
      evaluateContestEligibility({
        contentTypeId: 'interactive_flash',
        publishedUnits: 1,
        branchPointCount: 2,
      }).eligible,
    ).toBe(true);
  });
});

describe('Format Spec v1 tiers', () => {
  it('word midpoints and silver floor', () => {
    expect(wordMidpointForFormat('serialized_story')).toBe(2000);
    expect(cumulativeWordsFromUnits('serialized_story', 100)).toBe(200_000);
    const silver = evaluateReaderTier({
      contentTypeId: 'serialized_story',
      trustLevel: 'catalyst',
      publishedUnits: 100,
    });
    expect(silver.tier).toBe('silver');
    expect(silver.priceInr).toBe(149);
  });

  it('collection cannot be platform', () => {
    const r = evaluateReaderTier({
      contentTypeId: 'short_story_collection',
      trustLevel: 'apex',
      publishedUnits: 200,
      isTopDecileApex: true,
    });
    expect(r.tier).toBe('gold');
  });
});

describe('Format Spec v1 content types', () => {
  it('serialized recommended band 1000–1500 with no hard publish gate', () => {
    expect(softWordTargetForContentType('serialized_story')).toEqual({
      min: 1000,
      max: 1500,
      hardMax: null,
    });
    expect(hardPublishWordBandForContentType('serialized_story')).toBeNull();
  });

  it('interactive flash exists and is non-monetized', () => {
    expect(getContentTypeDef('interactive_flash')?.nonMonetized).toBe(true);
    expect(discoveryFormatFromPublishedChapters(1, 'interactive_flash')).toBe('single');
  });

  it('chat soft band 200–500 is guidance only (no hard publish gate)', () => {
    expect(softWordTargetForContentType('epistolary_chat')?.min).toBe(200);
    expect(softWordTargetForContentType('epistolary_chat')?.max).toBe(500);
    expect(hardPublishWordBandForContentType('epistolary_chat')).toBeNull();
  });

  it('short story soft 1k–5k is not a hard publish block', () => {
    expect(softWordTargetForContentType('short_story')?.min).toBe(1000);
    expect(hardPublishWordBandForContentType('short_story')).toBeNull();
  });

  it('any content type may publish any length', () => {
    expect(hardPublishWordBandForContentType('serialized_story')).toBeNull();
    expect(hardPublishWordBandForContentType('novel')).toBeNull();
    expect(hardPublishWordBandForContentType(null)).toBeNull();
  });
});

describe('Format Spec v1 progress + payout rows', () => {
  it('describeStoryMonetizationProgress shows unit gate remaining', () => {
    const p = describeStoryMonetizationProgress({
      contentTypeId: 'serialized_story',
      trustLevel: 'performing',
      publishedUnits: 40,
    });
    expect(p.unitGateMet).toBe(false);
    expect(p.unitsRemaining).toBe(10);
    expect(p.nextTier).toBe('bronze');
  });

  it('buildStoryEarningsRows attaches progress and tier', () => {
    const rows = buildStoryEarningsRows([
      {
        id: '1',
        title: 'Test',
        chapter_count: 50,
        total_readers: 2500,
        content_type: 'serialized_story',
        moderation_status: 'published',
      },
    ]);
    expect(rows[0].progress.currentTier).toBe('bronze');
    expect(tierBadgeLabel('bronze', false)).toContain('99');
  });
});
