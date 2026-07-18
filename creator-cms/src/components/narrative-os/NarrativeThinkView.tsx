import { StickyNote, X } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';

interface NarrativeThinkViewProps {
  onBackToWrite: () => void;
  children?: React.ReactNode;
}

/** Planning / notes phase — no generative AI in MVP1. */
export function NarrativeThinkView({ onBackToWrite, children }: NarrativeThinkViewProps) {
  const { t } = useLocale();

  return (
    <div className="nos-mode-surface nos-think">
      <header className="nos-mode-header">
        <div className="nos-mode-header__left">
          <h2>
            <StickyNote size={16} aria-hidden />
            {t('narrativeOs.phaseThink')}
          </h2>
          <p>{t('narrativeOs.phaseThinkHint')}</p>
        </div>
        <button type="button" className="nos-mode-close" onClick={onBackToWrite}>
          <X size={14} aria-hidden />
          {t('narrativeOs.backToWrite')}
        </button>
      </header>
      <div className="nos-think__body">
        {children ?? (
          <div className="nos-think__placeholder">
            <p>{t('narrativeOs.thinkPlaceholder')}</p>
          </div>
        )}
      </div>
    </div>
  );
}