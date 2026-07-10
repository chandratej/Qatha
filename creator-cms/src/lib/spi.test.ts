import { describe, expect, it } from 'vitest';
import {
  computeSpi,
  trustLevelFromSpiScore,
  applyStabilityWindow,
} from '../../../packages/shared/spi';

describe('SPI engine (DEC-021)', () => {
  it('scores monetization-eligible for strong mid-tier signals', () => {
    const r = computeSpi({
      readerRetentionPct: 80,
      completionRatePct: 70,
      readerSatisfactionPct: 75,
      totalReaders: 2500,
      publishedChapterCount: 8,
      daysSinceLastPublish: 3,
      policyQualityPct: 100,
    });
    expect(r.score).toBeGreaterThanOrEqual(50);
    // SPI may exceed Performing into Catalyst/Anchor when components are strong
    expect(['performing', 'catalyst', 'anchor', 'apex']).toContain(r.suggestedTrustLevel);
    expect(r.readerHeuristicLevel).toBe('performing');
  });

  it('maps thresholds', () => {
    expect(trustLevelFromSpiScore(12)).toBe('incubation');
    expect(trustLevelFromSpiScore(52)).toBe('performing');
    expect(trustLevelFromSpiScore(92)).toBe('apex');
  });

  it('applies 7-day stability for promotions', () => {
    expect(
      applyStabilityWindow({
        currentLevel: 'emerging',
        suggestedLevel: 'performing',
        candidateLevel: null,
        daysInCandidate: 0,
      }).action,
    ).toBe('set_candidate');

    expect(
      applyStabilityWindow({
        currentLevel: 'emerging',
        suggestedLevel: 'performing',
        candidateLevel: 'performing',
        daysInCandidate: 7,
      }).action,
    ).toBe('promote');
  });
});
