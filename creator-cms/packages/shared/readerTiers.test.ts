import { describe, expect, it } from 'vitest';
import {
  cumulativeWordsFromUnits,
  evaluateReaderTier,
  wordMidpointForFormat,
} from './readerTiers';

describe('readerTiers (Format Spec v1)', () => {
  it('uses §1 midpoints for word conversion', () => {
    expect(wordMidpointForFormat('serialized_story')).toBe(2000);
    expect(wordMidpointForFormat('epistolary_chat')).toBe(350);
    expect(wordMidpointForFormat('short_story_collection')).toBe(3000);
    // 100 serialized chapters → 200k words → silver volume floor
    expect(cumulativeWordsFromUnits('serialized_story', 100)).toBe(200_000);
  });

  it('requires unit gate + performing for bronze', () => {
    const early = evaluateReaderTier({
      contentTypeId: 'serialized_story',
      trustLevel: 'performing',
      publishedUnits: 40,
    });
    expect(early.tier).toBeNull();

    const bronze = evaluateReaderTier({
      contentTypeId: 'serialized_story',
      trustLevel: 'performing',
      publishedUnits: 50,
    });
    expect(bronze.tier).toBe('bronze');
    expect(bronze.priceInr).toBe(99);
  });

  it('silver needs catalyst + 200k words', () => {
    const silver = evaluateReaderTier({
      contentTypeId: 'serialized_story',
      trustLevel: 'catalyst',
      publishedUnits: 100,
    });
    expect(silver.tier).toBe('silver');
    expect(silver.priceInr).toBe(149);
  });

  it('collection cannot reach platform', () => {
    const goldish = evaluateReaderTier({
      contentTypeId: 'short_story_collection',
      trustLevel: 'apex',
      publishedUnits: 200,
      isTopDecileApex: true,
    });
    // 200 * 3000 = 600k words + apex would be platform for serial, but collection excluded
    expect(goldish.tier).toBe('gold');
    expect(goldish.priceInr).toBe(199);
  });

  it('excludes non-monetized formats', () => {
    const r = evaluateReaderTier({
      contentTypeId: 'flash_fiction',
      trustLevel: 'apex',
      publishedUnits: 1,
    });
    expect(r.tier).toBeNull();
    expect(r.monetizableFormat).toBe(false);
  });
});
