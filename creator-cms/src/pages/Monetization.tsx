import { useEffect, useMemo, useState } from 'react';
import { Award, BookOpen, Crown, IndianRupee, Shield, Sparkles } from 'lucide-react';
import { platformApi } from '../lib/platformApi';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import { StoryTrustLadder } from '../components/studio/StoryTrustLadder';
import { StoryTrustBadge } from '../components/studio/StoryTrustBadge';
import { BRAND, BRAND_COPY } from '../lib/constants';
import {
  SPI_WEIGHTS,
  PATRON_TIERS,
  BRAND_VOCABULARY,
  QUARTERLY_PAYOUTS,
  SHORT_STORY_ECONOMY,
  FIRST_STORY_LAUNCH_FLOW,
  STABILITY_WINDOW_DAYS,
  BASE_CREATOR_SHARE_PCT,
  BRAND_IDENTITY,
  trustLevelForReaders,
} from '../lib/platformConstants';
import { monetizationEligibilityChecklist } from '../business/monetizationEligibility';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { useLocale } from '../context/LocaleContext';

type MonetizationItem = { id: string; label: string; status: string };

export function Monetization() {
  const { t } = useLocale();
  const [reader, setReader] = useState<MonetizationItem[]>([]);
  const [creator, setCreator] = useState<MonetizationItem[]>([]);
  const [platform, setPlatform] = useState<MonetizationItem[]>([]);
  const { data: dash } = useApi(() => api.getDashboard().catch(() => null));

  useEffect(() => {
    platformApi.getMonetization().then((r) => {
      setReader([...r.reader]);
      setCreator([...r.creator]);
      setPlatform([...r.platform]);
    });
  }, []);

  const charter = useMemo(() => BRAND_IDENTITY.charter ?? [], []);

  const eligibility = useMemo(() => {
    const totalReaders = (dash?.stories ?? []).reduce((s, x) => s + x.total_readers, 0);
    const publishedChapters = (dash?.stories ?? []).reduce((s, x) => s + (x.chapter_count ?? 0), 0);
    const trust = trustLevelForReaders(totalReaders);
    return monetizationEligibilityChecklist({
      trustLevel: trust,
      publishedChapterCount: publishedChapters,
      freeChapterCount: Math.min(publishedChapters, 3),
      qualityChecksPassed: publishedChapters > 0,
      hasReaderEngagement: totalReaders > 0,
      stabilityWindowMet: trust !== 'incubation',
    });
  }, [dash]);

  return (
    <div className="cms-page studio-page monetization-studio monetization-studio--premium">
      <StudioPageHeader
        eyebrow={t('monetization.eyebrow')}
        eyebrowIcon={IndianRupee}
        title={t('monetization.title')}
        subtitle={t('monetization.subtitle')}
      />

      <section className="cms-panel monetization-charter" aria-labelledby="brand-charter-title">
        <div className="monetization-charter__header">
          <Sparkles size={20} aria-hidden />
          <h2 id="brand-charter-title" className="dashboard-panel__title">{t('monetization.charter')}</h2>
        </div>
        <p className="monetization-charter__te" lang="te">కథ — గౌరవనీయ సాహిత్య సృష్టికర్తల యొక్క ఇల్లు</p>
        <ul className="monetization-charter__list">
          {charter.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <div className="monetization-hero-grid">
        <section className="cms-panel monetization-trust-panel" aria-labelledby="story-trust-title">
          <h2 id="story-trust-title" className="dashboard-panel__title">{t('monetization.trustLadder')}</h2>
          <p className="monetization-panel__lead">
            {t('monetization.trustLead')}
            Promotions require a {STABILITY_WINDOW_DAYS}-day stability window; demotions need sustained decline.
          </p>
          <StoryTrustLadder highlightMonetizationGate />
          <div
            className={`monetization-eligibility${eligibility.eligible ? ' monetization-eligibility--open' : ''}`}
            aria-labelledby="eligibility-title"
          >
            <h3 id="eligibility-title" className="monetization-eligibility__title">
              {eligibility.eligible ? t('monetization.eligible') : t('monetization.path')}
            </h3>
            <p className="monetization-panel__lead">
              {BRAND_COPY.monetizationGate} Base share {BASE_CREATOR_SHARE_PCT}% · up to 60% at Apex.
            </p>
            <ul className="monetization-eligibility__list">
              {eligibility.criteria.map((c) => (
                <li
                  key={c.id}
                  className={`monetization-eligibility__item${c.met ? ' monetization-eligibility__item--met' : ''}`}
                >
                  <span className="monetization-eligibility__mark" aria-hidden>
                    {c.met ? '✓' : '○'}
                  </span>
                  <span>{c.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="cms-panel monetization-spi-panel" aria-labelledby="spi-title">
          <h2 id="spi-title" className="dashboard-panel__title">{t('monetization.spi')}</h2>
          <p className="monetization-panel__lead">{t('monetization.spiLead')}</p>
          <ul className="monetization-spi-list">
            {SPI_WEIGHTS.map((w) => (
              <li key={w.id} className="monetization-spi-item">
                <span className="monetization-spi-item__label">{w.label}</span>
                <div className="monetization-spi-item__bar-wrap">
                  <div className="monetization-spi-item__bar" style={{ width: `${w.weightPct}%` }} />
                </div>
                <span className="monetization-spi-item__pct">{w.weightPct}%</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="cms-panel monetization-revenue-panel" aria-labelledby="revenue-model-title">
        <h2 id="revenue-model-title" className="dashboard-panel__title">{t('monetization.revenue')}</h2>
        <div className="monetization-revenue-flow">
          <span className="monetization-revenue-step">Quarterly Story Revenue</span>
          <span className="monetization-revenue-arrow" aria-hidden>→</span>
          <span className="monetization-revenue-step">Base Author Share ({BASE_CREATOR_SHARE_PCT}%)</span>
          <span className="monetization-revenue-arrow" aria-hidden>→</span>
          <span className="monetization-revenue-step">Story Trust Multiplier</span>
          <span className="monetization-revenue-arrow" aria-hidden>→</span>
          <span className="monetization-revenue-step monetization-revenue-step--final">Final Author Payout</span>
        </div>
        <div className="monetization-share-examples">
          <StoryTrustBadge level="performing" showShare />
          <StoryTrustBadge level="catalyst" showShare />
          <StoryTrustBadge level="anchor" showShare />
          <StoryTrustBadge level="apex" showShare />
        </div>
        <p className="monetization-panel__note">{BRAND_COPY.quarterlyPayoutNote}</p>
      </section>

      <div className="monetization-secondary-grid">
        <section className="cms-panel" aria-labelledby="patronage-title">
          <div className="dashboard-panel__head">
            <h2 id="patronage-title" className="dashboard-panel__title">
              <Crown size={18} aria-hidden /> {t('monetization.patronage')}
            </h2>
          </div>
          <p className="monetization-panel__lead">{BRAND_COPY.patronageSubtitle}</p>
          <ul className="monetization-patron-tiers">
            {PATRON_TIERS.map((tier) => (
              <li key={tier.id} className="monetization-patron-tier">{tier.label}</li>
            ))}
          </ul>
        </section>

        <section className="cms-panel" aria-labelledby="launch-flow-title">
          <div className="dashboard-panel__head">
            <h2 id="launch-flow-title" className="dashboard-panel__title">
              <BookOpen size={18} aria-hidden /> {t('monetization.launchFlow')}
            </h2>
          </div>
          <p className="monetization-panel__lead">No payouts simply for publishing.</p>
          <ol className="monetization-launch-flow">
            {FIRST_STORY_LAUNCH_FLOW.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="cms-panel" aria-labelledby="short-story-title">
          <div className="dashboard-panel__head">
            <h2 id="short-story-title" className="dashboard-panel__title">
              <Award size={18} aria-hidden /> {t('monetization.shortStory')}
            </h2>
          </div>
          <p className="monetization-panel__lead">Short stories monetize through curated collections — not standalone chapter unlocks.</p>
          <ul className="platform-monetization-list">
            {SHORT_STORY_ECONOMY.surfaces.map((s) => (
              <li key={s.id} className="platform-monetization-item">
                <span>{s.label}</span>
                <span className="platform-monetization-item__status">planned</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="cms-panel monetization-vocabulary" aria-labelledby="vocabulary-title">
        <div className="dashboard-panel__head">
          <h2 id="vocabulary-title" className="dashboard-panel__title">
            <Shield size={18} aria-hidden /> {t('monetization.vocabulary')}
          </h2>
        </div>
        <div className="monetization-vocab-grid">
          <div>
            <h3 className="monetization-vocab-heading">{t('monetization.avoid')}</h3>
            <ul className="monetization-vocab-list monetization-vocab-list--avoid">
              {BRAND_VOCABULARY.avoid.map((term) => <li key={term}>{term}</li>)}
            </ul>
          </div>
          <div>
            <h3 className="monetization-vocab-heading">{t('monetization.preferred')}</h3>
            <ul className="monetization-vocab-list monetization-vocab-list--preferred">
              {BRAND_VOCABULARY.preferred.map((term) => <li key={term}>{term}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="cms-panel" aria-labelledby="surfaces-title">
        <h2 id="surfaces-title" className="dashboard-panel__title">{t('monetization.surfaces')}</h2>
        <p className="monetization-panel__lead">
          Today: {BRAND.creatorSharePct}% base author share on subscriptions, scaled by Story Trust.
          {' '}{QUARTERLY_PAYOUTS.cadence} payouts with fraud detection, refund handling, and appeals.
        </p>
        <div className="platform-detail-grid">
          <MonetizationSection title="Readers" items={reader} />
          <MonetizationSection title="Authors" items={creator} />
          <MonetizationSection title="Platform" items={platform} />
        </div>
      </section>
    </div>
  );
}

function MonetizationSection({ title, items }: { title: string; items: MonetizationItem[] }) {
  return (
    <section className="cms-panel cms-panel--nested">
      <h3 className="dashboard-panel__title">{title}</h3>
      <ul className="platform-monetization-list">
        {items.map((item) => (
          <li key={item.id} className={`platform-monetization-item platform-monetization-item--${item.status}`}>
            <span>{item.label}</span>
            <span className="platform-monetization-item__status">{item.status}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}