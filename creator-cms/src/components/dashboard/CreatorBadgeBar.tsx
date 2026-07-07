import { Award, Percent } from 'lucide-react';
import { getCreatorBadge, getNextBadge } from '../../lib/creatorBadge';
import { formatCompact } from '../../lib/dashboardFormat';

interface Props {
  totalReads: number;
  revenueSharePct: number;
}

export function CreatorBadgeBar({ totalReads, revenueSharePct }: Props) {
  const badge = getCreatorBadge(totalReads);
  const next = getNextBadge(totalReads);

  return (
    <div className="creator-badge-bar" role="region" aria-label="Creator status">
      <div className="creator-badge-bar__item" title={`${revenueSharePct}% of each subscription goes to you`}>
        <Percent size={16} aria-hidden />
        <span><strong>{revenueSharePct}%</strong> revenue share</span>
      </div>
      <div className="creator-badge-bar__item" title={badge.description}>
        <Award size={16} aria-hidden />
        <span>Badge: <strong>{badge.label}</strong></span>
      </div>
      {next && (
        <div className="creator-badge-bar__next">
          Next: {next.label} at {formatCompact(next.minReads)} reads
        </div>
      )}
    </div>
  );
}