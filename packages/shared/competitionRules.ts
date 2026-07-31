/**
 * PRD §7 — Versioned competition rules (eligibility, judging, prizes, timeline).
 * Legal & Trust: creators must accept the current rules version before registering.
 */

export const CURRENT_COMPETITION_RULES_VERSION = 'v1.0.0';

export interface CompetitionRulesEligibility {
  languages: string[];
  contentTypes: string[];
  storyStatuses: string[];
  minChapters?: number;
  maxChapters?: number;
  minWordsPerChapter?: number;
  notes: string[];
  notesTelugu: string[];
}

export interface CompetitionRulesJudging {
  model: string;
  modelLabel: string;
  modelLabelTelugu: string;
  rubricSummary: string;
  rubricSummaryTelugu: string;
  blindReview: boolean;
  appealWindowDays: number;
}

export interface CompetitionRulesPrizes {
  cashPrizes: boolean;
  recognitionOnly: boolean;
  tiers: Array<{
    id: string;
    label: string;
    labelTelugu: string;
    recognition: string[];
    recognitionTelugu: string[];
  }>;
}

export interface CompetitionRulesTimeline {
  phases: Array<{
    id: string;
    label: string;
    labelTelugu: string;
    description: string;
    descriptionTelugu: string;
  }>;
}

export interface CompetitionRulesDocument {
  version: string;
  effectiveFrom: string;
  summary: string;
  summaryTelugu: string;
  acceptanceLabel: string;
  acceptanceLabelTelugu: string;
  eligibility: CompetitionRulesEligibility;
  judging: CompetitionRulesJudging;
  prizes: CompetitionRulesPrizes;
  timeline: CompetitionRulesTimeline;
}

/** Default V1 rules — Katha Debut Season & recognition-focused contests */
export const DEFAULT_COMPETITION_RULES_V1: CompetitionRulesDocument = {
  version: CURRENT_COMPETITION_RULES_VERSION,
  effectiveFrom: '2026-01-01',
  summary:
    'I have read and agree to the Katha competition rules: Telugu serialized manuscripts, '
    + 'recognition-focused rewards (badges, certificates, features — not cash), and blind rubric evaluation.',
  summaryTelugu:
    'నేను కథా పోటీ నియమాలను చదివి అంగీకరిస్తున్నాను: తెలుగు ధారావాహిక కథలు, '
    + 'గుర్తింపు బహుమతులు (బ్యాడ్జ్లు, ప్రమాణపత్రాలు, ఫీచర్లు — నగదు కాదు), మరియు అంధ మూల్యాంకనం.',
  acceptanceLabel: 'Competition rules acceptance',
  acceptanceLabelTelugu: 'పోటీ నియమాల అంగీకారం',
  eligibility: {
    languages: ['te'],
    contentTypes: [
      'serialized_story',
      'epistolary_chat',
      'interactive_branching',
      'short_story',
      'short_story_collection',
      'flash_fiction',
      'interactive_flash',
    ],
    storyStatuses: ['draft', 'ongoing', 'completed'],
    /** Continuous formats (serial / chat / interactive): ≥25 published units. */
    minChapters: 25,
    minWordsPerChapter: 800,
    notes: [
      'Original Telugu manuscripts only — no machine-translated submissions.',
      'Serialized / Chat / Interactive Fiction: ≥25 published chapters for contest eligibility (Format Spec v1).',
      'Short Story, Flash, Interactive Flash, and Collection pieces: no chapter-count floor — completed + moderated + word guidance; a story that already won may not re-enter.',
      'Stories under moderation review may register but cannot submit until approved.',
      'No format is gated behind prior contest wins or magazine features.',
    ],
    notesTelugu: [
      'అసలు తెలుగు గ్రంథాలు మాత్రమే — మెషిన్ అనువాద సబ్మిషన్లు అనుమతించబడవు.',
      'ధారావాహిక / చాట్ / ఇంటరాక్టివ్: పోటీకి ≥25 ప్రచురిత అధ్యాయాలు (Format Spec v1).',
      'చిన్న కథ / ఫ్లాష్ / సంకలనం: chapter floor లేదు — complete + moderation + word guidance; గెలిచిన కథ re-entry కాదు.',
      'మోడరేషన్ రివ్యూలో ఉన్న కథలు నమోదు చేయవచ్చు కానీ ఆమోదం వరకు సబ్మిట్ చేయలేరు.',
      'ఏ ఫార్మాట్‌నూ మునుపటి పోటీ గెలుపులు లేదా మ్యాగజైన్ ఫీచర్లు గేట్ చేయవు.',
    ],
  },
  judging: {
    model: 'weighted_rubric',
    modelLabel: 'Weighted Rubric',
    modelLabelTelugu: 'బరువు రూబ్రిక్ మూల్యాంకనం',
    rubricSummary:
      'Blind evaluation across narrative craft, character depth, dialogue, language flow, '
      + 'reader engagement, and publishing consistency.',
    rubricSummaryTelugu:
      'కథన కళ, పాత్రల లోతు, సంభాషణ, భాషా ప్రవాహం, పాఠకుల ఆకర్షణ, '
      + 'మరియు ప్రచురణ స్థిరత కోణాల్లో అంధ మూల్యాంకనం.',
    blindReview: true,
    appealWindowDays: 7,
  },
  prizes: {
    cashPrizes: false,
    recognitionOnly: true,
    tiers: [
      {
        id: 'first',
        label: '1st Place',
        labelTelugu: 'మొదటి స్థానం',
        recognition: ['Grand Debut Badge', 'Certificate of Excellence', 'Homepage feature'],
        recognitionTelugu: ['మహా అవతరణ బ్యాజ్', 'అత్యుత్తమ ప్రమాణపత్రం', 'హోమ్‌పేజ్ ఫీచర్'],
      },
      {
        id: 'second',
        label: '2nd Place',
        labelTelugu: 'రెండవ స్థానం',
        recognition: ['Gold Debut Badge', 'Certificate of Merit', 'Discover spotlight'],
        recognitionTelugu: ['స్వర్ణ అవతరణ బ్యాజ్', 'గౌరవ ప్రమాణపత్రం', 'డిస్కవర్ స్పాట్‌లైట్'],
      },
      {
        id: 'third',
        label: '3rd Place',
        labelTelugu: 'మూడవ స్థానం',
        recognition: ['Silver Debut Badge', 'Certificate of Recognition', 'Genre shelf feature'],
        recognitionTelugu: ['వెండి అవతరణ బ్యాజ్', 'గుర్తింపు ప్రమాణపత్రం', 'జానర్ షెల్ఫ్ ఫీచర్'],
      },
      {
        id: 'consolation',
        label: 'Rising Voice',
        labelTelugu: 'ఉదయిస్తున్న స్వరం',
        recognition: ['Rising Voice Badge', 'Participation certificate', 'Mentorship eligibility'],
        recognitionTelugu: ['ఉదయిస్తున్న స్వరం బ్యాజ్', 'పాల్గొనిన ప్రమాణపత్రం', 'మార్గదర్శకత్వ అర్హత'],
      },
    ],
  },
  timeline: {
    phases: [
      {
        id: 'registration',
        label: 'Registration',
        labelTelugu: 'నమోదు',
        description: 'Free registration opens when the event is published.',
        descriptionTelugu: 'ఈవెంట్ ప్రచురించబడిన వెంటనే ఉచిత నమోదు ప్రారంభమవుతుంది.',
      },
      {
        id: 'submissions',
        label: 'Submissions',
        labelTelugu: 'సబ్మిషన్లు',
        description: 'Attach an eligible manuscript from your library before the deadline.',
        descriptionTelugu: 'చివరి తేదీకి ముందు మీ లైబ్రరీ నుండి అర్హత గల గ్రంథాన్ని అటాచ్ చేయండి.',
      },
      {
        id: 'judging',
        label: 'Evaluation',
        labelTelugu: 'మూల్యాంకనం',
        description: 'Blind rubric scoring by the Literary Council.',
        descriptionTelugu: 'సాహిత్య మండలి అంధ రూబ్రిక్ స్కోరింగ్.',
      },
      {
        id: 'results',
        label: 'Results',
        labelTelugu: 'ఫలితాలు',
        description: 'Recognition badges and certificates announced after appeal window closes.',
        descriptionTelugu: 'అపీల్ విండో ముగిసిన తర్వాత గుర్తింపు బ్యాడ్జ్లు మరియు ప్రమాణపత్రాలు ప్రకటించబడతాయి.',
      },
    ],
  },
};

const RULES_BY_VERSION: Record<string, CompetitionRulesDocument> = {
  [CURRENT_COMPETITION_RULES_VERSION]: DEFAULT_COMPETITION_RULES_V1,
};

export function getCompetitionRulesByVersion(
  version: string = CURRENT_COMPETITION_RULES_VERSION,
): CompetitionRulesDocument | null {
  return RULES_BY_VERSION[version] ?? null;
}

export function listCompetitionRulesVersions(): string[] {
  return Object.keys(RULES_BY_VERSION);
}

export function isValidCompetitionRulesVersion(version: string | null | undefined): boolean {
  return version === CURRENT_COMPETITION_RULES_VERSION;
}