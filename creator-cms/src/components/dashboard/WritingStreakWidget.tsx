import { Flame } from 'lucide-react';
import { getStreakHeatmap, getWeekHeatmap } from '../../lib/writingStreak';

interface Props {
  currentStreak: number;
  longestStreak: number;
}

export function WritingStreakWidget({ currentStreak, longestStreak }: Props) {
  const week = getWeekHeatmap();
  const heatmap = getStreakHeatmap();

  return (
    <div className="dashboard-panel dashboard-panel--compact writing-streak-widget">
      <div className="writing-streak-widget__head">
        <Flame size={20} className="writing-streak-widget__flame" aria-hidden />
        <div>
          <div className="writing-streak-widget__days">{currentStreak} day streak</div>
          <div className="writing-streak-widget__hint">Longest: {longestStreak} days · Keep writing!</div>
        </div>
      </div>
      <div className="writing-streak-widget__week" aria-label="This week">
        {week.map((d, i) => (
          <div key={i} className="writing-streak-widget__day">
            <span className={`writing-streak-widget__dot${d.active ? ' writing-streak-widget__dot--active' : ''}`} title={d.words ? `${d.words} words` : 'No activity'} />
            <span className="writing-streak-widget__label">{d.label}</span>
          </div>
        ))}
      </div>
      <div className="streak-heatmap" role="img" aria-label="12 week writing heatmap">
        {heatmap.map((c) => (
          <span key={c.date} className={`streak-heatmap__cell streak-heatmap__cell--${c.level}`} title={`${c.date}: ${c.words} words`} />
        ))}
      </div>
    </div>
  );
}