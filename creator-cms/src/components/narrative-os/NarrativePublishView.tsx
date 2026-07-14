import { Rocket, X } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';

interface NarrativePublishViewProps {
  wordCount: number;
  sceneCount: number;
  publishLabel: string;
  publishing: boolean;
  publishDisabled: boolean;
  onPublish: () => void;
  onBackToWrite: () => void;
}

export function NarrativePublishView({
  wordCount,
  sceneCount,
  publishLabel,
  publishing,
  publishDisabled,
  onPublish,
  onBackToWrite,
}: NarrativePublishViewProps) {
  const { t } = useLocale();

  return (
    <div className="nos-mode-surface nos-publish">
      <header className="nos-mode-header">
        <div className="nos-mode-header__left">
          <h2>{t('narrativeOs.phasePublish')}</h2>
          <p>{t('narrativeOs.phasePublishHint')}</p>
        </div>
        <button type="button" className="nos-mode-close" onClick={onBackToWrite}>
          <X size={14} aria-hidden />
          {t('narrativeOs.backToWrite')}
        </button>
      </header>
      <div className="nos-publish__body">
        <div className="nos-publish__card">
          <p className="nos-publish__stat">
            <strong>{wordCount.toLocaleString()}</strong>
            <span>{t('narrativeOs.words')}</span>
          </p>
          <p className="nos-publish__stat">
            <strong>{sceneCount}</strong>
            <span>scenes</span>
          </p>
        </div>
        <p className="nos-publish__note">{t('narrativeOs.publishNote')}</p>
        <button
          type="button"
          className="nos-publish__cta"
          onClick={onPublish}
          disabled={publishDisabled || publishing}
        >
          <Rocket size={16} aria-hidden />
          {publishing ? t('editor.saving') : publishLabel}
        </button>
      </div>
    </div>
  );
}