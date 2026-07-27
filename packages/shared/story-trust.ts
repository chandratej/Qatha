/**
 * Katha Creator Economy & Story Trust Framework
 * Source: UI_UX_decisions/Story format contests and monetization/Katha_Creator_Economy_Story_Trust_Framework.md
 *
 * Stories are long-term IP assets. We reward sustained reader value — not publishing alone.
 */

/** Base creator share before Story Trust multiplier (platform may adjust without changing trust levels). */
export const BASE_CREATOR_SHARE_PCT = 40;

export const STORY_LIFECYCLE = [
  { id: 'draft', label: 'Draft', phase: 'pre_launch' as const },
  { id: 'coming_soon', label: 'Coming Soon', phase: 'pre_launch' as const },
  { id: 'launch', label: 'Launch', phase: 'pre_launch' as const },
  { id: 'incubation', label: 'Incubation', phase: 'trust' as const },
  { id: 'foundation', label: 'Foundation', phase: 'trust' as const },
  { id: 'emerging', label: 'Emerging', phase: 'trust' as const },
  { id: 'performing', label: 'Performing', phase: 'trust' as const },
  { id: 'catalyst', label: 'Catalyst', phase: 'trust' as const },
  { id: 'anchor', label: 'Anchor', phase: 'trust' as const },
  { id: 'apex', label: 'Apex', phase: 'trust' as const },
] as const;

export type StoryLifecycleId = (typeof STORY_LIFECYCLE)[number]['id'];
export type StoryTrustLevelId = Extract<StoryLifecycleId, 'incubation' | 'foundation' | 'emerging' | 'performing' | 'catalyst' | 'anchor' | 'apex'>;

export const STORY_TRUST_LEVELS = [
  {
    id: 'incubation' as const,
    label: 'Incubation',
    glyph: '🌱',
    order: 0,
    revenueSharePct: 0,
    multiplier: 0,
    monetizationEligible: false,
    purpose: 'Collect reader signals',
  },
  {
    id: 'foundation' as const,
    label: 'Foundation',
    glyph: '🌿',
    order: 1,
    revenueSharePct: 0,
    multiplier: 0,
    monetizationEligible: false,
    purpose: 'Consistent engagement',
  },
  {
    id: 'emerging' as const,
    label: 'Emerging',
    glyph: '⭐',
    order: 2,
    revenueSharePct: 0,
    multiplier: 0,
    monetizationEligible: false,
    purpose: 'Growing audience',
  },
  {
    id: 'performing' as const,
    label: 'Performing',
    glyph: '🚀',
    order: 3,
    revenueSharePct: 40,
    multiplier: 1.0,
    monetizationEligible: true,
    purpose: 'Eligible for monetization',
  },
  {
    id: 'catalyst' as const,
    label: 'Catalyst',
    glyph: '💎',
    order: 4,
    revenueSharePct: 44,
    multiplier: 1.1,
    monetizationEligible: true,
    purpose: 'Accelerating literary impact',
  },
  {
    id: 'anchor' as const,
    label: 'Anchor',
    glyph: '👑',
    order: 5,
    revenueSharePct: 50,
    multiplier: 1.25,
    monetizationEligible: true,
    purpose: 'Sustained reader loyalty',
  },
  {
    id: 'apex' as const,
    label: 'Apex',
    glyph: '🏆',
    order: 6,
    revenueSharePct: 60,
    multiplier: 1.5,
    monetizationEligible: true,
    purpose: 'Defining literary achievement',
  },
] as const;

export const STABILITY_WINDOW_DAYS = 7;

export const SPI_WEIGHTS = [
  { id: 'reader_retention', label: 'Reader Retention', weightPct: 35 },
  { id: 'completion_rate', label: 'Completion Rate', weightPct: 25 },
  { id: 'reader_satisfaction', label: 'Reader Satisfaction', weightPct: 15 },
  { id: 'reader_growth', label: 'Reader Growth', weightPct: 10 },
  { id: 'publishing_consistency', label: 'Publishing Consistency', weightPct: 10 },
  { id: 'policy_quality', label: 'Policy & Quality', weightPct: 5 },
] as const;

/**
 * Monetization eligibility (Format Spec v1 / BR-002 supersession).
 * Unit floors are format-specific — see formatEligibility.ts.
 * SPI banding (Performing+) only applies after the unit gate clears.
 */
export const MONETIZATION_ELIGIBILITY = {
  minStoryLengthConfigurable: true,
  /** Default free sample for continuous formats (proven stories). Collections force 1. */
  minFreeChapters: 3,
  /** Default continuous formats (serialized / chat / interactive). */
  minPublishedUnitsForMonetization: 50,
  /** Story Collection monetization floor (stories, not serial chapters). */
  collectionMinPublishedUnitsForMonetization: 5,
  /** Contest floor for continuous formats. */
  minPublishedUnitsForContest: 25,
  qualityChecks: true,
  readerEngagement: true,
  stabilityWindowDays: STABILITY_WINDOW_DAYS,
  minTrustLevel: 'performing' as StoryTrustLevelId,
} as const;

export const QUARTERLY_PAYOUTS = {
  cadence: 'quarterly' as const,
  features: ['fraud_detection', 'refund_handling', 'appeals', 'stable_accounting', 'meaningful_payouts'] as const,
} as const;

export const SHORT_STORY_ECONOMY = {
  surfaces: [
    { id: 'weekly_collections', label: 'Weekly Collections' },
    { id: 'monthly_collections', label: 'Monthly Collections' },
    { id: 'anthologies', label: 'Anthologies' },
    { id: 'curated_magazines', label: "Editor's Spotlight Magazines" },
  ],
  distribution: 'proportional_engagement' as const,
} as const;

export const PATRON_TIERS = [
  { id: 'bronze', label: 'Bronze Patron', order: 0 },
  { id: 'silver', label: 'Silver Patron', order: 1 },
  { id: 'gold', label: 'Gold Patron', order: 2 },
  { id: 'platinum', label: 'Platinum Patron', order: 3 },
  { id: 'founders_circle', label: "Founder's Circle", order: 4 },
] as const;

/** Brand vocabulary — avoid social-platform language */
export const BRAND_VOCABULARY = {
  avoid: ['Tip', 'Donate', 'Coins', 'Followers', 'Creator', 'Influencer', 'Gift Stickers'] as const,
  preferred: [
    'Patronage',
    'Reader Appreciation',
    'Become a Patron',
    'Readers',
    'Author',
    'Katha Creator',
    'Certified Author',
    "Editor's Spotlight",
    'Patron Contribution',
    'Katha Credits',
  ] as const,
} as const;

export const FIRST_STORY_LAUNCH_FLOW = [
  'Reserve Story',
  'Coming Soon',
  'Audience Building',
  'Launch',
  'Launch Week',
  'Incubation',
  'Trust Progression',
] as const;

export function trustLevelById(id: StoryTrustLevelId) {
  return STORY_TRUST_LEVELS.find((t) => t.id === id)!;
}

export function effectiveCreatorSharePct(trustLevel: StoryTrustLevelId): number {
  const level = trustLevelById(trustLevel);
  if (!level.monetizationEligible) return 0;
  return Math.round(BASE_CREATOR_SHARE_PCT * level.multiplier);
}

export function isMonetizationEligible(trustLevel: StoryTrustLevelId): boolean {
  return trustLevelById(trustLevel).monetizationEligible;
}

export function nextTrustLevel(current: StoryTrustLevelId): StoryTrustLevelId | null {
  const idx = STORY_TRUST_LEVELS.findIndex((t) => t.id === current);
  if (idx < 0 || idx >= STORY_TRUST_LEVELS.length - 1) return null;
  return STORY_TRUST_LEVELS[idx + 1].id;
}

/** MVP heuristic: map total readers to trust level until SPI scoring ships. */
export function trustLevelForReaders(totalReaders: number): StoryTrustLevelId {
  if (totalReaders >= 200_000) return 'apex';
  if (totalReaders >= 50_000) return 'anchor';
  if (totalReaders >= 10_000) return 'catalyst';
  if (totalReaders >= 2_000) return 'performing';
  if (totalReaders >= 500) return 'emerging';
  if (totalReaders >= 100) return 'foundation';
  return 'incubation';
}