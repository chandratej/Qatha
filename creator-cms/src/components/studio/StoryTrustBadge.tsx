import { trustLevelById, type StoryTrustLevelId } from '../../../../packages/shared/story-trust';

interface Props {
  level: StoryTrustLevelId;
  compact?: boolean;
  showShare?: boolean;
}

export function StoryTrustBadge({ level, compact, showShare }: Props) {
  const trust = trustLevelById(level);

  return (
    <span
      className={`story-trust-badge story-trust-badge--${level}${compact ? ' story-trust-badge--compact' : ''}`}
      title={trust.purpose}
    >
      <span className="story-trust-badge__glyph" aria-hidden>{trust.glyph}</span>
      <span className="story-trust-badge__label">{trust.label}</span>
      {showShare && trust.monetizationEligible && (
        <span className="story-trust-badge__share">{trust.revenueSharePct}% share</span>
      )}
      {!trust.monetizationEligible && !compact && (
        <span className="story-trust-badge__signal">Signal collection</span>
      )}
    </span>
  );
}