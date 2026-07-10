import { Award, Percent, Shield } from 'lucide-react';
import { getAuthorLevelBadge, getNextAuthorLevelBadge } from '../../lib/creatorBadge';
import { StoryTrustBadge } from '../studio/StoryTrustBadge';
import { trustLevelForReaders } from '../../../../packages/shared/story-trust';
import { effectiveCreatorSharePct } from '../../../../packages/shared/story-trust';
import { formatCompact } from '../../lib/dashboardFormat';

interface Props {
  totalReads: number;
  publishedStories?: number;
  verified?: boolean;
}

export function CreatorBadgeBar({ totalReads, publishedStories = 0, verified }: Props) {
  const authorLevel = getAuthorLevelBadge({
    publishedStories: publishedStories || (totalReads > 0 ? 1 : 0),
    totalReaders: totalReads,
    verified,
  });
  const nextLevel = getNextAuthorLevelBadge(authorLevel.id);
  const storyTrust = trustLevelForReaders(totalReads);
  const effectiveShare = effectiveCreatorSharePct(storyTrust);

  return (
    <div className="creator-badge-bar" role="region" aria-label="Author status and Story Trust">
      <div className="creator-badge-bar__item" title={authorLevel.description}>
        <Award size={16} aria-hidden />
        <span>Author: <strong>{authorLevel.label}</strong></span>
      </div>
      <div className="creator-badge-bar__item">
        <Shield size={16} aria-hidden />
        <StoryTrustBadge level={storyTrust} compact />
      </div>
      <div
        className="creator-badge-bar__item"
        title="Base share × Story Trust multiplier — quarterly payouts"
      >
        <Percent size={16} aria-hidden />
        <span>
          <strong>{effectiveShare > 0 ? `${effectiveShare}%` : '—'}</strong>
          {' '}author share
        </span>
      </div>
      {nextLevel && (
        <div className="creator-badge-bar__next">
          Next: {nextLevel.label}
        </div>
      )}
      {totalReads > 0 && totalReads < 2000 && (
        <div className="creator-badge-bar__hint">
          {formatCompact(2000 - totalReads)} reads to Performing · monetization gate
        </div>
      )}
    </div>
  );
}