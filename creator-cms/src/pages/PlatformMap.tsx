import { useEffect, useState } from 'react';
import { Map } from 'lucide-react';
import { platformApi } from '../lib/platformApi';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import { useLocale } from '../context/LocaleContext';
import {
  CONTEST_ROADMAP, READER_SYSTEMS, RECOMMENDATION_SIGNALS, PLATFORM_ROLES,
  AUTHOR_LEVELS, STORY_TRUST_LEVELS, SPI_WEIGHTS, PATRON_TIERS,
  REPORT_CATEGORIES, EVENT_TYPES,
} from '../lib/platformConstants';

export function PlatformMap() {
  const { t } = useLocale();
  const [stats, setStats] = useState({ contests: 0, eventTypes: 0, reviewerRoles: 0, reportCategories: 0 });

  useEffect(() => {
    platformApi.getPlatformCatalog().then(setStats);
  }, []);

  return (
    <div className="cms-page studio-page platform-map-page--premium wc-page-enter">
      <StudioPageHeader
        variant="hero"
        eyebrow={t('platformMap.eyebrow')}
        eyebrowIcon={Map}
        title={t('platformMap.title')}
        subtitle={t('platformMap.subtitle')}
      />

      <div className="platform-stats-strip">
        <span>{stats.eventTypes} {t('platformMap.eventTypes')}</span>
        <span>{stats.contests} {t('platformMap.contestPrograms')}</span>
        <span>{stats.reviewerRoles} {t('platformMap.reviewerRoles')}</span>
        <span>{stats.reportCategories} {t('platformMap.reportCategories')}</span>
      </div>

      <div className="wc-stagger-children">
        <FeatureSection prdId="Vol_03-01" title="Content types & metadata" items={[
          'Novel', 'Serialized Story', 'Short Story', 'Short Story Collection', 'Flash Fiction', 'Kids Stories',
          'Primary + secondary genres (14)', 'Age rating', 'Language', 'Story status', 'Setting', 'Themes', 'Tags',
        ]} status="partial" link="/stories/new" openLabel={t('platformMap.openLink')} />

        <FeatureSection prdId="Vol_01-03" title="Author progression" items={AUTHOR_LEVELS.map((l) => l.label)} status="partial" link="/profile" openLabel={t('platformMap.openLink')} />
        <FeatureSection prdId="Vol_01-05" title="Story Trust levels" items={STORY_TRUST_LEVELS.map((lvl) => `${lvl.glyph} ${lvl.label}`)} status="partial" link="/monetization" openLabel={t('platformMap.openLink')} />
        <FeatureSection prdId="Vol_06-06" title="Story Performance Index (SPI)" items={SPI_WEIGHTS.map((w) => `${w.label} (${w.weightPct}%)`)} status="planned" link="/monetization" openLabel={t('platformMap.openLink')} />
        <FeatureSection prdId="Vol_06-05" title="Patron tiers" items={PATRON_TIERS.map((p) => p.label)} status="planned" link="/monetization" openLabel={t('platformMap.openLink')} />
        <FeatureSection prdId="Vol_07-07" title="Contest roadmap" items={CONTEST_ROADMAP.map((c) => `${c.label} (${c.status})`)} status="partial" link="/events" openLabel={t('platformMap.openLink')} />
        <FeatureSection prdId="Vol_07-06" title="Event types (15)" items={EVENT_TYPES.map((e) => e.label)} status="partial" link="/events" openLabel={t('platformMap.openLink')} />
        <FeatureSection prdId="Vol_07-01" title="Reader systems" items={READER_SYSTEMS.map((s) => `${s.label} — ${s.status}`)} status="partial" link="/community" openLabel={t('platformMap.openLink')} />
        <FeatureSection prdId="Vol_08_02" title="Recommendation signals (rule-based, no AI)" items={RECOMMENDATION_SIGNALS.map((s) => `${s.id} (${s.status})`)} status="partial" />
        <FeatureSection prdId="Vol_05-Reviewer_Studio" title="Reviewer marketplace" items={['Anonymous 3-reviewer matching', 'Majority decision', '₹149–199 packages', 'Beta readers volunteer/paid', 'Reputation Bronze → Editorial Council']} status="partial" link="/reviewers" openLabel={t('platformMap.openLink')} />
        <FeatureSection prdId="Vol_09-09" title="Community governance" items={[...REPORT_CATEGORIES.map((c) => c.label), 'Threshold triage', 'Appeals', 'Audit logs']} status="partial" link="/moderation" openLabel={t('platformMap.openLink')} />
        <FeatureSection prdId="Vol_06-05" title="Creator economy & patronage" items={['Subscriptions ✓', 'Premium chapters ✓', 'Literary Patronage', "Editor's Spotlight", 'Story Trust payouts', 'Short story collections', 'IP licensing', 'Print-on-demand']} status="partial" link="/monetization" openLabel={t('platformMap.openLink')} />
        <FeatureSection prdId="Vol_01-04" title="RBAC roles" items={[...PLATFORM_ROLES]} status="partial" />
        <FeatureSection prdId="Vol_07-06" title="Events platform modules" items={[
          'Event management', 'Registration', 'Wallet', 'Escrow', 'Payments', 'Leaderboards',
          'Certificates', 'Notifications', 'Reporting', 'Sponsor management', 'Organizer dashboards',
          'Participant dashboards', 'Anti-fraud', 'Appeals',
        ]} status="partial" link="/events/new" openLabel={t('platformMap.openLink')} />
      </div>
    </div>
  );
}

function FeatureSection({ prdId, title, items, status, link, openLabel }: {
  prdId?: string; title: string; items: string[]; status: string; link?: string; openLabel?: string;
}) {
  return (
    <section className="cms-panel platform-feature-section cms-mb-4" data-prd-id={prdId}>
      <div className="dashboard-panel__head">
        <h3 className="dashboard-panel__title">
          {title}
          {prdId && <span className="platform-prd-id">{prdId}</span>}
        </h3>
        <span className={`platform-status-pill platform-status-pill--${status}`}>{status}</span>
      </div>
      <ul className="platform-feature-list">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
      {link && <a href={link} className="panel-view-all">{openLabel ?? 'Open →'}</a>}
    </section>
  );
}