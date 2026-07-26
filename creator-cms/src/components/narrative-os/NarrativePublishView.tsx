import { Rocket, X } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';

export type PublishTimingMode = 'now' | 'schedule';

interface NarrativePublishViewProps {
  wordCount: number;
  sceneCount: number;
  chapterNum: number;
  publishLabel: string;
  publishing: boolean;
  publishDisabled: boolean;
  onPublish: () => void;
  /** Kept for call-site compatibility; scheduling deferred for v1 beta. */
  onSchedule?: (isoDatetime: string) => void | Promise<void>;
  onBackToWrite: () => void;
  scheduling?: boolean;
  scheduleError?: string | null;
  scheduleSuccess?: string | null;
}

/**
 * Launch policy: publish-now only (scheduling deferred for private beta).
 * Schedule UI is intentionally omitted — honest "coming later" note only.
 */
export function NarrativePublishView({
  wordCount,
  sceneCount,
  chapterNum,
  publishLabel,
  publishing,
  publishDisabled,
  onPublish,
  onBackToWrite,
  scheduling = false,
  scheduleError = null,
  scheduleSuccess = null,
}: NarrativePublishViewProps) {
  const { t, locale } = useLocale();
  const busy = publishing || scheduling;
  const te = locale === 'te';
  const readyLine = te
    ? `Chapter ${chapterNum} సిద్ధంగా ఉందా?`
    : `Is Chapter ${chapterNum} ready?`;
  const backLabel = te ? 'రాయడానికి తిరిగి' : t('narrativeOs.backToWrite');
  const scheduleComingSoon = te
    ? 'షెడ్యూల్డ్ ప్రచురణ త్వరలో — ఇప్పుడు ఇప్పుడే ప్రచురించండి.'
    : 'Scheduled publish is coming later — for now, publish when ready.';

  return (
    <div className="nos-mode-surface nos-publish">
      <header className="nos-mode-header">
        <div className="nos-mode-header__left">
          <h2>{t('narrativeOs.phasePublish')}</h2>
          <p>{readyLine}</p>
        </div>
        <button type="button" className="nos-mode-close" onClick={onBackToWrite}>
          <X size={14} aria-hidden />
          {backLabel}
        </button>
      </header>

      <div className="nos-publish__body">
        <div className="nos-publish__card nos-publish__card--stats">
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
        <p className="nos-publish__schedule-hint" lang={te ? 'te' : 'en'}>
          {scheduleComingSoon}
        </p>

        {scheduleError && <p className="nos-publish__error" role="alert">{scheduleError}</p>}
        {scheduleSuccess && <p className="nos-publish__success" role="status">{scheduleSuccess}</p>}

        <button
          type="button"
          className="nos-publish__cta"
          onClick={onPublish}
          disabled={publishDisabled || busy}
          title={busy ? undefined : 'Submit for review — word limits are checked on click'}
        >
          <Rocket size={16} aria-hidden />
          {publishing ? t('editor.saving') : publishLabel}
        </button>
      </div>
    </div>
  );
}
