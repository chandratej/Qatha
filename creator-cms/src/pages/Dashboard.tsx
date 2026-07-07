import { useNavigate } from 'react-router-dom';
import { BookOpen, IndianRupee, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import type { CreatorMilestone } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { BRAND } from '../lib/constants';
import { trackCreatorEvent } from '../lib/analyticsEvents';
import { isSessionError } from '../lib/errors';
import { buildActivityFeed } from '../lib/buildActivityFeed';
import { formatCompact, formatInr } from '../lib/dashboardFormat';
import { getTimeGreeting } from '../lib/dashboardGreeting';
import { ensureDemoStreak, getProductivitySnapshot, getWritingStreak } from '../lib/writingStreak';
import { DateRangePicker, defaultDateRange, type DateRange } from '../components/DateRangePicker';
import { KpiCard } from '../components/dashboard/KpiCard';
import { StoriesWidget } from '../components/dashboard/StoriesWidget';
import { QuickActionsPanel } from '../components/dashboard/QuickActionsPanel';
import { ActivityFeedPanel } from '../components/dashboard/ActivityFeedPanel';
import { TopPerformingStories } from '../components/dashboard/TopPerformingStories';
import { CompactStreakStrip } from '../components/dashboard/CompactStreakStrip';
import { CreatorBadgeBar } from '../components/dashboard/CreatorBadgeBar';


export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: d, loading, error, mutate } = useApi(() => api.getDashboard());
  const { data: storiesData } = useApi(() => api.getCreatorStories().catch(() => ({ stories: [] })));
  const { data: milestonesData, mutate: mutateMilestones } = useApi(() =>
    api.getMilestones().catch(() => ({ milestones: [] as CreatorMilestone[] })),
  );
  const [activeMilestone, setActiveMilestone] = useState<CreatorMilestone | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange);
  useEffect(() => { trackCreatorEvent('creator_dashboard_view'); }, []);
  useEffect(() => {
    if (milestonesData?.milestones?.length && !activeMilestone) {
      setActiveMilestone(milestonesData.milestones[0]);
    }
  }, [milestonesData, activeMilestone]);

  const displayName = user?.display_name || 'Creator';
  const totalReads = useMemo(() => (d?.stories ?? []).reduce((s, x) => s + x.total_readers, 0), [d]);
  const streak = useMemo(() => (d ? ensureDemoStreak(totalReads) : getWritingStreak()), [d, totalReads]);
  const productivity = useMemo(() => getProductivitySnapshot(), [streak]);

  const earningsMap = useMemo(() => {
    const map = new Map<string, { earnings: number; readers: number }>();
    for (const row of d?.earnings_by_story ?? []) map.set(row.story_id, { earnings: row.earnings_this_month, readers: row.total_readers });
    return map;
  }, [d]);

  const spark = useMemo(() => (d?.subscriber_history ?? []).map((r) => r.count), [d]);
  const growth = d?.week_over_week_growth_pct;
  const activity = useMemo(() => (d ? buildActivityFeed(d, milestonesData?.milestones ?? []) : []), [d, milestonesData]);
  const topStories = useMemo(() => [...(d?.earnings_by_story ?? [])].sort((a, b) => b.total_readers - a.total_readers).slice(0, 4), [d]);
  const wordGoalPct = Math.min(100, Math.round((productivity.wordsToday / productivity.dailyGoal) * 100));
  const analyticsHref = d?.stories[0]?.id ? `/analytics/${d.stories[0].id}` : undefined;
  const sharePct = d?.revenue_share_pct ?? BRAND.creatorSharePct;

  const handleAcknowledge = async () => {
    if (!activeMilestone) return;
    await api.acknowledgeMilestone(activeMilestone.id);
    setActiveMilestone(null);
    mutateMilestones();
  };

  if (loading) {
    return (
      <div className="cms-page dashboard-page">
        <div className="dashboard-skeleton" style={{ height: 80, marginBottom: 36 }} />
        <div className="dashboard-kpi-grid">{[1, 2, 3, 4].map((i) => <div key={i} className="dashboard-skeleton" style={{ height: 140 }} />)}</div>
      </div>
    );
  }

  if (error || !d) {
    return (
      <div className="cms-page dashboard-page">
        <div className="cms-panel cms-panel--flat" style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--ink-muted)', marginBottom: 20 }}>{error || 'We could not load your dashboard.'}</p>
          <button type="button" className="dashboard-cta" style={{ border: 'none' }} onClick={() => (isSessionError(error) ? navigate('/login') : mutate())}>
            {isSessionError(error) ? 'Sign in again' : 'Try again'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cms-page dashboard-page">
      {activeMilestone && (
        <div className="milestone-modal-backdrop" role="presentation">
          <div className="milestone-modal" role="dialog">
            <div style={{ fontSize: '4rem', marginBottom: 16 }} aria-hidden>🎉</div>
            <h2>Milestone unlocked!</h2>
            <p style={{ color: 'var(--ink-muted)', marginBottom: 24 }}>Keep the momentum going on your creator journey.</p>
            <button type="button" className="dashboard-cta" style={{ width: '100%', justifyContent: 'center' }} onClick={handleAcknowledge}>Awesome!</button>
          </div>
        </div>
      )}

      <div className="dashboard-page__anchor">
        <header className="dashboard-header">
          <div className="dashboard-header__main">
            <h1 className="dashboard-header__title">{getTimeGreeting()}, {displayName}!</h1>
            <p className="dashboard-header__subtitle">Here&apos;s how your stories and community are growing.</p>
            <div className="dashboard-header__meta">
              <span className="dashboard-header__chip dashboard-header__chip--goal">
                <span className="dashboard-header__chip-label">Today</span>
                <span className="dashboard-header__chip-value">{productivity.wordsToday.toLocaleString('en-IN')} / {productivity.dailyGoal}</span>
                <span className="dashboard-header__chip-bar" role="progressbar" aria-valuenow={wordGoalPct} aria-valuemin={0} aria-valuemax={100}>
                  <span className="dashboard-header__chip-fill" style={{ width: `${wordGoalPct}%` }} />
                </span>
              </span>
              <CompactStreakStrip currentStreak={streak.currentStreak} longestStreak={streak.longestStreak} />
            </div>
          </div>
          <div className="dashboard-header__actions">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </div>
        </header>

        <CreatorBadgeBar totalReads={totalReads} revenueSharePct={sharePct} />

        <div className="dashboard-kpi-grid">
          <KpiCard icon={BookOpen} value={formatCompact(totalReads)} label="Total Reads" trend={growth} sparkline={spark} tooltip="Combined reads across all stories" onClick={() => navigate('/stories')} />
          <KpiCard icon={Users} value={d.total_subscribers.toLocaleString('en-IN')} label="Active Subscribers" trend={growth} tone="purple" sparkline={spark} />
          <KpiCard icon={IndianRupee} value={formatInr(d.earnings_this_month)} label="Earnings (This Month)" trend={growth} tooltip={`Est. payout ${formatInr(d.expected_payout_amount)}`} />
          <KpiCard icon={BookOpen} value={`${sharePct}%`} label="Revenue Share" sub={`₹${BRAND.priceMonthly}/subscription`} tone="green" />
        </div>

        <QuickActionsPanel layout="bar" />
      </div>

      <div className="dashboard-page__body">
        <StoriesWidget stories={storiesData?.stories ?? []} earningsMap={earningsMap} />

        <div className="dashboard-bottom-grid">
          <ActivityFeedPanel items={activity} />
          <TopPerformingStories stories={topStories} analyticsHref={analyticsHref} />
        </div>
      </div>
    </div>
  );
}