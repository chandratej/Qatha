import { useMemo } from 'react';
import type { ArrivalMomentum } from '../../lib/narrativeOsTypes';
import { useLocale } from '../../context/LocaleContext';
import { useAuth } from '../../context/AuthContext';

interface NarrativeArrivalScreenProps {
  visible: boolean;
  momentum: ArrivalMomentum | null;
  onContinue: () => void;
  onStartNew: () => void;
  onSkip: () => void;
}

function timeGreeting(locale: string, name?: string): string {
  const h = new Date().getHours();
  const displayName = name?.split(' ')[0] ?? '';
  if (locale === 'te') {
    const te = h < 12 ? 'శుభోదయం' : h < 18 ? 'శుభ మధ్యాహ్నం' : 'శుభ సాయంత్రం';
    return displayName ? `${te}, ${displayName}` : te;
  }
  const en = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  return displayName ? `${en}, ${displayName}` : en;
}

export function NarrativeArrivalScreen({
  visible,
  momentum,
  onContinue,
  onStartNew,
  onSkip,
}: NarrativeArrivalScreenProps) {
  const { locale, t } = useLocale();
  const { user } = useAuth();

  const greet = useMemo(
    () => timeGreeting(locale, user?.display_name ?? user?.email ?? undefined),
    [locale, user],
  );

  const hasMomentum = momentum && (
    momentum.wordCountYesterday != null || momentum.lastSceneTitle != null
  );

  return (
    <div className={`arrival${visible ? '' : ' hide'}`}>
      <div className="arrival-greet">{greet}</div>
      <h1 className="arrival-q">{t('narrativeOs.arrivalQuestion')}</h1>

      {momentum && (
        <button type="button" className="arrival-card" onClick={onContinue}>
          <div className="story">{momentum.storyTitle}</div>
          {hasMomentum ? (
            <div className="momentum">
              {momentum.wordCountYesterday != null && (
                <span>
                  {locale === 'te'
                    ? `నిన్న మీరు ${momentum.wordCountYesterday} పదాలు రాశారు. `
                    : `Yesterday you wrote ${momentum.wordCountYesterday} words. `}
                </span>
              )}
              {momentum.lastSceneTitle && (
                <span>
                  {locale === 'te'
                    ? `${momentum.lastSceneTitle} మీరు వదిలిన చోటే ఉంది.`
                    : `${momentum.lastSceneTitle} is waiting where you left off.`}
                </span>
              )}
            </div>
          ) : (
            <div className="momentum">{t('narrativeOs.openStory')} {momentum.storyTitle}</div>
          )}
          <div className="cta">{t('narrativeOs.continueWriting')}</div>
        </button>
      )}

      <div className="arrival-alt">
        {locale === 'te' ? 'లేదా ' : 'or '}
        <button type="button" onClick={onStartNew}>{t('narrativeOs.startNew')}</button>
        {' · '}
        <button type="button" onClick={onSkip}>{t('narrativeOs.skipArrival')}</button>
      </div>
    </div>
  );
}