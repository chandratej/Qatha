import { useEffect, useState } from 'react';
import { Languages } from 'lucide-react';
import {
  loadReviewLanguagePrefs,
  reviewLanguageLabel,
  saveReviewLanguagePrefs,
  type ReviewLanguage,
} from '../../../lib/reviewLanguagePrefs';
import { bilingualLabel, reviewUiStrings } from '../../../lib/reviewLocale';

export function ReviewLanguageBar() {
  const [language, setLanguage] = useState<ReviewLanguage>(() => loadReviewLanguagePrefs().language);
  const [phoneticTelugu, setPhoneticTelugu] = useState(() => loadReviewLanguagePrefs().phoneticTelugu);

  useEffect(() => {
    const root = document.documentElement;
    const teluguOn = language === 'telugu' || language === 'bilingual';
    root.dataset.rwReviewLang = language;
    root.classList.toggle('rw-review-lang-telugu', teluguOn);
  }, [language]);

  useEffect(() => {
    const onUpdate = () => {
      const p = loadReviewLanguagePrefs();
      setLanguage(p.language);
      setPhoneticTelugu(p.phoneticTelugu);
    };
    window.addEventListener('katha-review-language-updated', onUpdate);
    return () => window.removeEventListener('katha-review-language-updated', onUpdate);
  }, []);

  const ui = reviewUiStrings(language);

  return (
    <div className="rw-language" role="group" aria-label="Review language">
      <Languages size={14} aria-hidden className="rw-language__icon" />
      <label className="rw-language__control">
        <span>{bilingualLabel('భాష', 'Language', language)}</span>
        <select
          className="rw-comfort__select"
          value={language}
          onChange={(e) => {
            const next = e.target.value as ReviewLanguage;
            setLanguage(next);
            saveReviewLanguagePrefs({ language: next });
          }}
          aria-label="Review language"
        >
          <option value="telugu">{reviewLanguageLabel('telugu')}</option>
          <option value="bilingual">{reviewLanguageLabel('bilingual')}</option>
          <option value="english">{reviewLanguageLabel('english')}</option>
        </select>
      </label>
      {(language === 'telugu' || language === 'bilingual') && (
        <label className="rw-language__phonetic">
          <input
            type="checkbox"
            checked={phoneticTelugu}
            onChange={(e) => {
              setPhoneticTelugu(e.target.checked);
              saveReviewLanguagePrefs({ phoneticTelugu: e.target.checked });
            }}
          />
          <span className="rw-language__phonetic-label" title={ui.phoneticHint}>
            {bilingualLabel('ఫొనెటిక్', 'Phonetic', language)}
          </span>
        </label>
      )}
    </div>
  );
}

export function useReviewLanguage() {
  const [prefs, setPrefs] = useState(loadReviewLanguagePrefs);

  useEffect(() => {
    const onUpdate = () => setPrefs(loadReviewLanguagePrefs());
    window.addEventListener('katha-review-language-updated', onUpdate);
    return () => window.removeEventListener('katha-review-language-updated', onUpdate);
  }, []);

  return prefs;
}