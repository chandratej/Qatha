import { Link } from 'react-router-dom';
import { ChevronRight, Crown } from 'lucide-react';
import { getNextBadge } from '../../lib/creatorBadge';
import { formatCompact } from '../../lib/dashboardFormat';

export function MilestonesWidget({ totalReads }: { totalReads: number }) {
  const next = getNextBadge(totalReads);
  const target = next?.minReads ?? 2_000_000;
  const pct = Math.min(100, Math.round((totalReads / target) * 100));

  return (
    <div className="dashboard-panel dashboard-panel--compact milestones-widget">
      <Crown size={22} color="var(--dash-gold)" aria-hidden />
      <div className="milestones-widget__title">You&apos;re almost there!</div>
      <div className="milestones-widget__badge">{next?.label ?? 'Top Creator'} Badge</div>
      <p className="milestones-widget__desc">Reach {formatCompact(target)} reads to unlock your next badge and stand out to readers.</p>
      <div className="milestones-widget__progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="milestones-widget__bar" style={{ width: `${pct}%` }} />
      </div>
      <div className="milestones-widget__meta">{formatCompact(totalReads)} / {formatCompact(target)} reads</div>
      <Link to="/profile" className="panel-view-all">View all milestones <ChevronRight size={14} aria-hidden /></Link>
    </div>
  );
}