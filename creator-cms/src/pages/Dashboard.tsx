import { useNavigate } from 'react-router-dom';
import { BookOpen, IndianRupee, TrendingUp, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';
import type { CreatorMilestone } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { BRAND } from '../lib/constants';
import { effectiveCreatorSharePct, trustLevelForReaders } from '../lib/platformConstants';
import { trackCreatorEvent } from '../lib/analyticsEvents';
import { isSessionError } from '../lib/errors';
import { buildActivityFeed } from '../lib/buildActivityFeed';
import { formatCompact, formatInr } from '../lib/dashboardFormat';
import { ensureDemoStreak, getProductivitySnapshot, getWritingStreak } from '../lib/writingStreak';
import { buildDashboardTasks } from '../lib/dashboardTasks';

import { StoriesWidget } from '../components/dashboard/StoriesWidget';
import { QuickActionsPanel } from '../components/dashboard/QuickActionsPanel';
import { EventsSpotlight } from '../components/dashboard/EventsSpotlight';
import { ActivityFeedPanel } from '../components/dashboard/ActivityFeedPanel';
import { TopPerformingStories } from '../components/dashboard/TopPerformingStories';
import { CreatorBadgeBar } from '../components/dashboard/CreatorBadgeBar';
import { StudioHero } from '../components/studio/StudioHero';
import { BrandMark } from '../components/studio/BrandMark';
import { ReviewerPersonaDashboard } from '../components/dashboard/ReviewerPersonaDashboard';
import { DashboardNotificationsWidget } from '../components/dashboard/DashboardNotificationsWidget';
import { ReviewerPoolSummaryWidget } from '../components/dashboard/ReviewerPoolSummaryWidget';
import { ScheduleCalendarWidget } from '../components/dashboard/ScheduleCalendarWidget';
import { TasksPanel } from '../components/dashboard/TasksPanel';
import { useCreatorPersona } from '../hooks/useCreatorPersona';

export function Dashboard() {
  const { user, isMockMode } = useAuth();
  const { persona, lifecycleStage, loading: personaLoading } = useCreatorPersona();
  const navigate = useNavigate();
  const { data: d, loading, error, mutate } = useApi(() => api.getDashboard());
  const { data: storiesData } = useApi(() => api.getCreatorStories().catch(() => ({ stories: [] })));
  const { data: milestonesData, mutate: mutateMilestones } = useApi(() =>
    api.getMilestones().catch(() => ({ milestones: [] as CreatorMilestone[] })),
  );
  const [activeMilestone, setActiveMilestone] = useState<CreatorMilestone | null>(null);

  useEffect(() => { trackCreatorEvent('creator_dashboard_view'); }, []);
  useEffect(() => {
    if (milestonesData?.milestones?.length && !activeMilestone) {
      setActiveMilestone(milestonesData.milestones[0]);
    }
  }, [milestonesData, activeMilestone]);

  const displayName = user?.display_name || 'Creator';
  const totalReads = useMemo(() => (d?.stories ?? []).reduce((s, x) => s + x.total_readers, 0), [d]);
  const streak = useMemo(() => {
    if (!d) return getWritingStreak();
    if (isMockMode) return ensureDemoStreak(totalReads);
    return getWritingStreak();
  }, [d, totalReads, isMockMode]);
  const productivity = useMemo(() => getProductivitySnapshot(), [streak]);

  const earningsMap = useMemo(() => {
    const map = new Map<string, { earnings: number; readers: number }>();
    for (const row of d?.earnings_by_story ?? []) map.set(row.story_id, { earnings: row.earnings_this_month, readers: row.total_readers });
    return map;
  }, [d]);

  const isDemoMetrics = isMockMode || Boolean(d?.mock);
  const growth = d?.week_over_week_growth_pct;
  const showGrowthTrend = growth != null && (isDemoMetrics || growth !== 0);
  const activity = useMemo(() => (d ? buildActivityFeed(d, milestonesData?.milestones ?? []) : []), [d, milestonesData]);
  const topStories = useMemo(() => [...(d?.earnings_by_story ?? [])].sort((a, b) => b.total_readers - a.total_readers).slice(0, 4), [d]);
  const analyticsHref = d?.stories[0]?.id ? `/analytics/${d.stories[0].id}` : undefined;
  const publishedCount = storiesData?.stories?.filter((s) => s.moderation_status === 'published').length ?? 0;
  const storyTrust = trustLevelForReaders(totalReads);
  const effectiveSharePct = effectiveCreatorSharePct(storyTrust) || BRAND.creatorSharePct;

  const dashboardTasks = useMemo(
    () => buildDashboardTasks(storiesData?.stories ?? [], lifecycleStage),
    [storiesData, lifecycleStage],
  );

  const continueStory = useMemo(() => {
    const stories = storiesData?.stories ?? [];
    if (!stories.length) return null;
    return [...stories].sort((a, b) => b.chapter_count - a.chapter_count)[0];
  }, [storiesData]);

  const milestoneBtnRef = useRef<HTMLButtonElement>(null);

  const handleAcknowledge = useCallback(async () => {
    if (!activeMilestone) return;
    await api.acknowledgeMilestone(activeMilestone.id);
    setActiveMilestone(null);
    mutateMilestones();
  }, [activeMilestone, mutateMilestones]);

  useEffect(() => {
    if (!activeMilestone) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => milestoneBtnRef.current?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleAcknowledge();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [activeMilestone, handleAcknowledge]);

  if (loading || personaLoading) {
    return (
      <div className="cms-page dashboard-page studio-page">
        <div className="dashboard-skeleton studio-skeleton-hero" aria-hidden />
        <div className="studio-metrics" aria-busy="true" aria-label="Loading studio metrics">
          {[1, 2, 3, 4].map((i) => <div key={i} className="dashboard-skeleton studio-skeleton-metric" />)}
        </div>
        <p className="cms-loading cms-loading--inline">Lighting your studio…</p>
      </div>
    );
  }

  if (error || !d) {
    return (
      <div className="cms-page dashboard-page studio-page">
        <div className="studio-empty">
          <div className="studio-empty__glyph" aria-hidden>
            <BrandMark size="md" />
          </div>
          <h2 className="studio-empty__title">Studio paused</h2>
          <p className="studio-empty__text">{error || 'We could not load your studio.'}</p>
          <button type="button" className="katha-cta katha-cta--soft" onClick={() => (isSessionError(error) ? navigate('/login') : mutate())}>
            {isSessionError(error) ? 'Sign in again' : 'Try again'}
          </button>
        </div>
      </div>
    );
  }

  if (persona === 'reviewer') {
    return (
      <div className="cms-page dashboard-page studio-page">
        <ReviewerPersonaDashboard displayName={displayName} />
      </div>
    );
  }

  return (
    <div className="cms-page dashboard-page studio-page">
      {activeMilestone && (
        <div className="milestone-modal-backdrop" role="presentation">
          <div className="milestone-modal" role="dialog" aria-labelledby="milestone-title" aria-modal="true">
            <div className="studio-empty__glyph" aria-hidden><TrendingUp size={32} /></div>
            <h2 id="milestone-title" className="studio-empty__title">Milestone unlocked</h2>
            <p className="milestone-modal__te" lang="te">మీ ప్రయాణంలో మరో మైలురాయి</p>
            <p className="studio-empty__text">Keep the lamp lit — your craft is building something readers will remember.</p>
            <button ref={milestoneBtnRef} type="button" className="dashboard-cta cms-auth-cta" onClick={handleAcknowledge}>
              Continue with pride
            </button>
          </div>
        </div>
      )}

      {isDemoMetrics && (
        <p className="dashboard-demo-banner" role="status">
          Demo studio metrics — live reads, earnings, and subscribers appear when your stories publish on Supabase.
        </p>
      )}

      <StudioHero
        displayName={displayName}
        productivity={productivity}
        streak={streak}
        continueStoryHref={continueStory ? `/stories/${continueStory.id}` : undefined}
        continueStoryTitle={continueStory?.title}
        continueStoryCover={continueStory?.cover_url}
      />

      <CreatorBadgeBar totalReads={totalReads} publishedStories={publishedCount} />

      <div className="studio-metrics" role="list" aria-label="Studio metrics">
        <button type="button" className="studio-metric" role="listitem" onClick={() => navigate('/stories')}>
          <span className="studio-metric__icon"><BookOpen size={18} aria-hidden /></span>
          <span>
            <span className="studio-metric__value">{formatCompact(totalReads)}</span>
            <span className="studio-metric__label">Total reads</span>
            {showGrowthTrend && (
              <span className="studio-metric__trend">{growth! >= 0 ? '+' : ''}{growth}% this week</span>
            )}
          </span>
        </button>
        <div className="studio-metric" role="listitem">
          <span className="studio-metric__icon"><Users size={18} aria-hidden /></span>
          <span>
            <span className="studio-metric__value">{d.total_subscribers.toLocaleString('en-IN')}</span>
            <span className="studio-metric__label">Active subscribers</span>
          </span>
        </div>
        <div className="studio-metric studio-metric--earnings" role="listitem">
          <span className="studio-metric__icon"><IndianRupee size={18} aria-hidden /></span>
          <span>
            <span className="studio-metric__value">{formatInr(d.earnings_this_month)}</span>
            <span className="studio-metric__label">Earnings this month</span>
          </span>
        </div>
        <button type="button" className="studio-metric" role="listitem" onClick={() => navigate('/monetization')}>
          <span className="studio-metric__icon"><TrendingUp size={18} aria-hidden /></span>
          <span>
            <span className="studio-metric__value">{effectiveSharePct}%+</span>
            <span className="studio-metric__label">Story Trust share</span>
            <span className="studio-metric__trend">Up to 60% at Apex</span>
          </span>
        </button>
      </div>

      <div className="studio-workspace">
        <StoriesWidget stories={storiesData?.stories ?? []} earningsMap={earningsMap} />
        <div className="studio-workspace__aside">
          <DashboardNotificationsWidget />
          <ReviewerPoolSummaryWidget />
          <EventsSpotlight />
          <QuickActionsPanel />
        </div>
      </div>

      <div className="dashboard-bottom-grid">
        <TasksPanel tasks={dashboardTasks} />
        <ScheduleCalendarWidget />
        <ActivityFeedPanel items={activity} />
        <TopPerformingStories stories={topStories} analyticsHref={analyticsHref} />
      </div>
    </div>
  );
}