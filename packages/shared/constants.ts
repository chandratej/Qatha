/** Shared constants — Katha MVP. Research-validated, see RESEARCH_DEVIATION_LOG.md */

export {
  BRAND_IDENTITY,
  BRAND_COLORS,
  BRAND_TYPOGRAPHY,
  BRAND_MOTION,
  BRAND_ICONOGRAPHY,
  BRAND_COPY,
  CREATOR_AI,
  DESIGN_MODES,
} from './brand';
export type { KathaDesignMode } from './brand';

import { BRAND_IDENTITY } from './brand';

export const BRAND = {
  name: BRAND_IDENTITY.name,
  nameTelugu: BRAND_IDENTITY.nameTelugu,
  mark: BRAND_IDENTITY.mark,
  productName: BRAND_IDENTITY.productName,
  tagline: BRAND_IDENTITY.tagline,
  taglineTelugu: BRAND_IDENTITY.taglineTelugu,
  promise: BRAND_IDENTITY.promise,
  promiseTelugu: BRAND_IDENTITY.promiseTelugu,
  creatorPromise: BRAND_IDENTITY.creatorPromise,
  prideLine: BRAND_IDENTITY.prideLine,
  priceMonthly: 99,
  priceMonthlyPaise: 9900,
  /** Base share before Story Trust multiplier — Performing = 40%, Apex = 60% */
  creatorSharePct: 40,
  platformSharePct: 60,
} as const;

export {
  PRD_GENRES,
  genreLabel,
  GENRE_DISCOVER_WEIGHTS,
} from './genres';
export {
  CONTENT_TYPES,
  CREATABLE_CONTENT_TYPES,
  CORE_CONTENT_TYPES,
  MOAT_CONTENT_TYPES,
  STORY_STATUSES,
  AGE_RATINGS,
  LANGUAGES,
  DISCOVERY_SERIALIZED_CHAPTER_FLOOR,
  SERIALIZED_SOFT_WORD_MIN,
  SERIALIZED_SOFT_WORD_MAX,
  SERIALIZED_HARD_WORD_MAX,
  getContentTypeDef,
  softWordTargetForContentType,
  discoveryFormatFromPublishedChapters,
} from './content-types';
export type {
  ContentTypeId,
  ContentTypeDef,
  ContentSpecConfidence,
  MoatContentTypeId,
  StoryStatusId,
  AgeRatingId,
  LanguageId,
  DiscoveryFormatId,
} from './content-types';

export {
  DEBUT_SEASON,
  DEBUT_SEASON_REQUIREMENTS,
  DEBUT_SEASON_EVALUATION_WEIGHTS,
  DEBUT_SEASON_AWARD_LEVELS,
  DEBUT_SEASON_NAMES,
} from './debutSeason';
export type {
  DebutEvaluationDimensionId,
  DebutAwardLevelId,
  DebutSeasonNameId,
} from './debutSeason';

export { MOOD_TAGS, SEED_COMMUNITY_TAGS, TAG_REQUEST_STATUSES, TAG_WORKFLOW } from './tags';
export type { TagRequestStatus } from './tags';

export { AUTHOR_LEVELS, nextAuthorLevel, authorLevelForStats } from './author-levels';
export type { AuthorLevelId } from './author-levels';

export { STORY_BADGES, badgeForReaders } from './story-badges';
export type { StoryBadgeId } from './story-badges';

export {
  BASE_CREATOR_SHARE_PCT,
  STORY_LIFECYCLE,
  STORY_TRUST_LEVELS,
  STABILITY_WINDOW_DAYS,
  SPI_WEIGHTS,
  MONETIZATION_ELIGIBILITY,
  QUARTERLY_PAYOUTS,
  SHORT_STORY_ECONOMY,
  PATRON_TIERS,
  BRAND_VOCABULARY,
  FIRST_STORY_LAUNCH_FLOW,
  trustLevelById,
  effectiveCreatorSharePct,
  isMonetizationEligible,
  nextTrustLevel,
  trustLevelForReaders,
} from './story-trust';
export type { StoryLifecycleId, StoryTrustLevelId } from './story-trust';

/** Format Spec v1 — contest/monetize unit gates + reader tier ladder */
export {
  DEFAULT_CONTEST_MIN_UNITS,
  DEFAULT_MONETIZE_MIN_UNITS,
  COLLECTION_MONETIZE_MIN_UNITS,
  COLLECTION_PUBLISH_MIN_UNITS,
  formatEligibilityProfile,
  isFormatMonetizable,
  clearsMonetizationUnitGate,
  evaluateContestEligibility,
  freeUnitsForContentType,
  labelForUnit,
} from './formatEligibility';
export type {
  FormatMonetizationMode,
  FormatEligibilityProfile,
  ContestEligibilityInput,
  ContestEligibilityResult,
} from './formatEligibility';

export {
  FORMAT_WORD_MIDPOINT,
  READER_TIERS,
  wordMidpointForFormat,
  cumulativeWordsFromUnits,
  evaluateReaderTier,
  trustBandForReaderTier,
  readerTierById,
  trustMeetsMin,
  describeStoryMonetizationProgress,
} from './readerTiers';
export type {
  ReaderTierId,
  ReaderTierDef,
  TierEligibilityInput,
  TierEligibilityResult,
  StoryMonetizationProgress,
} from './readerTiers';

export {
  computeSpi,
  trustLevelFromSpiScore,
  applyStabilityWindow,
  readersToGrowthScore,
  consistencyScore,
  pickTrustLevel,
} from './spi';
export type { SpiInput, SpiResult, SpiComponents, StabilityDecision } from './spi';

export {
  EVENT_TYPES, EVENT_PRIZE_TIERS, ORGANIZER_LEVELS, ENTRY_FEE_TIERS_INR, JUDGING_MODELS, RUBRIC_DIMENSIONS,
  EVENT_STATUSES, EVENT_WIZARD_STEPS, DEFAULT_COMMISSION_SPLITS, ESCROW_RELEASE_CONDITIONS,
  SUBMISSION_WORKFLOW_STEPS,
} from './events';
export type { EventTypeId, EventPrizeTierId, OrganizerLevelId, JudgingModelId, EventStatus } from './events';

export { PLATFORM_ROLES, ROLE_PERMISSIONS, hasPermission, canHostPaidContest } from './rbac';
export type { PlatformRole } from './rbac';

export {
  STORY_ROLES,
  STORY_PERMISSIONS,
  STORY_ROLE_PERMISSIONS,
  hasStoryPermission,
  canPerformStoryAction,
} from './story-rbac';
export type { StoryRole, StoryPermission } from './story-rbac';

export {
  CREATOR_PERSONAS,
  DEFERRED_PERSONAS,
  PERSONA_LABELS,
  defaultPersonaFromOnboarding,
  isShippedPersona,
} from './creator-persona';
export type { CreatorPersona, DeferredPersona } from './creator-persona';

export {
  NOTIFICATION_DOMAINS,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_PRIORITY_SLA_MINUTES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TYPES,
  notificationTypeById,
} from './notifications';
export type {
  NotificationDomain,
  NotificationPriority,
  NotificationChannel,
  NotificationTypeDef,
} from './notifications';

export {
  createFsm,
  peerReviewRequestFsm,
  reviewerAssignmentFsm,
  creatorLifecycleFsm,
  PEER_REVIEW_REQUEST_STATES,
  REVIEWER_ASSIGNMENT_STATES,
  CREATOR_LIFECYCLE_STAGES,
  lifecycleEventFromSignals,
} from './fsm';
export type {
  PeerReviewRequestState,
  ReviewerAssignmentState,
  CreatorLifecycleStage,
} from './fsm';

export {
  REVIEWER_ROLES, REVIEW_DECISIONS, REVIEWER_REPUTATION_TIERS, REVIEWER_METRICS,
  REVIEW_PACKAGE, BETA_READER_MODES,
} from './reviewer-marketplace';
export type { ReviewerRoleId, ReviewDecisionId } from './reviewer-marketplace';

export {
  LITERARY_COUNCIL_PHILOSOPHY,
  COUNCIL_CAREER_LEVELS,
  PROFESSIONAL_REVIEW_ROLES,
  GENRE_SPECIALIZATIONS,
  MATCHING_ENGINE_WEIGHTS,
  RQI_WEIGHTS,
  SQI_DIMENSIONS,
  SIS_SIGNALS,
  STRUCTURED_REVIEW_FIELDS,
  STRUCTURED_REVIEW_SUPPORT,
  PAID_REVIEWER_ELIGIBILITY,
  REVIEW_PAYMENT_WORKFLOW,
  ANTI_FRAUD_MEASURES,
  DOUBLE_BLIND_POLICY,
  INVITATION_BATCH_SIZE,
  REVIEWERS_ASSIGNED_COUNT,
} from './literary-council';
export type {
  CouncilCareerLevelId,
  ProfessionalReviewRoleId,
  GenreSpecializationId,
  SqiDimensionId,
} from './literary-council';

export { REPORT_CATEGORIES, REPORT_STATUSES, GOVERNANCE_SAFEGUARDS } from './governance';
export type { ReportCategoryId } from './governance';

export { READER_MONETIZATION, CREATOR_MONETIZATION, PLATFORM_REVENUE } from './monetization';

export { CONTEST_ROADMAP, CONTEST_REWARDS } from './contests';

export { RECOMMENDATION_SIGNALS, READER_SYSTEMS } from './recommendations';

/** CMS/reader genre picker — full PRD catalog */
import { PRD_GENRES, GENRE_DISCOVER_WEIGHTS } from './genres';

export const GENRES = PRD_GENRES.map((g) => ({
  id: g.id,
  label: g.label,
  labelTelugu: g.labelTelugu,
  weight: GENRE_DISCOVER_WEIGHTS[g.id] ?? 0.03,
}));

export type { GenreId } from './genres';

/** DEV-005 — Founder decision: no star ratings (ever); no reader comments (for now). */
export const SOCIAL_FEATURES = {
  ratings: false,
  comments: false,
  socialProof: ['reader_count', 'read_time'] as const,
} as const;

export const PAYWALL = {
  freeChapters: 3,
  otpGateChapter: 4,
  subscriptionGateChapter: 6,
  /** @deprecated No character ceiling — use serialized word band (1,500–2,500 soft · 3,000 hard). */
  maxChapterChars: Number.MAX_SAFE_INTEGER,
  maxStoryTitleChars: 100,
  maxStoryDescChars: 300,
  maxChapterTitleChars: 60,
} as const;

export const LAUNCH_OFFER = {
  /** DEV-004 — set LAUNCH_OFFER_MODE in backend .env; no code change to switch */
  modes: ['immediate', 'seven_day_unlimited', 'three_month_unlimited'] as const,
  envKeys: {
    mode: 'LAUNCH_OFFER_MODE',
    trialDays: 'LAUNCH_OFFER_TRIAL_DAYS',
    foundingLimit: 'LAUNCH_OFFER_FOUNDING_LIMIT',
    gateChapter: 'LAUNCH_OFFER_SUBSCRIPTION_GATE_CHAPTER',
  },
  defaults: {
    trialDaysSeven: 7,
    trialDaysThreeMonth: 90,
    foundingMemberLimit: 500,
    subscriptionGateChapter: 6,
  },
} as const;

export const RELEASE_SCHEDULES = [
  { id: 'weekly', label: 'Every week' },
  { id: 'biweekly', label: 'Every other week' },
  { id: 'irregular', label: 'When ready' },
  { id: 'complete', label: 'Story complete' },
] as const;

export const NOTIFICATION_TRIGGERS = {
  newChapter: 'new_chapters',
  subscriptionExpiry: 'subscription_reminders',
  weeklyTrending: 'weekly_trending',
} as const;

export const POSTHOG_EVENTS = [
  'app_install',
  'homepage_view',
  'chapter_opened',
  'chapter_completed',
  'chapter_3_completed',
  'otp_gate_shown',
  'otp_completed',
  'paywall_shown',
  'subscription_page_opened',
  'payment_attempted',
  'subscription_confirmed',
] as const;
