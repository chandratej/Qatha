/**
 * Katha Content Format Spec v1 — Tiered reader pricing + volume-weighted eligibility.
 * Source: Worklog/27_JUL_2026/Katha_Content_Format_and_Payout_Specification_v1.md §3
 *
 * Additive gate alongside SPI bands (not a rewrite of spi.ts):
 *   SPI band achieved AND cumulative word volume met → tier assigned.
 * One system drives both reader-facing tier and creator share band pairing.
 */

import type { StoryTrustLevelId } from './story-trust';
import { formatEligibilityProfile, isFormatMonetizable } from './formatEligibility';

/** §1 range midpoints for converting chapters → cumulative words. */
export const FORMAT_WORD_MIDPOINT: Record<string, number> = {
  serialized_story: 2000,
  short_story_collection: 3000, // short-story midpoint within collection
  short_story: 3000, // (1000+5000)/2
  flash_fiction: 650, // (300+1000)/2
  epistolary_chat: 350, // (200+500)/2
  interactive_branching: 350, // reader-traversed path midpoint
  interactive_flash: 650,
  novel: 2000,
};

export type ReaderTierId = 'bronze' | 'silver' | 'gold' | 'platform';

export type ReaderTierDef = {
  id: ReaderTierId;
  label: string;
  labelTelugu: string;
  priceInr: number;
  /** Cumulative words delivered (0 = no volume floor). */
  minCumulativeWords: number;
  /** SPI/trust band required (rate condition). */
  minTrustLevel: StoryTrustLevelId;
  /** Platform tier also needs top-decile SPI among Apex. */
  requiresTopDecileApex?: boolean;
  /** Story Collection cannot enter Platform. */
  excludesCollection?: boolean;
};

export const READER_TIERS: readonly ReaderTierDef[] = [
  {
    id: 'bronze',
    label: 'Bronze',
    labelTelugu: 'కాంస్య',
    priceInr: 99,
    minCumulativeWords: 0,
    minTrustLevel: 'performing',
  },
  {
    id: 'silver',
    label: 'Silver',
    labelTelugu: 'వెండి',
    priceInr: 149,
    minCumulativeWords: 200_000,
    minTrustLevel: 'catalyst',
  },
  {
    id: 'gold',
    label: 'Gold',
    labelTelugu: 'స్వర్ణ',
    priceInr: 199,
    minCumulativeWords: 400_000,
    minTrustLevel: 'anchor',
  },
  {
    id: 'platform',
    label: 'Platform',
    labelTelugu: 'ప్లాట్‌ఫామ్',
    /** Mid of ₹249–299 flagship band — env can override headline. */
    priceInr: 249,
    minCumulativeWords: 600_000,
    minTrustLevel: 'apex',
    requiresTopDecileApex: true,
    excludesCollection: true,
  },
] as const;

const TRUST_ORDER: StoryTrustLevelId[] = [
  'incubation',
  'foundation',
  'emerging',
  'performing',
  'catalyst',
  'anchor',
  'apex',
];

export function trustMeetsMin(
  current: StoryTrustLevelId | string | null | undefined,
  min: StoryTrustLevelId,
): boolean {
  const c = TRUST_ORDER.indexOf((current || 'incubation') as StoryTrustLevelId);
  const m = TRUST_ORDER.indexOf(min);
  if (c < 0 || m < 0) return false;
  return c >= m;
}

export function wordMidpointForFormat(contentTypeId: string | null | undefined): number {
  const id = contentTypeId || 'serialized_story';
  return FORMAT_WORD_MIDPOINT[id] ?? FORMAT_WORD_MIDPOINT.serialized_story;
}

/**
 * Convert published units to cumulative words using format midpoint
 * (or measured average when provided).
 */
export function cumulativeWordsFromUnits(
  contentTypeId: string | null | undefined,
  publishedUnits: number,
  measuredAvgWordsPerUnit?: number | null,
): number {
  const n = Math.max(0, Number(publishedUnits) || 0);
  const mid =
    measuredAvgWordsPerUnit != null && measuredAvgWordsPerUnit > 0
      ? measuredAvgWordsPerUnit
      : wordMidpointForFormat(contentTypeId);
  return Math.round(n * mid);
}

export type TierEligibilityInput = {
  contentTypeId?: string | null;
  trustLevel: StoryTrustLevelId | string;
  publishedUnits: number;
  /** Optional measured average words per unit; defaults to §1 midpoint. */
  avgWordsPerUnit?: number | null;
  /** Precomputed cumulative words; if set, skips unit conversion. */
  cumulativeWords?: number | null;
  /** Apex top-decile flag for Platform tier. */
  isTopDecileApex?: boolean;
  /** Prerequisite monetization unit gate already cleared (or compute internally). */
  monetizationUnitGateMet?: boolean;
};

export type TierEligibilityResult = {
  /** Highest tier fully met, or null if not monetization-eligible. */
  tier: ReaderTierId | null;
  priceInr: number | null;
  cumulativeWords: number;
  monetizableFormat: boolean;
  reasons: string[];
  tiersChecked: Array<{
    id: ReaderTierId;
    met: boolean;
    reason: string;
  }>;
};

export function evaluateReaderTier(input: TierEligibilityInput): TierEligibilityResult {
  const reasons: string[] = [];
  const monetizableFormat = isFormatMonetizable(input.contentTypeId);
  const profile = formatEligibilityProfile(input.contentTypeId);

  const cumulativeWords =
    input.cumulativeWords != null && input.cumulativeWords >= 0
      ? Math.floor(input.cumulativeWords)
      : cumulativeWordsFromUnits(
          input.contentTypeId,
          input.publishedUnits,
          input.avgWordsPerUnit,
        );

  if (!monetizableFormat) {
    return {
      tier: null,
      priceInr: null,
      cumulativeWords,
      monetizableFormat: false,
      reasons: ['Format is non-monetized — excluded from tier ladder.'],
      tiersChecked: [],
    };
  }

  const unitGate =
    input.monetizationUnitGateMet != null
      ? { met: input.monetizationUnitGateMet }
      : (() => {
          const required = profile.monetizeMinUnits ?? 0;
          const n = Math.max(0, Number(input.publishedUnits) || 0);
          return { met: n >= required };
        })();

  if (!unitGate.met) {
    reasons.push(
      `Monetization unit gate not met (need ${profile.monetizeMinUnits} units).`,
    );
    return {
      tier: null,
      priceInr: null,
      cumulativeWords,
      monetizableFormat: true,
      reasons,
      tiersChecked: [],
    };
  }

  const isCollection = (input.contentTypeId || '') === 'short_story_collection';
  const tiersChecked: TierEligibilityResult['tiersChecked'] = [];
  let best: ReaderTierDef | null = null;

  for (const tier of READER_TIERS) {
    if (tier.excludesCollection && isCollection) {
      tiersChecked.push({
        id: tier.id,
        met: false,
        reason: 'Story Collection is not eligible for Platform tier (Gold ceiling).',
      });
      continue;
    }
    if (!trustMeetsMin(input.trustLevel, tier.minTrustLevel)) {
      tiersChecked.push({
        id: tier.id,
        met: false,
        reason: `Needs trust ≥ ${tier.minTrustLevel} (have ${input.trustLevel}).`,
      });
      continue;
    }
    if (cumulativeWords < tier.minCumulativeWords) {
      tiersChecked.push({
        id: tier.id,
        met: false,
        reason: `Needs ≥${tier.minCumulativeWords.toLocaleString()} words (have ${cumulativeWords.toLocaleString()}).`,
      });
      continue;
    }
    if (tier.requiresTopDecileApex && !input.isTopDecileApex) {
      tiersChecked.push({
        id: tier.id,
        met: false,
        reason: 'Platform tier requires top-decile SPI among Apex stories.',
      });
      continue;
    }
    tiersChecked.push({ id: tier.id, met: true, reason: 'SPI band + volume met.' });
    best = tier;
  }

  if (!best) {
    reasons.push('No tier met — need Performing+ SPI and format unit gate.');
    return {
      tier: null,
      priceInr: null,
      cumulativeWords,
      monetizableFormat: true,
      reasons,
      tiersChecked,
    };
  }

  reasons.push(`Qualified for ${best.label} (₹${best.priceInr}/mo).`);
  return {
    tier: best.id,
    priceInr: best.priceInr,
    cumulativeWords,
    monetizableFormat: true,
    reasons,
    tiersChecked,
  };
}

/** Map reader tier → creator Story Trust share band (same ladder, dual use). */
export function trustBandForReaderTier(tier: ReaderTierId): StoryTrustLevelId {
  switch (tier) {
    case 'bronze':
      return 'performing';
    case 'silver':
      return 'catalyst';
    case 'gold':
      return 'anchor';
    case 'platform':
      return 'apex';
    default:
      return 'performing';
  }
}

export function readerTierById(id: ReaderTierId): ReaderTierDef {
  return READER_TIERS.find((t) => t.id === id)!;
}

export type StoryMonetizationProgress = {
  formatMonetizable: boolean;
  unitGateMet: boolean;
  unitGateRequired: number | null;
  publishedUnits: number;
  unitsRemaining: number | null;
  cumulativeWords: number;
  trustLevel: string;
  currentTier: ReaderTierId | null;
  currentPriceInr: number | null;
  /** Next tier on the ladder (if any) and what's still missing. */
  nextTier: ReaderTierId | null;
  nextPriceInr: number | null;
  nextNeeds: {
    units?: number;
    words?: number;
    trust?: StoryTrustLevelId;
    topDecileApex?: boolean;
  };
  headline: string;
  detail: string;
};

/**
 * Creator-facing progress: current tier + plain-language next gate.
 */
export function describeStoryMonetizationProgress(input: TierEligibilityInput): StoryMonetizationProgress {
  const profile = formatEligibilityProfile(input.contentTypeId);
  const publishedUnits = Math.max(0, Number(input.publishedUnits) || 0);
  const unitRequired = profile.monetizeMinUnits;
  const unitGateMet =
    input.monetizationUnitGateMet
    ?? (unitRequired == null
      ? false
      : publishedUnits >= unitRequired);

  const cumulativeWords =
    input.cumulativeWords != null && input.cumulativeWords >= 0
      ? Math.floor(input.cumulativeWords)
      : cumulativeWordsFromUnits(
          input.contentTypeId,
          publishedUnits,
          input.avgWordsPerUnit,
        );

  const tierResult = evaluateReaderTier({
    ...input,
    monetizationUnitGateMet: unitGateMet,
    cumulativeWords,
  });

  if (profile.monetizationMode === 'non_monetized') {
    return {
      formatMonetizable: false,
      unitGateMet: false,
      unitGateRequired: null,
      publishedUnits,
      unitsRemaining: null,
      cumulativeWords,
      trustLevel: String(input.trustLevel || 'incubation'),
      currentTier: null,
      currentPriceInr: null,
      nextTier: null,
      nextPriceInr: null,
      nextNeeds: {},
      headline: 'Non-monetized format',
      detail: 'This format is acquisition/contest fuel — it does not enter the reader tier ladder.',
    };
  }

  if (!unitGateMet && unitRequired != null) {
    const remaining = Math.max(0, unitRequired - publishedUnits);
    return {
      formatMonetizable: true,
      unitGateMet: false,
      unitGateRequired: unitRequired,
      publishedUnits,
      unitsRemaining: remaining,
      cumulativeWords,
      trustLevel: String(input.trustLevel || 'incubation'),
      currentTier: null,
      currentPriceInr: null,
      nextTier: 'bronze',
      nextPriceInr: 99,
      nextNeeds: {
        units: remaining,
        trust: 'performing',
      },
      headline: `Publish ${remaining} more unit${remaining === 1 ? '' : 's'} to open monetization`,
      detail:
        profile.monetizationMode === 'collection'
          ? `Story Collection needs ${unitRequired} published stories before SPI banding and Bronze (₹99).`
          : `Need ${unitRequired} published chapters (have ${publishedUnits}). Then Performing trust unlocks Bronze.`,
    };
  }

  const currentIdx = tierResult.tier
    ? READER_TIERS.findIndex((t) => t.id === tierResult.tier)
    : -1;
  const nextDef =
    currentIdx >= 0 && currentIdx < READER_TIERS.length - 1
      ? READER_TIERS[currentIdx + 1]
      : currentIdx < 0
        ? READER_TIERS[0]
        : null;

  // If Platform is next but collection, skip to null (Gold is ceiling)
  let effectiveNext = nextDef;
  if (
    effectiveNext?.excludesCollection
    && (input.contentTypeId || '') === 'short_story_collection'
  ) {
    effectiveNext = null;
  }

  const nextNeeds: StoryMonetizationProgress['nextNeeds'] = {};
  if (effectiveNext) {
    if (!trustMeetsMin(input.trustLevel, effectiveNext.minTrustLevel)) {
      nextNeeds.trust = effectiveNext.minTrustLevel;
    }
    if (cumulativeWords < effectiveNext.minCumulativeWords) {
      nextNeeds.words = effectiveNext.minCumulativeWords - cumulativeWords;
    }
    if (effectiveNext.requiresTopDecileApex && !input.isTopDecileApex) {
      nextNeeds.topDecileApex = true;
    }
  }

  let headline: string;
  let detail: string;
  if (tierResult.tier === 'platform') {
    headline = 'Platform tier (flagship)';
    detail = 'Top of the ladder — Apex + volume + top-decile SPI.';
  } else if (tierResult.tier && !effectiveNext) {
    headline = `${READER_TIERS.find((t) => t.id === tierResult.tier)!.label} tier (format ceiling)`;
    detail =
      (input.contentTypeId || '') === 'short_story_collection'
        ? 'Story Collection tops out at Gold — Platform is reserved for continuous formats.'
        : 'Highest tier available for this story.';
  } else if (tierResult.tier && effectiveNext) {
    const parts: string[] = [];
    if (nextNeeds.trust) parts.push(`reach ${nextNeeds.trust} trust`);
    if (nextNeeds.words) parts.push(`~${nextNeeds.words.toLocaleString()} more words delivered`);
    if (nextNeeds.topDecileApex) parts.push('top-decile Apex SPI');
    headline = `Next: ${effectiveNext.label} (₹${effectiveNext.priceInr}/mo)`;
    detail = parts.length ? `Still need: ${parts.join(' · ')}` : 'Almost there — recheck SPI band.';
  } else {
    headline = 'Unlock Bronze (₹99)';
    detail = !trustMeetsMin(input.trustLevel, 'performing')
      ? `Unit gate cleared — grow to Performing trust (currently ${input.trustLevel}).`
      : 'Unit gate and trust nearly ready — confirm engagement signals.';
  }

  return {
    formatMonetizable: true,
    unitGateMet: true,
    unitGateRequired: unitRequired,
    publishedUnits,
    unitsRemaining: 0,
    cumulativeWords,
    trustLevel: String(input.trustLevel || 'incubation'),
    currentTier: tierResult.tier,
    currentPriceInr: tierResult.priceInr,
    nextTier: effectiveNext?.id ?? null,
    nextPriceInr: effectiveNext?.priceInr ?? null,
    nextNeeds,
    headline,
    detail,
  };
}
