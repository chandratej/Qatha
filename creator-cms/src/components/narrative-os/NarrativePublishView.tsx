import { useMemo, useState } from 'react';
import { CalendarClock, Rocket, X } from 'lucide-react';
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
  onSchedule: (isoDatetime: string) => void | Promise<void>;
  onBackToWrite: () => void;
  scheduling?: boolean;
  scheduleError?: string | null;
  scheduleSuccess?: string | null;
}

function defaultScheduleLocalValue() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(8, 0, 0, 0);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function minScheduleLocalValue() {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 5);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function NarrativePublishView({
  wordCount,
  sceneCount,
  chapterNum,
  publishLabel,
  publishing,
  publishDisabled,
  onPublish,
  onSchedule,
  onBackToWrite,
  scheduling = false,
  scheduleError = null,
  scheduleSuccess = null,
}: NarrativePublishViewProps) {
  const { t, locale } = useLocale();
  const [mode, setMode] = useState<PublishTimingMode>('now');
  const [scheduleAt, setScheduleAt] = useState(defaultScheduleLocalValue);
  const busy = publishing || scheduling;
  const minAt = useMemo(() => minScheduleLocalValue(), []);

  const te = locale === 'te';
  const readyLine = te
    ? `Chapter ${chapterNum} సిద్ధంగా ఉందా?`
    : `Is Chapter ${chapterNum} ready?`;
  const nowLabel = te ? 'ఇప్పుడు ప్రచురించు' : 'Publish now';
  const scheduleLabel = te ? 'షెడ్యూల్ చేయండి' : 'Schedule';
  const scheduleFieldLabel = te ? 'ప్రచురణ తేదీ & సమయం' : 'Publish date & time';
  const scheduleHint = te
    ? 'మీరు ఎంచుకున్న సమయానికి ఇది స్వయంచాలకంగా లైవ్ అవుతుంది — మీరు ఆన్‌లైన్‌లో లేకపోయినా. ఎప్పుడైనా రీషెడ్యూల్ లేదా రద్దు చేయవచ్చు.'
    : 'Goes live automatically at the chosen time — even if you are offline. You can reschedule or cancel anytime.';
  const scheduleNote = te
    ? 'షెడ్యూల్ చేసిన తర్వాత కూడా మోడరేషన్ క్యూలో ఉంటుంది — లైవ్ అయ్యే ముందు ఆమోదించబడాలి.'
    : 'Scheduled chapters still enter moderation before going live.';
  const confirmSchedule = te ? 'షెడ్యూల్ నిర్ధారించండి' : 'Confirm schedule';
  const backLabel = te ? 'రాయడానికి తిరిగి' : t('narrativeOs.backToWrite');

  const handlePrimary = () => {
    if (mode === 'now') {
      onPublish();
      return;
    }
    if (!scheduleAt) return;
    const iso = new Date(scheduleAt).toISOString();
    void onSchedule(iso);
  };

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

        <div className="nos-publish__choice" role="tablist" aria-label={te ? 'ప్రచురణ సమయం' : 'Publish timing'}>
          <button
            type="button"
            role="tab"
            className={mode === 'now' ? 'active' : ''}
            aria-selected={mode === 'now'}
            onClick={() => setMode('now')}
            disabled={busy}
          >
            <Rocket size={14} aria-hidden />
            {nowLabel}
          </button>
          <button
            type="button"
            role="tab"
            className={mode === 'schedule' ? 'active' : ''}
            aria-selected={mode === 'schedule'}
            onClick={() => setMode('schedule')}
            disabled={busy}
          >
            <CalendarClock size={14} aria-hidden />
            {scheduleLabel}
          </button>
        </div>

        {mode === 'schedule' && (
          <div className="nos-publish__schedule-fields" lang={locale === 'te' ? 'te' : 'en'}>
            <label htmlFor="nos-publish-schedule-dt">{scheduleFieldLabel}</label>
            <input
              id="nos-publish-schedule-dt"
              type="datetime-local"
              value={scheduleAt}
              min={minAt}
              onChange={(e) => setScheduleAt(e.target.value)}
              disabled={busy}
            />
            <p className="nos-publish__schedule-hint">{scheduleHint}</p>
          </div>
        )}

        <p className="nos-publish__note">
          {mode === 'schedule' ? scheduleNote : t('narrativeOs.publishNote')}
        </p>

        {scheduleError && <p className="nos-publish__error" role="alert">{scheduleError}</p>}
        {scheduleSuccess && <p className="nos-publish__success" role="status">{scheduleSuccess}</p>}

        <button
          type="button"
          className="nos-publish__cta"
          onClick={handlePrimary}
          disabled={publishDisabled || busy || (mode === 'schedule' && !scheduleAt)}
        >
          {mode === 'schedule' ? (
            <>
              <CalendarClock size={16} aria-hidden />
              {scheduling ? t('editor.saving') : confirmSchedule}
            </>
          ) : (
            <>
              <Rocket size={16} aria-hidden />
              {publishing ? t('editor.saving') : publishLabel}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
