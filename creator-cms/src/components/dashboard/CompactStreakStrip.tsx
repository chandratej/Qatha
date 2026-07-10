import { useState } from 'react';
import { DiyaIcon } from '../studio/DiyaIcon';
import { getMonthHeatmap, getWeekHeatmap } from '../../lib/writingStreak';

interface Props {
  currentStreak: number;
  longestStreak: number;
}

export function CompactStreakStrip({ currentStreak, longestStreak }: Props) {
  const [range, setRange] = useState<'7' | '30'>('7');
  const week = getWeekHeatmap();
  const month = getMonthHeatmap();

  return (
    <div className="compact-streak" role="group" aria-label="Writing streak">
      <div className="compact-streak__summary">
        <DiyaIcon size={15} className="compact-streak__diya" />
        <span className="compact-streak__count">{currentStreak}</span>
        <span className="compact-streak__label">day lamp lit</span>
        <span className="compact-streak__sep" aria-hidden>·</span>
        <span className="compact-streak__best">best {longestStreak}</span>
      </div>
      <div className="compact-streak__dots" aria-label={range === '7' ? 'This week' : 'Last 30 days'}>
        {range === '7'
          ? week.map((d, i) => (
              <span
                key={i}
                className={`compact-streak__dot${d.active ? ' compact-streak__dot--active' : ''}`}
                title={d.words ? `${d.words} words` : 'No activity'}
              >
                <span className="sr-only">{d.label}</span>
              </span>
            ))
          : month.map((d) => (
              <span
                key={d.date}
                className={`compact-streak__dot compact-streak__dot--tiny compact-streak__dot--l${d.level}`}
                title={`${d.date}: ${d.words} words`}
              />
            ))}
      </div>
      <div className="compact-streak__toggle" role="tablist" aria-label="Streak range">
        <button
          type="button"
          role="tab"
          aria-selected={range === '7'}
          className={`compact-streak__toggle-btn${range === '7' ? ' compact-streak__toggle-btn--active' : ''}`}
          onClick={() => setRange('7')}
        >
          7d
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={range === '30'}
          className={`compact-streak__toggle-btn${range === '30' ? ' compact-streak__toggle-btn--active' : ''}`}
          onClick={() => setRange('30')}
        >
          30d
        </button>
      </div>
    </div>
  );
}