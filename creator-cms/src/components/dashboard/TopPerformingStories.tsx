import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { formatCompact } from '../../lib/dashboardFormat';

interface Row { story_id: string; title: string; total_readers: number }

export function TopPerformingStories({ stories, analyticsHref }: { stories: Row[]; analyticsHref?: string }) {
  return (
    <div className="dashboard-panel">
      <div className="dashboard-panel__head">
        <h3 className="dashboard-panel__title">Top Performing Stories</h3>
      </div>
      <ol className="top-stories__list">
        {stories.length === 0 ? (
          <li className="top-stories__empty">Publish chapters to see rankings.</li>
        ) : stories.map((s, i) => (
          <li key={s.story_id} className="top-stories__item">
            <span className="top-stories__rank">{i + 1}</span>
            <span className="top-stories__title">{s.title}</span>
            <span className="top-stories__reads">{formatCompact(s.total_readers)}</span>
          </li>
        ))}
      </ol>
      {analyticsHref && <Link to={analyticsHref} className="panel-view-all">Go to Analytics <ChevronRight size={14} aria-hidden /></Link>}
    </div>
  );
}