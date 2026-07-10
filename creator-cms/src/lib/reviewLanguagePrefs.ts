export type ReviewLanguage = 'telugu' | 'english' | 'bilingual';

export interface ReviewLanguagePrefs {
  language: ReviewLanguage;
  phoneticTelugu: boolean;
}

const STORAGE_KEY = 'katha_review_language_prefs';

const DEFAULTS: ReviewLanguagePrefs = {
  language: 'telugu',
  phoneticTelugu: true,
};

export function loadReviewLanguagePrefs(): ReviewLanguagePrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<ReviewLanguagePrefs>;
    const language = parsed.language;
    return {
      language: language === 'english' || language === 'bilingual' ? language : 'telugu',
      phoneticTelugu: parsed.phoneticTelugu !== false,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveReviewLanguagePrefs(prefs: Partial<ReviewLanguagePrefs>): ReviewLanguagePrefs {
  const current = loadReviewLanguagePrefs();
  const next: ReviewLanguagePrefs = {
    language: prefs.language ?? current.language,
    phoneticTelugu: prefs.phoneticTelugu ?? current.phoneticTelugu,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('katha-review-language-updated'));
  return next;
}

export function reviewLanguageLabel(lang: ReviewLanguage): string {
  switch (lang) {
    case 'telugu':
      return 'తెలుగు';
    case 'bilingual':
      return 'తెలుగు + EN';
    default:
      return 'English';
  }
}

export function usesTeluguTypography(lang: ReviewLanguage): boolean {
  return lang === 'telugu' || lang === 'bilingual';
}