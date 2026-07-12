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
import { PendingInvitesWidget } from '../components/dashboard/PendingInvitesWidget';
import { PendingReaderFeedbackWidget } from '../components/dashboard/PendingReaderFeedbackWidget';
import { ReviewerPoolSummaryWidget } from '../components/dashboard/ReviewerPoolSummaryWidget';
import { ScheduleCalendarWidget } from '../components/dashboard/ScheduleCalendarWidget';
import { TasksPanel } from '../components/dashboard/TasksPanel';
import { useCreatorPersona } from '../hooks/useCreatorPersona';
import { DebutSeasonDashboardCard } from '../components/dashboard/DebutSeasonDashboardCard';
import { DebutGraduationModal } from '../components/dashboard/DebutGraduationModal';
import { useLocale } from '../context/LocaleContext';

export function Dashboard() {
  const { t } = useLocale();
  const { user, isMockMode } = useAuth();
  const { persona, lifecycleStage, loading: personaLoading } = useCreatorPersona();
  const navigate = useNavigate();
  const { data: d, loading, error, mutate } = useApi(() => api.getDashboard());
  const { data: storiesData } = useApi(() => api.getCreatorStories().catch(() => ({ stories: [] })));
  const { data: milestonesData, mutate: mutateMilestones } = useApi(() =>
    api.getMilestones().catch(() => ({ milestones: [] as CreatorMilestone[] })),
  );
  const { data: debutData, mutate: mutateDebut } = useApi(() =>
    api.getDebutSeasonProgress().catch(() => ({
      progress: {
        enrolled: false,
        story_id: null,
        story_title: null,
        story_status: null,
        chapter_count: 0,
        chapter_target: 50,
        progress_pct: 0,
        eligibility_status: null,
        graduated: false,
        graduation_date: null,
        award_level: null,
        total_score: null,
      },
    })),
  );
  const [activeMilestone, setActiveMilestone] = useState<CreatorMilestone | null>(null);
  const [showDebutGraduation, setShowDebutGraduation] = useState(false);
  const [debutAwardLevel, setDebutAwardLevel] = useState<string | null>(null);

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

  const debutStory = useMemo(() => {
    const stories = storiesData?.stories ?? [];
    if (!stories.length) return null;
    const published = stories.filter((s) => s.moderation_status === 'published');
    if (published.length === 0) return stories[0];
    return [...published].sort((a, b) => b.chapter_count - a.chapter_count)[0];
  }, [storiesData]);

  const debutProgress = debutData?.progress;
  const debutChapterCount = debutProgress?.enrolled
    ? debutProgress.chapter_count
    : (debutStory?.chapter_count ?? 0);
  const debutDisplayTitle = debutProgress?.story_title ?? debutStory?.title;
  const debutEnrolled = debutProgress?.enrolled ?? publishedCount > 0;

  const milestoneBtnRef = useRef<HTMLButtonElement>(null);
  const graduationAttemptedRef = useRef(false);

  useEffect(() => {
    const progress = debutData?.progress;
    if (!progress?.enrolled) return;

    const seenKey = progress.graduation_date
      ? `debut-graduation-seen-${progress.graduation_date}`
      : progress.story_id
        ? `debut-graduation-seen-${progress.story_id}`
        : null;

    if (progress.graduated) {
      if (seenKey && sessionStorage.getItem(seenKey)) return;
      setDebutAwardLevel(progress.award_level);
      setShowDebutGraduation(true);
      return;
    }

    if (
      progress.progress_pct >= 100
      && progress.story_status === 'completed'
      && !graduationAttemptedRef.current
    ) {
      graduationAttemptedRef.current = true;
      void api.graduateDebutSeason(progress.story_id ? { story_id: progress.story_id } : undefined)
        .then((res) => {
          if (res.graduation.graduated) {
            const award = res.graduation.award_level
              ?? res.graduation.entry?.award_level
              ?? null;
            setDebutAwardLevel(award);
            setShowDebutGraduation(true);
            mutateDebut();
          }
        })
        .catch(() => {
          graduationAttemptedRef.current = false;
        });
    }
  }, [debutData, mutateDebut]);

  const handleCloseDebutGraduation = useCallback(() => {
    const progress = debutData?.progress;
    const seenKey = progress?.graduation_date
      ? `debut-graduation-seen-${progress.graduation_date}`
      : progress?.story_id
        ? `debut-graduation-seen-${progress.story_id}`
        : null;
    if (seenKey) sessionStorage.setItem(seenKey, '1');
    setShowDebutGraduation(false);
  }, [debutData]);

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
      <div className="cms-page dashboard-page dashboard-page--premium studio-page">
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
      <div className="cms-page dashboard-page dashboard-page--premium studio-page">
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
      <div className="cms-page dashboard-page dashboard-page--premium studio-page">
        <ReviewerPersonaDashboard displayName={displayName} />
      </div>
    );
  }

  return (
    <div className="cms-page dashboard-page dashboard-page--premium studio-page studio-page--elevated wc-page-enter">
      {showDebutGraduation && (
        <DebutGraduationModal
          storyTitle={debutDisplayTitle}
          awardLevel={debutAwardLevel ?? debutProgress?.award_level}
          onClose={handleCloseDebutGraduation}
        />
      )}

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
        <p className="dashboard-demo-banner dashboard-demo-banner--quiet" role="status">
          {t('dashboard.demoBanner')}
        </p>
      )}

      <div className="dashboard-bento wc-stagger-children">
        <div className="dashboard-bento__main">
          <StudioHero
            displayName={displayName}
            productivity={productivity}
            streak={streak}
            continueStoryHref={continueStory ? `/stories/${continueStory.id}` : undefined}
            continueStoryTitle={continueStory?.title}
            continueStoryCover={continueStory?.cover_url}
          />
          <DebutSeasonDashboardCard
            publishedChapters={debutChapterCount}
            storyTitle={debutDisplayTitle}
            enrolled={debutEnrolled}
          />
        </div>
        <div className="dashboard-bento__rail">
          <CreatorBadgeBar totalReads={totalReads} publishedStories={publishedCount} />
          <DashboardNotificationsWidget />
          <EventsSpotlight />
        </div>
      </div>

      <div className="studio-metrics" role="list" aria-label="Studio metrics">
        <button type="button" className="studio-metric" role="listitem" onClick={() => navigate('/stories')}>
          <span className="studio-metric__icon"><BookOpen size={18} aria-hidden /></span>
          <span>
            <span className="studio-metric__value">{formatCompact(totalReads)}</span>
            <span className="studio-metric__label">{t('dashboard.metricsReads')}</span>
            {showGrowthTrend && (
              <span className="studio-metric__trend">{growth! >= 0 ? '+' : ''}{growth}% this week</span>
            )}
          </span>
        </button>
        <div className="studio-metric" role="listitem">
          <span className="studio-metric__icon"><Users size={18} aria-hidden /></span>
          <span>
            <span className="studio-metric__value">{d.total_subscribers.toLocaleString('en-IN')}</span>
            <span className="studio-metric__label">{t('dashboard.metricsSubs')}</span>
          </span>
        </div>
        <div className="studio-metric studio-metric--earnings" role="listitem">
          <span className="studio-metric__icon"><IndianRupee size={18} aria-hidden /></span>
          <span>
            <span className="studio-metric__value">{formatInr(d.earnings_this_month)}</span>
            <span className="studio-metric__label">{t('dashboard.metricsEarnings')}</span>
          </span>
        </div>
        <button type="button" className="studio-metric" role="listitem" onClick={() => navigate('/monetization')}>
          <span className="studio-metric__icon"><TrendingUp size={18} aria-hidden /></span>
          <span>
            <span className="studio-metric__value">{effectiveSharePct}%+</span>
            <span className="studio-metric__label">{t('dashboard.metricsTrust')}</span>
            <span className="studio-metric__trend">Up to 60% at Apex</span>
          </span>
        </button>
      </div>

      <div className="studio-workspace">
        <StoriesWidget stories={storiesData?.stories ?? []} earningsMap={earningsMap} />
        <div className="studio-workspace__aside">
          <PendingInvitesWidget />
          <PendingReaderFeedbackWidget />
          <ReviewerPoolSummaryWidget />
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