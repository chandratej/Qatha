/**
 * Story eligibility validation for contest registration & submission.
 * Debut Season focuses on serialized Telugu manuscripts — recognition, not cash.
 */

import { DEBUT_SEASON_REQUIREMENTS } from './platformConstants';

export interface ContestStoryInput {
  id: string;
  title: string;
  chapter_count: number;
  content_type?: string | null;
  story_status?: string | null;
  language?: string | null;
  is_published?: boolean;
  moderation_status?: string | null;
  total_readers?: number;
  /** True when author has no prior Debut Season submission */
  is_debut_manuscript?: boolean;
}

export interface StoryEligibilityResult {
  eligible: boolean;
  reasons: string[];
  warnings: string[];
}

const DEBUT_CONTENT_TYPES = new Set(['serialized_story', 'novel']);
const ACTIVE_STATUSES = new Set(['draft', 'ongoing']);
const BLOCKED_MODERATION = new Set(['needs_revision']);

function pushReason(
  reasons: string[],
  en: string,
  te: string,
  locale: 'en' | 'te' = 'en',
): void {
  reasons.push(locale === 'te' ? te : en);
}

export function validateStoryEligibilityForEvent(
  story: ContestStoryInput,
  eventType: string,
  locale: 'en' | 'te' = 'en',
): StoryEligibilityResult {
  const reasons: string[] = [];
  const warnings: string[] = [];

  if (eventType === 'debut_season') {
    validateDebutSeasonStory(story, reasons, warnings, locale);
  } else if (
    eventType === 'short_story_challenge'
    || eventType === 'flash_fiction_challenge'
  ) {
    validateShortFormStory(story, reasons, warnings, locale);
  } else {
    validateGeneralContestStory(story, reasons, warnings, locale);
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    warnings,
  };
}

function validateDebutSeasonStory(
  story: ContestStoryInput,
  reasons: string[],
  warnings: string[],
  locale: 'en' | 'te',
): void {
  if (story.chapter_count < 1) {
    pushReason(
      reasons,
      'Write at least one chapter before joining Debut Season.',
      'అవతరణ కాలంలో పాల్గొనే ముందు కనీసం ఒక అధ్యాయం రాయండి.',
      locale,
    );
  }

  if (story.content_type && !DEBUT_CONTENT_TYPES.has(story.content_type)) {
    pushReason(
      reasons,
      'Debut Season requires a Serialized Story manuscript.',
      'అవతరణ కాలానికి ధారావాహిక కథ ఫార్మాట్ అవసరం.',
      locale,
    );
  } else if (!story.content_type && story.chapter_count > 1) {
    warnings.push(
      locale === 'te'
        ? 'కంటెంట్ రకం ధృవీకరించబడలేదు — ధారావాహిక కథను ఎంచుకోండి.'
        : 'Content type not confirmed — choose a Serialized Story format.',
    );
  }

  if (story.story_status === 'completed') {
    pushReason(
      reasons,
      'Completed stories cannot enter Debut Season — start a new serialized arc.',
      'పూర్తయిన కథలు అవతరణ కాలానికి అర్హత కావు — కొత్త ధారావాహిక కథను ప్రారంభించండి.',
      locale,
    );
  } else if (story.story_status && !ACTIVE_STATUSES.has(story.story_status)) {
    pushReason(
      reasons,
      'Story must be in draft or ongoing status.',
      'కథ డ్రాఫ్ట్ లేదా కొనసాగుతోంది స్థితిలో ఉండాలి.',
      locale,
    );
  }

  if (story.moderation_status && BLOCKED_MODERATION.has(story.moderation_status)) {
    pushReason(
      reasons,
      'Resolve moderation revisions before submitting to the contest.',
      'పోటీకి సబ్మిట్ చేయడానికి ముందు మోడరేషన్ సవరణలను పరిష్కరించండి.',
      locale,
    );
  }

  if (story.language && story.language !== 'te') {
    pushReason(
      reasons,
      'Debut Season celebrates Telugu craft — Telugu manuscripts only.',
      'అవతరణ కాలం తెలుగు కళను గౌరవిస్తుంది — తెలుగు కథలు మాత్రమే.',
      locale,
    );
  } else if (!story.language) {
    warnings.push(
      locale === 'te'
        ? 'భాష ధృవీకరించబడలేదు — తెలుగు కథను ఎంచుకోండి.'
        : 'Language not confirmed — select a Telugu manuscript.',
    );
  }

  if (story.is_debut_manuscript === false) {
    pushReason(
      reasons,
      'Debut Season is for your first serialized arc on Katha.',
      'అవతరణ కాలం కథలో మీ మొదటి ధారావాహిక కథకు మాత్రమే.',
      locale,
    );
  }

  if (
    story.chapter_count > 0
    && story.chapter_count < DEBUT_SEASON_REQUIREMENTS.minChaptersForEvaluation
  ) {
    warnings.push(
      locale === 'te'
        ? `${DEBUT_SEASON_REQUIREMENTS.chapterCount} అధ్యాయాల పూర్తి చేసిన తర్వాత మూల్యాంకనం — మీ ప్రయాణం కొనసాగించండి.`
        : `Evaluation unlocks after ${DEBUT_SEASON_REQUIREMENTS.chapterCount} chapters — keep writing your arc.`,
    );
  }
}

function validateShortFormStory(
  story: ContestStoryInput,
  reasons: string[],
  _warnings: string[],
  locale: 'en' | 'te',
): void {
  if (story.chapter_count < 1) {
    pushReason(
      reasons,
      'Add at least one chapter before submitting.',
      'సబ్మిట్ చేయడానికి ముందు కనీసం ఒక అధ్యాయం జోడించండి.',
      locale,
    );
  }
}

function validateGeneralContestStory(
  story: ContestStoryInput,
  reasons: string[],
  _warnings: string[],
  locale: 'en' | 'te',
): void {
  if (story.chapter_count < 1) {
    pushReason(
      reasons,
      'Publish or draft at least one chapter to enter.',
      'పాల్గొనడానికి కనీసం ఒక అధ్యాయం రాయండి.',
      locale,
    );
  }

  if (story.moderation_status && BLOCKED_MODERATION.has(story.moderation_status)) {
    pushReason(
      reasons,
      'Resolve moderation revisions before submitting.',
      'సబ్మిట్ చేయడానికి ముందు మోడరేషన్ సవరణలను పరిష్కరించండి.',
      locale,
    );
  }
}

export function debutSeasonProgressPct(chapterCount: number): number {
  const goal = DEBUT_SEASON_REQUIREMENTS.chapterCount;
  return Math.min(100, Math.round((chapterCount / goal) * 100));
}