/**
 * Versioned competition rules — PRD §7 scaffold.
 * Keep in sync with packages/shared/competitionRules.ts
 */

/** @type {const} */
export const CURRENT_COMPETITION_RULES_VERSION = 'v1.0.0';

/** @type {import('../../../packages/shared/competitionRules.ts').CompetitionRulesDocument} */
const DEFAULT_COMPETITION_RULES_V1 = {
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
    contentTypes: ['serialized_story', 'short_story', 'short_story_collection'],
    storyStatuses: ['draft', 'ongoing'],
    minChapters: 50,
    minWordsPerChapter: 800,
    notes: [
      'Original Telugu manuscripts only — no machine-translated submissions.',
      'Serialized stories must meet Debut Season chapter and word-count thresholds.',
      'Stories under moderation review may register but cannot submit until approved.',
    ],
    notesTelugu: [
      'అసలు తెలుగు గ్రంథాలు మాత్రమే — మెషిన్ అనువాద సబ్మిషన్లు అనుమతించబడవు.',
      'ధారావాహిక కథలు అవతరణ కాలం అధ్యాయం మరియు పదాల పరిమితులకు అనుగుణంగా ఉండాలి.',
      'మోడరేషన్ రివ్యూలో ఉన్న కథలు నమోదు చేయవచ్చు కానీ ఆమోదం వరకు సబ్మిట్ చేయలేరు.',
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

/** @type {Map<string, object>} */
const rulesDb = new Map([[CURRENT_COMPETITION_RULES_VERSION, DEFAULT_COMPETITION_RULES_V1]]);

/** @type {Map<string, object>} eventId:userId -> acceptance record */
const acceptanceDb = new Map();

export function listRulesVersions() {
  return [...rulesDb.keys()];
}

export function getCurrentRules() {
  return rulesDb.get(CURRENT_COMPETITION_RULES_VERSION) ?? DEFAULT_COMPETITION_RULES_V1;
}

export function getRulesByVersion(version) {
  return rulesDb.get(version) ?? null;
}

export function isValidRulesVersion(version) {
  return version === CURRENT_COMPETITION_RULES_VERSION;
}

/**
 * Record rules acceptance before event registration (mock persistence).
 * @param {{ eventId: string, userId: string, rulesVersion: string }} opts
 */
export function recordRulesAcceptance(opts) {
  const { eventId, userId, rulesVersion } = opts;
  if (!isValidRulesVersion(rulesVersion)) {
    throw new Error(`Unsupported competition rules version: ${rulesVersion}`);
  }
  const key = `${eventId}:${userId}`;
  const record = {
    event_id: eventId,
    user_id: userId,
    rules_version: rulesVersion,
    accepted_at: new Date().toISOString(),
  };
  acceptanceDb.set(key, record);
  return record;
}

export function getRulesAcceptance(eventId, userId) {
  return acceptanceDb.get(`${eventId}:${userId}`) ?? null;
}