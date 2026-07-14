import { Scale, ShieldCheck, Sparkles } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import {
  DEFAULT_CONTEST_LEGAL,
  evaluateContestLegal,
  type ContestLegalInput,
} from '../../lib/contestLegalEngine';

const BADGE_KEYS = {
  skill_based: 'events.legalSkillBased',
  free_entry: 'events.legalFreeEntry',
  recognition_only: 'events.legalNoCash',
  legal_approved: 'events.legalApproved',
  legal_pending: 'events.legalPending',
} as const;

interface Props {
  legal?: ContestLegalInput;
  compact?: boolean;
}

export function ContestLegalPanel({ legal = DEFAULT_CONTEST_LEGAL, compact = false }: Props) {
  const { t } = useLocale();
  const evaluation = evaluateContestLegal(legal);

  return (
    <section
      className={`contest-legal-panel${compact ? ' contest-legal-panel--compact' : ''}`}
      aria-labelledby="contest-legal-title"
    >
      <div className="contest-legal-panel__head">
        <Scale size={18} aria-hidden className="contest-legal-panel__icon" />
        <div>
          <h4 id="contest-legal-title" className="contest-legal-panel__title">
            {t('events.legalPanelTitle')}
          </h4>
          {!compact && (
            <p className="contest-legal-panel__hint input-hint">{t('events.legalPanelHint')}</p>
          )}
        </div>
        <span
          className={`contest-legal-panel__status contest-legal-panel__status--${evaluation.status}`}
          role="status"
        >
          {evaluation.status === 'approved'
            ? <ShieldCheck size={14} aria-hidden />
            : <Sparkles size={14} aria-hidden />}
          {evaluation.status === 'approved'
            ? t('events.legalApproved')
            : t('events.legalPending')}
        </span>
      </div>

      <ul className="contest-legal-panel__badges" role="list">
        {evaluation.trustBadges.map((badge) => (
          <li key={badge} className="contest-legal-panel__badge">
            {t(BADGE_KEYS[badge])}
          </li>
        ))}
      </ul>

      {!evaluation.canPublish && (
        <p className="contest-legal-panel__warning input-hint" role="note">
          {t('events.legalApprovalRequired')}
        </p>
      )}
    </section>
  );
}