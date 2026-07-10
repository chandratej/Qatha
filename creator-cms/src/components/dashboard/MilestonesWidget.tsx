import { Link } from 'react-router-dom';
import { ChevronRight, Crown } from 'lucide-react';
import { getAuthorLevelBadge, getNextAuthorLevelBadge } from '../../lib/creatorBadge';
import { formatCompact } from '../../lib/dashboardFormat';

const LEVEL_TARGETS: Record<string, number> = {
  author: 1,
  certified_author: 1,
  featured_author: 1_000,
  katha_creator: 10_000,
  katha_fellow: 50_000,
  katha_laureate: 200_000,
};

export function MilestonesWidget({ totalReads }: { totalReads: number }) {
  const current = getAuthorLevelBadge({ publishedStories: totalReads > 0 ? 1 : 0, totalReaders: totalReads });
  const next = getNextAuthorLevelBadge(current.id);
  const target = next ? (LEVEL_TARGETS[next.id] ?? 10_000) : 200_000;
  const pct = Math.min(100, Math.round((totalReads / target) * 100));

  return (
    <div className="dashboard-panel dashboard-panel--compact milestones-widget">
      <Crown size={22} color="var(--dash-gold)" aria-hidden />
      <div className="milestones-widget__title">Your literary journey</div>
      <div className="milestones-widget__badge">{next?.label ?? 'Katha Laureate'}</div>
      <p className="milestones-widget__desc">
        Reach {formatCompact(target)} readers to advance to {next?.label ?? 'the highest honour'}.
      </p>
      <div className="milestones-widget__progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="milestones-widget__bar" style={{ width: `${pct}%` }} />
      </div>
      <div className="milestones-widget__meta">{formatCompact(totalReads)} / {formatCompact(target)} readers</div>
      <Link to="/monetization" className="panel-view-all">Story Trust & earnings <ChevronRight size={14} aria-hidden /></Link>
    </div>
  );
}