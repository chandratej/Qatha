import { useEffect, useState } from 'react';
import { Map } from 'lucide-react';
import { platformApi } from '../lib/platformApi';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import { StudioGlyph } from '../components/studio/StudioGlyph';
import { StudioIllustration } from '../components/studio/StudioIllustration';
import type { StudioGlyphId } from '../components/studio/StudioGlyph';
import { useLocale } from '../context/LocaleContext';
import type { StudioStringKey } from '../lib/studioLocale';
import {
  CONTEST_ROADMAP, READER_SYSTEMS, RECOMMENDATION_SIGNALS, PLATFORM_ROLES,
  AUTHOR_LEVELS, STORY_TRUST_LEVELS, SPI_WEIGHTS, PATRON_TIERS,
  REPORT_CATEGORIES, EVENT_TYPES,
} from '../lib/platformConstants';

type SectionStatus = 'partial' | 'planned';

interface FeatureSectionData {
  prdId?: string;
  title: string;
  items: string[];
  status: SectionStatus;
  link?: string;
}

interface PlatformCategory {
  id: string;
  glyph: StudioGlyphId;
  titleKey: StudioStringKey;
  sections: FeatureSectionData[];
}

const PLATFORM_CATEGORIES: PlatformCategory[] = [
  {
    id: 'content',
    glyph: 'book',
    titleKey: 'platformMap.catContent',
    sections: [{
      prdId: 'Vol_03-01',
      title: 'Content types & metadata',
      items: [
        'Novel', 'Serialized Story', 'Short Story', 'Short Story Collection', 'Flash Fiction', 'Kids Stories',
        'Primary + secondary genres (14)', 'Age rating', 'Language', 'Story status', 'Setting', 'Themes', 'Tags',
      ],
      status: 'partial',
      link: '/stories/new',
    }],
  },
  {
    id: 'journey',
    glyph: 'trending',
    titleKey: 'platformMap.catJourney',
    sections: [
      { prdId: 'Vol_01-03', title: 'Author progression', items: AUTHOR_LEVELS.map((l) => l.label), status: 'partial', link: '/profile' },
      { prdId: 'Vol_01-05', title: 'Story Trust levels', items: STORY_TRUST_LEVELS.map((lvl) => `${lvl.glyph} ${lvl.label}`), status: 'partial', link: '/monetization' },
      { prdId: 'Vol_06-06', title: 'Story Performance Index (SPI)', items: SPI_WEIGHTS.map((w) => `${w.label} (${w.weightPct}%)`), status: 'planned', link: '/monetization' },
      { prdId: 'Vol_06-05', title: 'Patron tiers', items: PATRON_TIERS.map((p) => p.label), status: 'planned', link: '/monetization' },
    ],
  },
  {
    id: 'events',
    glyph: 'trophy',
    titleKey: 'platformMap.catEvents',
    sections: [
      { prdId: 'Vol_07-07', title: 'Contest roadmap', items: CONTEST_ROADMAP.map((c) => `${c.label} (${c.status})`), status: 'partial', link: '/events' },
      { prdId: 'Vol_07-06', title: 'Event types (15)', items: EVENT_TYPES.map((e) => e.label), status: 'partial', link: '/events' },
      {
        prdId: 'Vol_07-06',
        title: 'Events platform modules',
        items: [
          'Event management', 'Registration', 'Wallet', 'Escrow', 'Payments', 'Leaderboards',
          'Certificates', 'Notifications', 'Reporting', 'Sponsor management', 'Organizer dashboards',
          'Participant dashboards', 'Anti-fraud', 'Appeals',
        ],
        status: 'partial',
        link: '/events/new',
      },
    ],
  },
  {
    id: 'community',
    glyph: 'users',
    titleKey: 'platformMap.catCommunity',
    sections: [
      { prdId: 'Vol_07-01', title: 'Reader systems', items: READER_SYSTEMS.map((s) => `${s.label} — ${s.status}`), status: 'partial', link: '/community' },
      { prdId: 'Vol_08_02', title: 'Recommendation signals (rule-based, no AI)', items: RECOMMENDATION_SIGNALS.map((s) => `${s.id} (${s.status})`), status: 'partial' },
      { prdId: 'Vol_05-Reviewer_Studio', title: 'Reviewer marketplace', items: ['Anonymous 3-reviewer matching', 'Majority decision', '₹149–199 packages', 'Beta readers volunteer/paid', 'Reputation Bronze → Editorial Council'], status: 'partial', link: '/reviewers' },
      { prdId: 'Vol_09-09', title: 'Community governance', items: [...REPORT_CATEGORIES.map((c) => c.label), 'Threshold triage', 'Appeals', 'Audit logs'], status: 'partial', link: '/moderation' },
    ],
  },
  {
    id: 'economy',
    glyph: 'award',
    titleKey: 'platformMap.catEconomy',
    sections: [
      { prdId: 'Vol_06-05', title: 'Creator economy & patronage', items: ['Subscriptions ✓', 'Premium chapters ✓', 'Literary Patronage', "Editor's Spotlight", 'Story Trust payouts', 'Short story collections', 'IP licensing', 'Print-on-demand'], status: 'partial', link: '/monetization' },
      { prdId: 'Vol_01-04', title: 'RBAC roles', items: [...PLATFORM_ROLES], status: 'partial' },
    ],
  },
];

export function PlatformMap() {
  const { t } = useLocale();
  const [stats, setStats] = useState({ contests: 0, eventTypes: 0, reviewerRoles: 0, reportCategories: 0 });

  useEffect(() => {
    platformApi.getPlatformCatalog().then(setStats);
  }, []);

  const statusLabel = (status: SectionStatus) => (
    status === 'planned' ? t('platformMap.statusPlanned') : t('platformMap.statusPartial')
  );

  return (
    <div className="cms-page studio-page platform-map-page--premium platform-map-page--v2 platform-map-page--wave20 platform-map-page--wave27 studio-page--calm26 wc-page-enter">
      <StudioIllustration id="open-book" tone="neutral" size={96} className="platform-map-page__illus" />
      <StudioPageHeader
        variant="hero"
        eyebrow={t('platformMap.eyebrow')}
        eyebrowIcon={Map}
        title={t('platformMap.title')}
        subtitle={t('platformMap.subtitle')}
      />

      <div className="platform-stats-strip platform-stats-strip--v2 wc-stagger-children">
        <div className="platform-stat-card">
          <StudioGlyph id="trophy" variant="tile" size={20} />
          <span className="platform-stat-card__value">{stats.eventTypes}</span>
          <span className="platform-stat-card__label">{t('platformMap.eventTypes')}</span>
        </div>
        <div className="platform-stat-card">
          <StudioGlyph id="award" variant="tile" size={20} />
          <span className="platform-stat-card__value">{stats.contests}</span>
          <span className="platform-stat-card__label">{t('platformMap.contestPrograms')}</span>
        </div>
        <div className="platform-stat-card">
          <StudioGlyph id="users" variant="tile" size={20} />
          <span className="platform-stat-card__value">{stats.reviewerRoles}</span>
          <span className="platform-stat-card__label">{t('platformMap.reviewerRoles')}</span>
        </div>
        <div className="platform-stat-card">
          <StudioGlyph id="shield" variant="tile" size={20} />
          <span className="platform-stat-card__value">{stats.reportCategories}</span>
          <span className="platform-stat-card__label">{t('platformMap.reportCategories')}</span>
        </div>
      </div>

      <div className="wc-stagger-children">
        {PLATFORM_CATEGORIES.map((category) => (
          <section key={category.id} className="platform-map-category" aria-labelledby={`platform-cat-${category.id}`}>
            <div className="platform-map-category__head">
              <StudioGlyph id={category.glyph} variant="soft" size={20} />
              <h2 id={`platform-cat-${category.id}`} className="platform-map-category__title">
                {t(category.titleKey)}
              </h2>
            </div>
            <div className="platform-map-bento">
              {category.sections.map((section) => (
                <FeatureSection
                  key={`${category.id}-${section.prdId ?? section.title}`}
                  prdId={section.prdId}
                  title={section.title}
                  items={section.items}
                  status={section.status}
                  statusLabel={statusLabel(section.status)}
                  link={section.link}
                  openLabel={t('platformMap.openLink')}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function FeatureSection({
  prdId,
  title,
  items,
  status,
  statusLabel,
  link,
  openLabel,
}: {
  prdId?: string;
  title: string;
  items: string[];
  status: SectionStatus;
  statusLabel: string;
  link?: string;
  openLabel?: string;
}) {
  return (
    <section className="cms-panel platform-feature-section platform-feature-section--v2" data-prd-id={prdId}>
      <div className="dashboard-panel__head">
        <h3 className="dashboard-panel__title">
          {title}
          {prdId && <span className="platform-prd-id">{prdId}</span>}
        </h3>
        <span className={`platform-status-pill platform-status-pill--${status}`}>{statusLabel}</span>
      </div>
      <div className="platform-feature-chips" role="list">
        {items.map((item) => (
          <span key={item} className="platform-feature-chip" role="listitem">{item}</span>
        ))}
      </div>
      {link && <a href={link} className="panel-view-all">{openLabel ?? 'Open →'}</a>}
    </section>
  );
}