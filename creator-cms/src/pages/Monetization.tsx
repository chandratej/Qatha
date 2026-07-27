import { useMemo, useState } from 'react';
import { CalendarClock, ChevronDown, IndianRupee } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { useLocale } from '../context/LocaleContext';
import { formatInr } from '../lib/dashboardFormat';
import {
  STORY_TRUST_LEVELS,
  BASE_CREATOR_SHARE_PCT,
  type StoryTrustLevelId,
} from '../../../packages/shared/story-trust';
import {
  anyStoryMonetizationEligible,
  buildStoryEarningsRows,
  formatPayoutDate,
  formatPayoutDateLong,
  loadPayoutHistory,
  nextQuarterlyPayoutDate,
  sumLifetimePayouts,
  sumQuarterEarnings,
  tierBadgeLabel,
} from '../lib/payouts';
import { READER_TIERS } from '../../../packages/shared/readerTiers';
import '../styles/payouts-v2.css';

/**
 * Earn → Payouts tab (`/earn/payouts`).
 * Prototype: katha_payouts_v2.html — real earnings view, not brand charter.
 * Reviews tab is untouched (separate route under Earn hub).
 */
export function Monetization() {
  const { locale } = useLocale();
  const te = locale === 'te';
  const { data, loading, error } = useApi(() => api.getCreatorStories().catch(() => ({ stories: [] })));
  const [howOpen, setHowOpen] = useState(false);

  const stories = data?.stories ?? [];
  const rows = useMemo(() => buildStoryEarningsRows(stories), [stories]);
  const history = useMemo(() => loadPayoutHistory(), []);
  const nextPayout = useMemo(() => nextQuarterlyPayoutDate(), []);
  const quarterTotal = sumQuarterEarnings(rows);
  const lifetimePaid = sumLifetimePayouts(history);
  const eligible = anyStoryMonetizationEligible(rows);
  const authorTopTier = useMemo(() => highestTrust(rows.map((r) => r.trustLevel)), [rows]);

  return (
    <div className="payv2 wc-page-enter">
      <header className="payv2-hero">
        <p className="payv2-eyebrow">
          <IndianRupee size={14} aria-hidden />
          {te ? 'సంపాదన' : 'Earn'}
        </p>
        <h1 className="payv2-title" lang={te ? 'te' : undefined}>
          {te ? 'పేమెంట్లు' : 'Payouts'}
        </h1>
        <p className="payv2-subtitle" lang={te ? 'te' : undefined}>
          {te
            ? 'మీ కథల ఆదాయం, తదుపరి చెల్లింపు, పేమెంట్ చరిత్ర.'
            : 'Story earnings, next payout, and payment history.'}
        </p>
      </header>

      {error && (
        <p className="payv2-history-empty" role="alert" style={{ color: '#a13b34' }}>
          {error}
        </p>
      )}

      <div className="payv2-summary" aria-label={te ? 'సారాంశం' : 'Summary'}>
        <div className="payv2-summary-card">
          <p className="payv2-summary-label" lang={te ? 'te' : undefined}>
            {te ? 'ఈ క్వార్టర్ ఆదాయం' : 'This quarter'}
          </p>
          <p className="payv2-summary-value">{formatInr(quarterTotal)}</p>
          <p className="payv2-summary-hint" lang={te ? 'te' : undefined}>
            {quarterTotal === 0
              ? (te
                ? 'పాఠకుల సంపాదన మొదలైతే ఇక్కడ కనిపిస్తుంది'
                : 'Appears here once reader revenue starts')
              : (te ? 'అన్ని కథలు కలిపి' : 'Across all stories')}
          </p>
        </div>
        <div className="payv2-summary-card">
          <p className="payv2-summary-label" lang={te ? 'te' : undefined}>
            {te ? 'మొత్తం చెల్లించినది' : 'Lifetime paid out'}
          </p>
          <p className="payv2-summary-value">{formatInr(lifetimePaid)}</p>
          <p className="payv2-summary-hint" lang={te ? 'te' : undefined}>
            {te ? 'జీవితకాల చెల్లింపులు' : 'All-time completed payouts'}
          </p>
        </div>
        <div className="payv2-summary-card">
          <p className="payv2-summary-label" lang={te ? 'te' : undefined}>
            {te ? 'తదుపరి చెల్లింపు తేదీ' : 'Next payout date'}
          </p>
          <p className="payv2-summary-value payv2-summary-value--date">
            {formatPayoutDate(nextPayout, te ? 'te' : 'en')}
          </p>
          <p className="payv2-summary-hint" lang={te ? 'te' : undefined}>
            {te ? 'త్రైమాసిక చెల్లింపులు' : 'Quarterly cadence'}
          </p>
        </div>
      </div>

      {loading && (
        <p className="payv2-history-empty" role="status">
          {te ? 'లోడ్ అవుతోంది…' : 'Loading…'}
        </p>
      )}

      {!loading && rows.length === 0 && (
        <div className="payv2-empty-stories payv2-empty-stories--path" lang={te ? 'te' : undefined}>
          <p className="payv2-path-title">
            {te ? 'మీ మొదటి ఆదాయానికి మార్గం' : 'Your path to first earnings'}
          </p>
          <ol className="payv2-path-steps">
            <li>
              <span className="payv2-path-step-num" aria-hidden>1</span>
              <span>{te ? 'కథను ప్రచురించండి' : 'Publish a story'}</span>
            </li>
            <li>
              <span className="payv2-path-step-num" aria-hidden>2</span>
              <span>
                {te
                  ? 'యూనిట్ గేట్: సీరియల్ 50 అధ్యాయాలు / సంకలనం 5 కథలు'
                  : 'Unit gate: serial 50 chapters · collection 5 stories'}
              </span>
            </li>
            <li>
              <span className="payv2-path-step-num" aria-hidden>3</span>
              <span>
                {te
                  ? `Performing + టైర్ లాడర్ — Bronze ₹99 నుండి Platform ₹249+`
                  : `Performing + tier ladder — Bronze ₹99 up to Platform ₹249+`}
              </span>
            </li>
          </ol>
          <p className="payv2-path-hint">
            {te
              ? 'పూర్తి వాటా నిచ్చెన క్రింద ఉంది — ప్రతి స్థాయి పారదర్శకం.'
              : 'The full share ladder is below — every tier is transparent.'}
          </p>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <>
          <div className="payv2-section-head">
            <h2 lang={te ? 'te' : undefined}>
              {te ? 'టైర్ & తదుపరి గేట్' : 'Your tier & next gate'}
            </h2>
          </div>
          <p className="payv2-tier-lead" lang={te ? 'te' : undefined}>
            {te
              ? 'పాఠకుల టైర్ = SPI బ్యాండ్ + పదాల వాల్యూమ్. మానిటైజ్‌కు ముందు యూనిట్ గేట్ (సీరియల్ 50 / సంకలనం 5).'
              : 'Reader tier = SPI band + word volume. Unit gate first (serial 50 chapters · collection 5 stories).'}
          </p>
          <ul className="payv2-tier-grid" aria-label={te ? 'కథల టైర్ పురోగతి' : 'Story tier progress'}>
            {rows.map((row) => {
              const p = row.progress;
              const trust = STORY_TRUST_LEVELS.find((l) => l.id === row.trustLevel);
              return (
                <li
                  key={`tier-${row.id}`}
                  className={`payv2-tier-card${p.currentTier ? ' payv2-tier-card--live' : ''}${!p.formatMonetizable ? ' payv2-tier-card--muted' : ''}`}
                >
                  <div className="payv2-tier-card__top">
                    <p className="payv2-tier-card__title" lang="te">{row.title}</p>
                    <span className={`payv2-tier-badge payv2-tier-badge--${p.currentTier || 'none'}`}>
                      {tierBadgeLabel(p.currentTier, te)}
                    </span>
                  </div>
                  <p className="payv2-tier-card__headline" lang={te ? 'te' : undefined}>
                    {p.headline}
                  </p>
                  <p className="payv2-tier-card__detail" lang={te ? 'te' : undefined}>
                    {p.detail}
                  </p>
                  <div className="payv2-tier-card__meta">
                    <span>
                      {row.chapterCount}{' '}
                      {te ? 'యూనిట్లు' : 'units'}
                      {p.unitGateRequired != null
                        ? ` · ${te ? 'గేట్' : 'gate'} ${p.unitGateRequired}`
                        : ''}
                    </span>
                    <span>
                      {trust?.glyph} {trust?.label || row.trustLevel}
                    </span>
                    <span>
                      ~{p.cumulativeWords.toLocaleString()} {te ? 'పదాలు' : 'words'}
                    </span>
                  </div>
                  {p.nextTier && (
                    <p className="payv2-tier-card__next">
                      {te ? 'తదుపరి' : 'Next'}: {tierBadgeLabel(p.nextTier, te)}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="payv2-section-head">
            <h2 lang={te ? 'te' : undefined}>
              {te ? 'కథల వారీగా ఆదాయం' : 'Earnings by story'}
            </h2>
          </div>
          <ul className="payv2-story-list">
            {rows.map((row) => {
              const trust = STORY_TRUST_LEVELS.find((l) => l.id === row.trustLevel)!;
              return (
                <li key={row.id} className="payv2-story-row">
                  <div>
                    <p className="payv2-story-name" lang={te ? 'te' : undefined}>{row.title}</p>
                    <p className="payv2-story-meta" lang={te ? 'te' : undefined}>
                      <span>
                        {row.chapterCount}{' '}
                        {te
                          ? (row.chapterCount === 1 ? 'అధ్యాయం ప్రచురించారు' : 'అధ్యాయాలు ప్రచురించారు')
                          : (row.chapterCount === 1 ? 'chapter published' : 'chapters published')}
                      </span>
                      <span className="payv2-trust-tag">
                        <span aria-hidden>{trust.glyph}</span>
                        {trust.label}
                      </span>
                      <span className="payv2-trust-tag">
                        {tierBadgeLabel(row.readerTier, te)}
                      </span>
                    </p>
                  </div>
                  <div className="payv2-story-earn">
                    <p className="payv2-story-earn-value">{formatInr(row.quarterEarningsInr)}</p>
                    <p className="payv2-story-earn-label" lang={te ? 'te' : undefined}>
                      {te ? 'ఈ క్వార్టర్' : 'This quarter'}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <div className="payv2-next" role="status">
        <CalendarClock size={20} aria-hidden />
        <div>
          <p className="payv2-next-title" lang={te ? 'te' : undefined}>
            {te
              ? `తదుపరి చెల్లింపు: ${formatPayoutDateLong(nextPayout, 'te')}`
              : `Next payout: ${formatPayoutDateLong(nextPayout, 'en')}`}
          </p>
          <p className="payv2-next-sub" lang={te ? 'te' : undefined}>
            {eligible
              ? (te
                ? 'మీ కథల్లో కనీసం ఒకటి Performing లేదా అంతకంటే పైన ఉంది — అర్హత ఉన్న ఆదాయం త్రైమాసికంగా చెల్లుతుంది.'
                : 'At least one story is at Performing or above — eligible revenue pays out quarterly.')
              : (te
                ? 'మానిటైజేషన్ కోసం, మీ కథలు కనీసం "Performing" Story Trust స్థాయికి చేరాలి.'
                : 'To monetize, stories must reach at least Performing Story Trust tier.')}
          </p>
        </div>
      </div>

      <div className="payv2-section-head">
        <h2 lang={te ? 'te' : undefined}>
          {te ? 'చెల్లింపు చరిత్ర' : 'Payment history'}
        </h2>
      </div>
      <div className="payv2-history">
        {history.length === 0 ? (
          <p className="payv2-history-empty" lang={te ? 'te' : undefined}>
            {te
              ? 'ఇంకా చెల్లింపులు లేవు — మీ మొదటి చెల్లింపు ఇక్కడ కనిపిస్తుంది.'
              : 'No payments yet — your first payout will appear here.'}
          </p>
        ) : (
          <ul className="payv2-history-list">
            {[...history]
              .sort((a, b) => b.paidAt.localeCompare(a.paidAt))
              .map((h) => (
                <li key={h.id} className="payv2-history-row">
                  <span className="payv2-history-date">
                    {formatPayoutDate(new Date(h.paidAt), te ? 'te' : 'en')}
                    {h.coveringQuarter ? ` · ${h.coveringQuarter}` : ''}
                  </span>
                  <span className="payv2-history-amount">{formatInr(h.amountInr)}</span>
                  <span className={`payv2-history-status payv2-history-status--${h.status}`}>
                    {statusLabel(h.status, te)}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </div>

      <div className="payv2-how">
        <button
          type="button"
          className="payv2-how-toggle"
          aria-expanded={howOpen}
          aria-controls="payv2-how-body"
          id="payv2-how-toggle"
          onClick={() => setHowOpen((v) => !v)}
          lang={te ? 'te' : undefined}
        >
          <span>{te ? 'ఇది ఎలా లెక్కించబడుతుంది?' : 'How is this calculated?'}</span>
          <ChevronDown size={16} aria-hidden />
        </button>
        {howOpen && (
          <div
            className="payv2-how-body"
            id="payv2-how-body"
            role="region"
            aria-labelledby="payv2-how-toggle"
            lang={te ? 'te' : undefined}
          >
            <p className="payv2-how-lead">
              {te
                ? 'మీ ఆదాయ వాటా Story Trust (SPI) + పదాల వాల్యూమ్ టైర్‌పై ఆధారపడి పెరుగుతుంది. ముందు యూనిట్ గేట్, తర్వాత టైర్.'
                : 'Your share grows with Story Trust (SPI) and the volume-weighted reader tier. Unit gate first, then tier ladder.'}
            </p>
            <div className="payv2-tier-ladder-mini">
              {READER_TIERS.map((t) => (
                <div key={t.id} className="payv2-tier-ladder-mini__row">
                  <strong>{te ? t.labelTelugu : t.label}</strong>
                  <span>₹{t.priceInr}/mo</span>
                  <span className="payv2-tier-ladder-mini__need">
                    {t.minTrustLevel}
                    {t.minCumulativeWords > 0
                      ? ` · ≥${(t.minCumulativeWords / 1000).toFixed(0)}k ${te ? 'పదాలు' : 'words'}`
                      : ''}
                  </span>
                </div>
              ))}
            </div>
            {STORY_TRUST_LEVELS.map((level) => {
              const isCurrent = level.id === authorTopTier;
              const isGate = level.id === 'performing';
              return (
                <div
                  key={level.id}
                  className={`payv2-ladder-row${isCurrent ? ' payv2-ladder-row--current' : ''}`}
                >
                  <span className="payv2-ladder-glyph" aria-hidden>{level.glyph}</span>
                  <span className="payv2-ladder-name">
                    {level.label}
                    {isGate && (
                      <span className="payv2-ladder-gate">
                        {te ? '(మానిటైజేషన్ మొదలు)' : '(monetization starts)'}
                      </span>
                    )}
                    {isCurrent && (
                      <span className="payv2-ladder-gate">
                        {te ? ' · మీ స్థాయి' : ' · you'}
                      </span>
                    )}
                  </span>
                  <span className="payv2-ladder-share">
                    {level.monetizationEligible ? `${level.revenueSharePct}%` : '—'}
                  </span>
                </div>
              );
            })}
            <p className="payv2-how-foot">
              {te
                ? `బేస్ రచయిత వాటా ${BASE_CREATOR_SHARE_PCT}% × Story Trust గుణకం · త్రైమాసిక చెల్లింపులు మాత్రమే`
                : `Base author share ${BASE_CREATOR_SHARE_PCT}% × Story Trust multiplier · quarterly payouts only`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function highestTrust(levels: StoryTrustLevelId[]): StoryTrustLevelId {
  if (levels.length === 0) return 'incubation';
  let best: StoryTrustLevelId = 'incubation';
  let bestOrder = -1;
  for (const id of levels) {
    const order = STORY_TRUST_LEVELS.find((l) => l.id === id)?.order ?? -1;
    if (order > bestOrder) {
      bestOrder = order;
      best = id;
    }
  }
  return best;
}

function statusLabel(status: string, te: boolean): string {
  if (status === 'paid') return te ? 'చెల్లించారు' : 'Paid';
  if (status === 'processing') return te ? 'ప్రాసెస్‌లో' : 'Processing';
  if (status === 'failed') return te ? 'విఫలం' : 'Failed';
  return status;
}

