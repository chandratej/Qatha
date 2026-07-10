import type { ReviewLanguage } from './reviewLanguagePrefs';

type ReviewUiStrings = {
  captureNote: string;
  whatNoticed: string;
  whatNoticedPlaceholder: string;
  suggestion: string;
  suggestionPlaceholder: string;
  expectedImpact: string;
  expectedImpactPlaceholder: string;
  saveNote: string;
  cancel: string;
  finishReview: string;
  overallAssessment: string;
  overallPlaceholder: string;
  strengths: string;
  strengthsPlaceholder: string;
  weaknesses: string;
  weaknessesPlaceholder: string;
  recommendation: string;
  recommendationPlaceholder: string;
  councilDecision: string;
  chooseDecision: string;
  phoneticHint: string;
  reviewInTelugu: string;
};

const TE: ReviewUiStrings = {
  captureNote: 'టిప్పణి రాయండి',
  whatNoticed: 'మీరు ఏమి గమనించారు?',
  whatNoticedPlaceholder: 'ఈ పాసేజ్‌లో సాహిత్యపరమైన విషయాన్ని తెలుగులో వివరించండి…',
  suggestion: 'రచయితకు సూచన (ఐచ్ఛికం)',
  suggestionPlaceholder: 'ఈ భాగాన్ని బలోపేతం చేయడానికి ఏమి చేయాలి?',
  expectedImpact: 'పాఠకులపై ప్రభావం',
  expectedImpactPlaceholder: 'ఉదా. ప్రారంభంలో భావోద్వేగ సంబంధం బలపడుతుంది',
  saveNote: 'టిప్పణి సేవ్ చేయండి',
  cancel: 'రద్దు',
  finishReview: 'సమీక్ష పూర్తి చేయండి',
  overallAssessment: 'మొత్తం అంచనా',
  overallPlaceholder: 'రచయితకు గౌరవప్రదమైన, స్పష్టమైన సంగ్రహం…',
  strengths: 'బలాలు',
  strengthsPlaceholder: 'ఏమి బాగా ఉంది…',
  weaknesses: 'మెరుగుదల అవసరం',
  weaknessesPlaceholder: 'ఏమి దృష్టి కావాలి…',
  recommendation: 'సిఫార్సు',
  recommendationPlaceholder: 'రచయిత తదుపరి చేయవలసిన విషయాలు…',
  councilDecision: 'మండలి నిర్ణయం',
  chooseDecision: 'నిర్ణయం ఎంచుకోండి…',
  phoneticHint: 'ఫొనెటిక్ తెలుగు · nenu → నేను',
  reviewInTelugu: 'తెలుగులో సమీక్షించండి',
};

const EN: ReviewUiStrings = {
  captureNote: 'Capture a note',
  whatNoticed: 'What did you notice?',
  whatNoticedPlaceholder: 'Describe the literary observation…',
  suggestion: 'Suggestion for the author (optional)',
  suggestionPlaceholder: 'What might strengthen this passage?',
  expectedImpact: 'Expected reader impact',
  expectedImpactPlaceholder: 'e.g. Stronger emotional pull in the opening',
  saveNote: 'Save note',
  cancel: 'Cancel',
  finishReview: 'Finish your review',
  overallAssessment: 'Overall assessment',
  overallPlaceholder: 'Your synthesis for the author — respectful, specific, actionable…',
  strengths: 'Strengths',
  strengthsPlaceholder: 'What shines…',
  weaknesses: 'Areas to refine',
  weaknessesPlaceholder: 'What needs attention…',
  recommendation: 'Recommendation',
  recommendationPlaceholder: 'Clear next steps for the author…',
  councilDecision: 'Council decision',
  chooseDecision: 'Choose decision…',
  phoneticHint: 'Phonetic Telugu typing enabled',
  reviewInTelugu: 'Review in Telugu',
};

export function reviewUiStrings(language: ReviewLanguage): ReviewUiStrings {
  if (language === 'english') return EN;
  return TE;
}

export function bilingualLabel(te: string, en: string, language: ReviewLanguage): string {
  if (language === 'telugu') return te;
  if (language === 'english') return en;
  return `${te} · ${en}`;
}