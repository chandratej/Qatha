import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeSpi,
  applyStabilityWindow,
  effectiveCreatorSharePct,
  trustLevelFromSpiScore,
  trustLevelForReaders,
} from './storyTrust.js';

describe('storyTrust SPI', () => {
  it('computes weighted SPI score', () => {
    const r = computeSpi({
      readerRetentionPct: 80,
      completionRatePct: 70,
      readerSatisfactionPct: 75,
      totalReaders: 2500,
      publishedChapterCount: 8,
      daysSinceLastPublish: 3,
      policyQualityPct: 100,
    });
    assert.ok(r.score >= 50);
    assert.ok(['performing', 'catalyst', 'anchor', 'apex'].includes(r.suggestedTrustLevel));
    assert.equal(r.readerHeuristicLevel, 'performing');
    assert.equal(r.components.reader_retention, 80);
  });

  it('maps SPI thresholds', () => {
    assert.equal(trustLevelFromSpiScore(10), 'incubation');
    assert.equal(trustLevelFromSpiScore(50), 'performing');
    assert.equal(trustLevelFromSpiScore(95), 'apex');
  });

  it('effective share ladder', () => {
    assert.equal(effectiveCreatorSharePct('incubation'), 0);
    assert.equal(effectiveCreatorSharePct('performing'), 40);
    assert.equal(effectiveCreatorSharePct('apex'), 60);
  });

  it('stability window promotes after 7 days', () => {
    const hold = applyStabilityWindow({
      currentLevel: 'emerging',
      suggestedLevel: 'performing',
      candidateLevel: null,
      daysInCandidate: 0,
    });
    assert.equal(hold.action, 'set_candidate');

    const promo = applyStabilityWindow({
      currentLevel: 'emerging',
      suggestedLevel: 'performing',
      candidateLevel: 'performing',
      daysInCandidate: 7,
    });
    assert.equal(promo.action, 'promote');
    assert.equal(promo.nextLevel, 'performing');
  });

  it('reader heuristic', () => {
    assert.equal(trustLevelForReaders(0), 'incubation');
    assert.equal(trustLevelForReaders(2000), 'performing');
  });
});
