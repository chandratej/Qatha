/**
 * PRD — Debut Season (అవతరణ కాలం) — first serialized arc evaluation.
 * Day-to-day serialized writing band is soft 1,500–2,500 / hard max 3,000 words
 * (content-types.ts). Debut Season evaluation thresholds below are a separate
 * competition bar and must not replace the editor word band in CMS.
 */

/** Core requirements for a Debut Season manuscript */
export const DEBUT_SEASON_REQUIREMENTS = {
  chapterCount: 50,
  wordsPerChapter: { min: 2000, max: 2500 },
  /** Total word range across all chapters */
  totalWords: { min: 100_000, max: 125_000 },
  /** Minimum chapters before evaluation eligibility */
  minChaptersForEvaluation: 50,
  /** Days allowed to complete the season arc */
  completionWindowDays: 365,
} as const;

/** Evaluation rubric weights — must sum to 1.0 */
export const DEBUT_SEASON_EVALUATION_WEIGHTS = [
  { id: 'narrative_craft', label: 'Narrative Craft', labelTelugu: 'కథన కళ', weight: 0.2 },
  { id: 'character_depth', label: 'Character Depth', labelTelugu: 'పాత్రల లోతు', weight: 0.2 },
  { id: 'dialogue_authenticity', label: 'Dialogue Authenticity', labelTelugu: 'సంభాషణ నిజాయితీ', weight: 0.15 },
  { id: 'language_flow', label: 'Language Flow', labelTelugu: 'భాషా ప్రవాహం', weight: 0.15 },
  { id: 'reader_engagement', label: 'Reader Engagement', labelTelugu: 'పాఠకుల ఆకర్షణ', weight: 0.15 },
  { id: 'publishing_consistency', label: 'Publishing Consistency', labelTelugu: 'ప్రచురణ స్థిరత', weight: 0.15 },
] as const;

export type DebutEvaluationDimensionId = (typeof DEBUT_SEASON_EVALUATION_WEIGHTS)[number]['id'];

/** Award tiers for Debut Season evaluation outcomes */
export const DEBUT_SEASON_AWARD_LEVELS = [
  {
    id: 'grand_debut',
    label: 'Grand Debut',
    labelTelugu: 'మహా అవతరణ',
    rank: 1,
    minScore: 90,
    description: 'Exceptional craft across all dimensions — top cohort recognition.',
    descriptionTelugu: 'అన్ని కోణాల్లో అసాధారణ కళ — అగ్రశ్రేణి గుర్తింపు.',
  },
  {
    id: 'gold_debut',
    label: 'Gold Debut',
    labelTelugu: 'స్వర్ణ అవతరణ',
    rank: 2,
    minScore: 80,
    description: 'Outstanding debut with strong reader engagement.',
    descriptionTelugu: 'బలమైన పాఠకుల ఆకర్షణతో అద్భుతమైన అవతరణ.',
  },
  {
    id: 'silver_debut',
    label: 'Silver Debut',
    labelTelugu: 'వెండి అవతరణ',
    rank: 3,
    minScore: 70,
    description: 'Solid craft foundation with clear growth trajectory.',
    descriptionTelugu: 'స్పష్టమైన అభివృద్ధి మార్గంతో బలమైన పునాది.',
  },
  {
    id: 'bronze_debut',
    label: 'Bronze Debut',
    labelTelugu: 'కాంస్య అవతరణ',
    rank: 4,
    minScore: 60,
    description: 'Promising debut — eligible for mentorship and feedback.',
    descriptionTelugu: 'ఆశాజనక అవతరణ — మార్గదర్శకత్వం మరియు ఫీడ్‌బ్యాక్ అర్హత.',
  },
  {
    id: 'rising_voice',
    label: 'Rising Voice',
    labelTelugu: 'ఉదయిస్తున్న స్వరం',
    rank: 5,
    minScore: 50,
    description: 'Honorable mention — encouraged to continue the craft journey.',
    descriptionTelugu: 'గౌరవ ప్రస్తుతి — కథా ప్రయాణాన్ని కొనసాగించమని ప్రోత్సహం.',
  },
] as const;

export type DebutAwardLevelId = (typeof DEBUT_SEASON_AWARD_LEVELS)[number]['id'];

/** Named Debut Season cohorts — aligned with Indian literary seasons (Ritu) */
export const DEBUT_SEASON_NAMES = [
  {
    id: 'vasanta',
    label: 'Vasanta Season',
    labelTelugu: 'వసంత కాలం',
    seasonNumber: 1,
    description: 'Spring debut cohort — new voices bloom.',
    descriptionTelugu: 'వసంత అవతరణ — కొత్త స్వరాలు వికసిస్తాయి.',
  },
  {
    id: 'grishma',
    label: 'Grishma Season',
    labelTelugu: 'గ్రీష్మ కాలం',
    seasonNumber: 2,
    description: 'Summer debut cohort — intensity and heat.',
    descriptionTelugu: 'గ్రీష్మ అవతరణ — తీవ్రత మరియు ఉద్వేగం.',
  },
  {
    id: 'varsha',
    label: 'Varsha Season',
    labelTelugu: 'వర్ష కాలం',
    seasonNumber: 3,
    description: 'Monsoon debut cohort — renewal and depth.',
    descriptionTelugu: 'వర్ష అవతరణ — పునరుజ్జీవనం మరియు లోతు.',
  },
  {
    id: 'sharad',
    label: 'Sharad Season',
    labelTelugu: 'శరద్ కాలం',
    seasonNumber: 4,
    description: 'Autumn debut cohort — harvest of craft.',
    descriptionTelugu: 'శరద్ అవతరణ — కళా పంట.',
  },
  {
    id: 'hemanta',
    label: 'Hemanta Season',
    labelTelugu: 'హేమంత కాలం',
    seasonNumber: 5,
    description: 'Early winter debut cohort — reflection and refinement.',
    descriptionTelugu: 'హేమంత అవతరణ — ఆలోచన మరియు పరిష్కరణ.',
  },
  {
    id: 'shishira',
    label: 'Shishira Season',
    labelTelugu: 'శిశిర కాలం',
    seasonNumber: 6,
    description: 'Winter debut cohort — enduring narratives.',
    descriptionTelugu: 'శిశిర అవతరణ — చిరకాల నిలిచే కథలు.',
  },
] as const;

export type DebutSeasonNameId = (typeof DEBUT_SEASON_NAMES)[number]['id'];

/** Convenience aggregate for imports */
export const DEBUT_SEASON = {
  requirements: DEBUT_SEASON_REQUIREMENTS,
  evaluationWeights: DEBUT_SEASON_EVALUATION_WEIGHTS,
  awardLevels: DEBUT_SEASON_AWARD_LEVELS,
  seasonNames: DEBUT_SEASON_NAMES,
} as const;