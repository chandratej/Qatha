/** Creator Events Platform — Master Prompt V2 */

export const EVENT_TYPES = [
  { id: 'writing_contest', label: 'Writing Contest' },
  { id: 'debut_season', label: 'Katha Debut Season', labelTelugu: 'కథా అవతరణ కాలం' },
  { id: 'short_story_challenge', label: 'Short Story Challenge' },
  { id: 'novel_challenge', label: 'Novel Challenge' },
  { id: 'flash_fiction_challenge', label: 'Flash Fiction Challenge' },
  { id: 'festival_challenge', label: 'Festival Challenge' },
  { id: 'genre_challenge', label: 'Genre Challenge' },
  { id: 'district_challenge', label: 'District Challenge' },
  { id: 'prompt_challenge', label: 'Prompt Challenge' },
  { id: 'writing_sprint', label: 'Writing Sprint' },
  { id: 'collaboration_challenge', label: 'Collaboration Challenge' },
  { id: 'beta_reader_event', label: 'Beta Reader Event' },
  { id: 'editing_challenge', label: 'Editing Challenge' },
  { id: 'translation_challenge', label: 'Translation Challenge' },
  { id: 'publishing_pitch_event', label: 'Publishing Pitch Event' },
] as const;

export type EventTypeId = (typeof EVENT_TYPES)[number]['id'];

/** Recognition-focused prize tiers — badges, certificates, features (not cash) */
export const EVENT_PRIZE_TIERS = [
  {
    id: 'first',
    rank: 1,
    label: '1st Place',
    labelTelugu: 'మొదటి స్థానం',
    recognition: ['Grand Debut Badge', 'Certificate of Excellence', 'Homepage feature'],
    recognitionTelugu: ['మహా అవతరణ బ్యాజ్', 'అత్యుత్తమ ప్రమాణపత్రం', 'హోమ్‌పేజ్ ఫీచర్'],
  },
  {
    id: 'second',
    rank: 2,
    label: '2nd Place',
    labelTelugu: 'రెండవ స్థానం',
    recognition: ['Gold Debut Badge', 'Certificate of Merit', 'Discover spotlight'],
    recognitionTelugu: ['స్వర్ణ అవతరణ బ్యాజ్', 'గౌరవ ప్రమాణపత్రం', 'డిస్కవర్ స్పాట్‌లైట్'],
  },
  {
    id: 'third',
    rank: 3,
    label: '3rd Place',
    labelTelugu: 'మూడవ స్థానం',
    recognition: ['Silver Debut Badge', 'Certificate of Recognition', 'Genre shelf feature'],
    recognitionTelugu: ['వెండి అవతరణ బ్యాజ్', 'గుర్తింపు ప్రమాణపత్రం', 'జానర్ షెల్ఫ్ ఫీచర్'],
  },
  {
    id: 'consolation',
    rank: 4,
    label: 'Consolation',
    labelTelugu: 'ఉత్తేజకరమైన గుర్తింపు',
    recognition: ['Rising Voice Badge', 'Participation certificate', 'Mentorship eligibility'],
    recognitionTelugu: ['ఉదయిస్తున్న స్వరం బ్యాజ్', 'పాల్గొనిన ప్రమాణపత్రం', 'మార్గదర్శకత్వ అర్హత'],
  },
] as const;

export type EventPrizeTierId = (typeof EVENT_PRIZE_TIERS)[number]['id'];

export const ORGANIZER_LEVELS = [
  { id: 'new_organizer', label: 'New Organizer', canHostPaid: false },
  { id: 'verified_organizer', label: 'Verified Organizer', canHostPaid: true },
  { id: 'trusted_organizer', label: 'Trusted Organizer', canHostPaid: true },
  { id: 'premier_organizer', label: 'Premier Organizer', canHostPaid: true },
] as const;

export type OrganizerLevelId = (typeof ORGANIZER_LEVELS)[number]['id'];

export const ENTRY_FEE_TIERS_INR = [0, 49, 99, 149, 199, 299, 499, 999] as const;

export const JUDGING_MODELS = [
  { id: 'blind', label: 'Blind Judging' },
  { id: 'double_blind', label: 'Double Blind Judging' },
  { id: 'community_voting', label: 'Community Voting' },
  { id: 'hybrid', label: 'Hybrid' },
  { id: 'weighted_rubric', label: 'Weighted Rubric' },
] as const;

export type JudgingModelId = (typeof JUDGING_MODELS)[number]['id'];

export const RUBRIC_DIMENSIONS = [
  { id: 'originality', label: 'Originality', weight: 0.15 },
  { id: 'plot', label: 'Plot', weight: 0.15 },
  { id: 'characters', label: 'Characters', weight: 0.15 },
  { id: 'dialogue', label: 'Dialogue', weight: 0.1 },
  { id: 'language', label: 'Language', weight: 0.15 },
  { id: 'ending', label: 'Ending', weight: 0.1 },
  { id: 'overall_impact', label: 'Overall Impact', weight: 0.2 },
] as const;

export const EVENT_STATUSES = [
  'draft', 'published', 'registration_open', 'registration_closed',
  'submissions_open', 'submissions_closed', 'judging', 'appeal_window',
  'completed', 'cancelled',
] as const;

export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_WIZARD_STEPS = [
  { id: 'basic', label: 'Basic Information', order: 1 },
  { id: 'eligibility', label: 'Eligibility', order: 2 },
  { id: 'registration', label: 'Registration & Entry Fee', order: 3 },
  { id: 'prizes', label: 'Prize Configuration', order: 4 },
  { id: 'judging', label: 'Judging Model', order: 5 },
  { id: 'timeline', label: 'Timeline', order: 6 },
  { id: 'publishing', label: 'Publishing', order: 7 },
] as const;

export const DEFAULT_COMMISSION_SPLITS = {
  platformPct: 15,
  organizerPct: 10,
  taxPct: 18,
  prizePoolPct: 57,
} as const;

export const ESCROW_RELEASE_CONDITIONS = [
  'contest_completed',
  'fraud_validation_passed',
  'appeal_window_closed',
  'winner_confirmed',
] as const;

export const SUBMISSION_WORKFLOW_STEPS = [
  'register', 'pay', 'submit', 'validate', 'anonymous_review',
  'score', 'leaderboard', 'winner', 'prize_distribution',
] as const;