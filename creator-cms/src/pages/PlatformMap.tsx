import { useEffect, useState } from 'react';
import { Map } from 'lucide-react';
import { platformApi } from '../lib/platformApi';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import {
  CONTEST_ROADMAP, READER_SYSTEMS, RECOMMENDATION_SIGNALS, PLATFORM_ROLES,
  AUTHOR_LEVELS, STORY_BADGES, REPORT_CATEGORIES, EVENT_TYPES,
} from '../lib/platformConstants';

export function PlatformMap() {
  const [stats, setStats] = useState({ contests: 0, eventTypes: 0, reviewerRoles: 0, reportCategories: 0 });

  useEffect(() => {
    platformApi.getPlatformCatalog().then(setStats);
  }, []);

  return (
    <div className="cms-page studio-page">
      <StudioPageHeader
        eyebrow="వ్యూహం · Platform map"
        eyebrowIcon={Map}
        title="Master PRD feature catalog"
        subtitle="Every capability from the Product Strategy, Master PRD v0.1, and Creator Events Platform — status at a glance."
      />

      <div className="platform-stats-strip">
        <span>{stats.eventTypes} event types</span>
        <span>{stats.contests} contest programs</span>
        <span>{stats.reviewerRoles} reviewer roles</span>
        <span>{stats.reportCategories} report categories</span>
      </div>

      <FeatureSection title="Content types & metadata" items={[
        'Novel', 'Serialized Story', 'Short Story', 'Short Story Collection', 'Flash Fiction', 'Kids Stories',
        'Primary + secondary genres (14)', 'Age rating', 'Language', 'Story status', 'Setting', 'Themes', 'Tags',
      ]} status="partial" link="/stories/new" />

      <FeatureSection title="Author journey" items={AUTHOR_LEVELS.map((l) => l.label)} status="partial" link="/profile" />
      <FeatureSection title="Story performance badges" items={STORY_BADGES.map((b) => b.label)} status="planned" />
      <FeatureSection title="Contest roadmap" items={CONTEST_ROADMAP.map((c) => `${c.label} (${c.status})`)} status="partial" link="/events" />
      <FeatureSection title="Event types (15)" items={EVENT_TYPES.map((e) => e.label)} status="partial" link="/events" />
      <FeatureSection title="Reader systems" items={READER_SYSTEMS.map((s) => `${s.label} — ${s.status}`)} status="partial" link="/community" />
      <FeatureSection title="Recommendation signals (rule-based, no AI)" items={RECOMMENDATION_SIGNALS.map((s) => `${s.id} (${s.status})`)} status="partial" />
      <FeatureSection title="Reviewer marketplace" items={['Anonymous 3-reviewer matching', 'Majority decision', '₹149–199 packages', 'Beta readers volunteer/paid', 'Reputation Bronze → Editorial Council']} status="partial" link="/reviewers" />
      <FeatureSection title="Community governance" items={[...REPORT_CATEGORIES.map((c) => c.label), 'Threshold triage', 'Appeals', 'Audit logs']} status="partial" link="/moderation" />
      <FeatureSection title="Monetization (full PRD)" items={['Subscriptions ✓', 'Premium chapters ✓', 'Tips', 'Magazines', 'IP licensing', 'Sponsored contests', 'Print-on-demand']} status="partial" link="/monetization" />
      <FeatureSection title="RBAC roles" items={[...PLATFORM_ROLES]} status="partial" />
      <FeatureSection title="Events platform modules" items={[
        'Event management', 'Registration', 'Wallet', 'Escrow', 'Payments', 'Leaderboards',
        'Certificates', 'Notifications', 'Reporting', 'Sponsor management', 'Organizer dashboards',
        'Participant dashboards', 'Anti-fraud', 'Appeals',
      ]} status="partial" link="/events/new" />
    </div>
  );
}

function FeatureSection({ title, items, status, link }: {
  title: string; items: string[]; status: string; link?: string;
}) {
  return (
    <section className="cms-panel platform-feature-section cms-mb-4">
      <div className="dashboard-panel__head">
        <h3 className="dashboard-panel__title">{title}</h3>
        <span className={`platform-status-pill platform-status-pill--${status}`}>{status}</span>
      </div>
      <ul className="platform-feature-list">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
      {link && <a href={link} className="panel-view-all">Open →</a>}
    </section>
  );
}