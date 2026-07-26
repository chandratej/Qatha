import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  discoveryFormatFromPublishedChapters,
  softWordTargetForContentType,
  countWordsInContent,
  DISCOVERY_SERIALIZED_CHAPTER_FLOOR,
  SERIALIZED_SOFT_WORD_MIN,
  SERIALIZED_SOFT_WORD_MAX,
  SERIALIZED_HARD_WORD_MAX,
} from './contentFormatDiscovery.js';

describe('contentFormatDiscovery', () => {
  it('uses 20-chapter floor for serialized shelf', () => {
    assert.equal(DISCOVERY_SERIALIZED_CHAPTER_FLOOR, 20);
    assert.equal(discoveryFormatFromPublishedChapters(20, 'serialized_story'), 'serialized');
    assert.equal(
      discoveryFormatFromPublishedChapters(19, 'serialized_story'),
      'collection_eligible',
    );
  });

  it('serialized word band is 1500–2500 soft, 3000 hard', () => {
    assert.equal(SERIALIZED_SOFT_WORD_MIN, 1500);
    assert.equal(SERIALIZED_SOFT_WORD_MAX, 2500);
    assert.equal(SERIALIZED_HARD_WORD_MAX, 3000);
    assert.deepEqual(softWordTargetForContentType('serialized_story'), {
      min: 1500,
      max: 2500,
      hardMax: 3000,
    });
    assert.equal(softWordTargetForContentType('short_story'), null);
  });

  it('counts words from HTML', () => {
    assert.equal(countWordsInContent('<p>one two three</p>'), 3);
    assert.equal(countWordsInContent(''), 0);
  });
});
