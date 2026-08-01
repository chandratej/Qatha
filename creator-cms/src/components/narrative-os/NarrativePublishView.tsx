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
  /** Hard publish min (Serialized Story = 800). Omit when format has no hard gate. */
  minWords?: number | null;
  hardMaxWords?: number | null;
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
  publishDisabled: _publishDisabledIgnored,
  onPublish,
  onBackToWrite,
  scheduling = false,
  scheduleError = null,
  scheduleSuccess = null,
  minWords = null,
  hardMaxWords = null,
}: NarrativePublishViewProps) {
  void _publishDisabledIgnored;
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
  const belowMin = minWords != null && wordCount > 0 && wordCount < minWords;
  const overMax = hardMaxWords != null && wordCount > hardMaxWords;
  const outOfBand = belowMin || overMax;

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

        {belowMin && minWords != null && (
          <p className="nos-publish__error" role="status">
            {te
              ? `ప్రచురణకు కనీసం ${minWords.toLocaleString('te')} పదాలు అవసరం (ప్రస్తుతం ${wordCount.toLocaleString('te')}). Publish నొక్కితే వివరాలు చూస్తారు.`
              : `Need at least ${minWords.toLocaleString()} words to publish (you have ${wordCount.toLocaleString()}). Click Publish for details.`}
          </p>
        )}
        {overMax && hardMaxWords != null && (
          <p className="nos-publish__error" role="status">
            {te
              ? `గరిష్ఠ ${hardMaxWords.toLocaleString('te')} పదాలు (ప్రస్తుతం ${wordCount.toLocaleString('te')}).`
              : `Hard max is ${hardMaxWords.toLocaleString()} words (you have ${wordCount.toLocaleString()}). Trim before publishing.`}
          </p>
        )}

        <p className="nos-publish__note">{t('narrativeOs.publishNote')}</p>
        <p className="nos-publish__schedule-hint" lang={te ? 'te' : 'en'}>
          {scheduleComingSoon}
        </p>

        {scheduleError && <p className="nos-publish__error" role="alert">{scheduleError}</p>}
        {scheduleSuccess && <p className="nos-publish__success" role="status">{scheduleSuccess}</p>}

        <button
          type="button"
          className="nos-publish__cta"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Failsafe: always invoke parent handler (word-band alert lives there).
            onPublish();
          }}
          disabled={busy}
          title={
            belowMin && minWords != null
              ? `Need at least ${minWords.toLocaleString()} words (you have ${wordCount})`
              : overMax && hardMaxWords != null
                ? `Over hard max ${hardMaxWords.toLocaleString()} words (you have ${wordCount})`
                : busy
                  ? undefined
                  : 'Submit for review — word limits are checked on click'
          }
        >
          <Rocket size={16} aria-hidden />
          {publishing ? t('editor.saving') : publishLabel}
        </button>
        {outOfBand && belowMin && minWords != null && (
          <p className="nos-publish__error" role="alert" style={{ marginTop: 12 }}>
            {te
              ? `ప్రచురణ బ్లాక్: కనీసం ${minWords.toLocaleString('te')} పదాలు (ప్రస్తుతం ${wordCount}). బటన్ నొక్కితే వివరాలు.`
              : `Publishing blocked: need at least ${minWords.toLocaleString()} words (you have ${wordCount}). Click the button for details.`}
          </p>
        )}
      </div>
    </div>
  );
}
