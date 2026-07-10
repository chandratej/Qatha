import { STORY_TRUST_LEVELS, BASE_CREATOR_SHARE_PCT } from '../../../../packages/shared/story-trust';
import type { StoryTrustLevelId } from '../../../../packages/shared/story-trust';

interface Props {
  activeLevel?: StoryTrustLevelId;
  highlightMonetizationGate?: boolean;
}

export function StoryTrustLadder({ activeLevel, highlightMonetizationGate = true }: Props) {
  const activeOrder = activeLevel ? STORY_TRUST_LEVELS.find((t) => t.id === activeLevel)?.order : -1;

  return (
    <div className="story-trust-ladder" role="list" aria-label="Story Trust progression">
      {STORY_TRUST_LEVELS.map((level) => {
        const isActive = activeOrder != null && level.order <= activeOrder;
        const isCurrent = level.id === activeLevel;
        const isGate = level.id === 'performing';

        return (
          <div
            key={level.id}
            role="listitem"
            className={[
              'story-trust-ladder__rung',
              isActive && 'story-trust-ladder__rung--reached',
              isCurrent && 'story-trust-ladder__rung--current',
              isGate && highlightMonetizationGate && 'story-trust-ladder__rung--gate',
            ].filter(Boolean).join(' ')}
          >
            <span className="story-trust-ladder__glyph" aria-hidden>{level.glyph}</span>
            <div className="story-trust-ladder__body">
              <span className="story-trust-ladder__name">{level.label}</span>
              <span className="story-trust-ladder__purpose">{level.purpose}</span>
            </div>
            <span className="story-trust-ladder__share">
              {level.monetizationEligible
                ? `${level.revenueSharePct}%`
                : '—'}
            </span>
          </div>
        );
      })}
      <p className="story-trust-ladder__footnote">
        Base author share {BASE_CREATOR_SHARE_PCT}% × Story Trust multiplier · Quarterly payouts only
      </p>
    </div>
  );
}