import { Feather } from 'lucide-react';

interface InkProgressProps {
  wordsToday: number;
  dailyGoal: number;
  label?: string;
}

/** Page/ink metaphor for daily word goal — replaces fitness-style progress ring */
export function InkProgress({ wordsToday, dailyGoal, label = "Today's ink" }: InkProgressProps) {
  const pct = Math.min(100, Math.round((wordsToday / dailyGoal) * 100));
  const pagesFilled = Math.min(5, Math.ceil(pct / 20));

  return (
    <div className="ink-progress" aria-label={`${label}: ${wordsToday} of ${dailyGoal} words`}>
      <div className="ink-progress__pages" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={`ink-progress__page${i < pagesFilled ? ' ink-progress__page--filled' : ''}`}
          />
        ))}
      </div>
      <div className="ink-progress__copy">
        <span className="ink-progress__label">
          <Feather size={13} aria-hidden />
          {label}
        </span>
        <span className="ink-progress__numbers">
          {wordsToday.toLocaleString('en-IN')}
          <span className="ink-progress__goal"> / {dailyGoal.toLocaleString('en-IN')}</span>
        </span>
        <div
          className="ink-progress__bar"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span className="ink-progress__fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="ink-progress__hint">{pct}% of daily pages</span>
      </div>
    </div>
  );
}