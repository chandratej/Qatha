import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import {
  STORY_TRUST_LEVELS,
  trustLevelForReaders,
  effectiveCreatorSharePct,
  type StoryTrustLevelId,
} from '../../../../packages/shared/story-trust';
import { useLocale } from '../../context/LocaleContext';

interface Props {
  totalReads: number;
  /** Optional per-story top level when SPI is available */
  trustLevel?: StoryTrustLevelId | string | null;
  compact?: boolean;
}

/**
 * Visible 7-band Story Trust ladder — economic moat surface.
 * Climbing Emerging → Anchor is money on the line if the writer leaves.
 */
export function TrustLadderPanel({ totalReads, trustLevel, compact }: Props) {
  const { locale } = useLocale();
  const te = locale === 'te';
  const level = (trustLevel || trustLevelForReaders(totalReads)) as StoryTrustLevelId;
  const current = STORY_TRUST_LEVELS.find((l) => l.id === level) || STORY_TRUST_LEVELS[0];
  const share = effectiveCreatorSharePct(level);
  const idx = STORY_TRUST_LEVELS.findIndex((l) => l.id === current.id);
  const next = idx >= 0 && idx < STORY_TRUST_LEVELS.length - 1 ? STORY_TRUST_LEVELS[idx + 1] : null;

  return (
    <section
      className={`moat-trust-ladder${compact ? ' moat-trust-ladder--compact' : ''}`}
      aria-label={te ? 'స్టోరీ ట్రస్ట్ నిచ్చెన' : 'Story Trust ladder'}
    >
      <header className="moat-trust-ladder__head">
        <TrendingUp size={18} aria-hidden />
        <div>
          <h3>{te ? 'స్టోరీ ట్రస్ట్ నిచ్చెన' : 'Story Trust ladder'}</h3>
          <p>
            {te
              ? 'పాఠక విలువతో బ్యాండ్ ఎదుగుతుంది — వేరే ప్లాట్‌ఫామ్‌లో ఇది సున్నాకి తిరుగుతుంది.'
              : 'Your band grows with reader value — it resets to zero on any other platform.'}
          </p>
        </div>
      </header>

      <div className="moat-trust-ladder__current">
        <span className="moat-trust-ladder__glyph" aria-hidden>{current.glyph}</span>
        <div>
          <strong>{current.label}</strong>
          <span>
            {share > 0
              ? (te ? `${share}% రచయిత షేర్ · త్రైమాసిక చెల్లింపులు` : `${share}% author share · quarterly payouts`)
              : (te ? 'మానిటైజేషన్ గేట్ ముందు' : 'Pre-monetization · building signals')}
          </span>
        </div>
      </div>

      <ol className="moat-trust-ladder__steps">
        {STORY_TRUST_LEVELS.map((band) => {
          const active = band.id === current.id;
          const passed = band.order < current.order;
          return (
            <li
              key={band.id}
              className={
                active ? 'is-active' : passed ? 'is-passed' : 'is-ahead'
              }
              title={band.purpose}
            >
              <span aria-hidden>{band.glyph}</span>
              <span className="moat-trust-ladder__band-name">{band.label}</span>
              {band.monetizationEligible && (
                <span className="moat-trust-ladder__share">{band.revenueSharePct}%</span>
              )}
            </li>
          );
        })}
      </ol>

      {next && (
        <p className="moat-trust-ladder__next">
          {te ? 'తదుపరి బ్యాండ్' : 'Next band'}: <strong>{next.label}</strong>
          {next.monetizationEligible
            ? ` · ${next.revenueSharePct}% ${te ? 'షేర్' : 'share'}`
            : ''}
        </p>
      )}

      <Link to="/earn/payouts" className="btn btn-secondary moat-trust-ladder__cta">
        {te ? 'పేమెంట్లు & బ్యాండ్' : 'Payouts & band detail'}
      </Link>
    </section>
  );
}
