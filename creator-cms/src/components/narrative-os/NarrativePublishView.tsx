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
  /** Soft recommended min (e.g. 1000). Guidance only — never blocks publish. */
  minWords?: number | null;
  /** Soft recommended max (e.g. 1500). Prefer maxWords when available. */
  hardMaxWords?: number | null;
  /** Soft recommended max when provided separately from hardMaxWords. */
  maxWords?: number | null;
}

/**
 * Launch policy: publish-now only (scheduling deferred for private beta).
 * Chapter length is never a barrier — recommended band is soft guidance only.
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
  maxWords = null,
}: NarrativePublishViewProps) {
  void _publishDisabledIgnored;
  const { t, locale } = useLocale();
  const busy = publishing || scheduling;
  const te = locale === 'te';
  const recommendedMax = maxWords ?? hardMaxWords;
  const readyLine = te
    ? `Chapter ${chapterNum} సిద్ధంగా ఉందా?`
    : `Is Chapter ${chapterNum} ready?`;
  const backLabel = te ? 'రాయడానికి తిరిగి' : t('narrativeOs.backToWrite');
  const scheduleComingSoon = te
    ? 'షెడ్యూల్డ్ ప్రచురణ త్వరలో — ఇప్పుడు ఇప్పుడే ప్రచురించండి.'
    : 'Scheduled publish is coming later — for now, publish when ready.';
  const underSoft = minWords != null && wordCount > 0 && wordCount < minWords;
  const overSoft = recommendedMax != null && wordCount > recommendedMax;
  const outsideRecommended = underSoft || overSoft;

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

        {minWords != null && recommendedMax != null && (
          <p className="nos-publish__note" role="status">
            {te
              ? `సిఫార్సు ${minWords.toLocaleString('te')}–${recommendedMax.toLocaleString('te')} పదాలు · ఏ పొడవు అయినా ప్రచురించవచ్చు.`
              : `Recommended ${minWords.toLocaleString()}–${recommendedMax.toLocaleString()} words · publish any length.`}
          </p>
        )}

        {outsideRecommended && minWords != null && recommendedMax != null && (
          <p className="nos-publish__note" role="status">
            {underSoft
              ? te
                ? `ప్రస్తుతం ${wordCount.toLocaleString('te')} పదాలు — సిఫార్సు కంటే తక్కువ, కానీ ప్రచురించవచ్చు.`
                : `You have ${wordCount.toLocaleString()} words — below the recommended range, but still publishable.`
              : te
                ? `ప్రస్తుతం ${wordCount.toLocaleString('te')} పదాలు — సిఫార్సు కంటే ఎక్కువ, కానీ ప్రచురించవచ్చు.`
                : `You have ${wordCount.toLocaleString()} words — above the recommended range, but still publishable.`}
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
            onPublish();
          }}
          disabled={busy}
          title={busy ? undefined : 'Submit for review — any length is allowed'}
        >
          <Rocket size={16} aria-hidden />
          {publishing ? t('editor.saving') : publishLabel}
        </button>
      </div>
    </div>
  );
}
