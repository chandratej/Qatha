import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  IndianRupee,
  Calendar,
  Wallet,
  PenLine,
  FileText,
  Megaphone,
  Lightbulb,
  ChevronRight,
  CalendarDays,
  UserPlus,
  Award,
  Heart,
  CheckCircle2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import type { CreatorMilestone } from '../lib/api';
import type { DashboardData } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { BRAND } from '../lib/constants';
import { trackCreatorEvent } from '../lib/analyticsEvents';
import { isSessionError } from '../lib/errors';

function formatInr(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function formatPayoutDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatChartMonth(month: string) {
  const [y, m] = month.split('-');
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${names[Number(m) - 1]} '${y.slice(2)}`;
}

function dateRangeLabel() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 30);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

const COVER_GRADIENTS = [
  'linear-gradient(145deg, #5B4A8A 0%, #8B6BB5 50%, #C4A8E8 100%)',
  'linear-gradient(145deg, #8B3A3A 0%, #C45C3A 50%, #E8A85C 100%)',
  'linear-gradient(145deg, #2D4A3E 0%, #4A7C6F 50%, #7CB89A 100%)',
  'linear-gradient(145deg, #3A4A6B 0%, #5A7A9B 50%, #8BAED4 100%)',
];

function storyCoverStyle(index: number, coverUrl?: string | null) {
  if (coverUrl) return { backgroundImage: `url(${coverUrl})`, backgroundSize: 'cover' as const };
  return { background: COVER_GRADIENTS[index % COVER_GRADIENTS.length] };
}

interface ActivityItem {
  id: string;
  icon: 'green' | 'gold' | 'purple' | 'pink';
  Icon: typeof UserPlus;
  title: string;
  description: string;
  time: string;
}

function buildActivityFeed(d: DashboardData, milestones: CreatorMilestone[]): ActivityItem[] {
  const items: ActivityItem[] = [];

  if (d.total_subscribers > 0) {
    items.push({
      id: 'sub',
      icon: 'green',
      Icon: UserPlus,
      title: 'New subscriber',
      description: 'Someone just subscribed to your story',
      time: '2h ago',
    });
  }

  items.push({
    id: 'payout',
    icon: 'gold',
    Icon: Wallet,
    title: 'Payout initiated',
    description: `Payout for this month will be sent on ${formatPayoutDate(d.expected_payout_date)}`,
    time: '1d ago',
  });

  const topStory = d.stories.reduce(
    (best, s) => (s.total_readers > (best?.total_readers ?? 0) ? s : best),
    d.stories[0],
  );
  if (topStory && topStory.total_readers >= 500) {
    items.push({
      id: 'milestone',
      icon: 'purple',
      Icon: Award,
      title: 'New milestone',
      description: `"${topStory.title}" crossed ${topStory.total_readers >= 2000 ? '2K' : '500'} readers!`,
      time: '2d ago',
    });
  }

  for (const m of milestones.slice(0, 1)) {
    items.push({
      id: m.id,
      icon: 'purple',
      Icon: CheckCircle2,
      title: m.milestone_type === 'FIRST_READER' ? 'First reader!' : 'Milestone unlocked',
      description: 'A big moment in your creator journey',
      time: '3d ago',
    });
  }

  if (d.stories.some((s) => s.views_this_week > 0)) {
    items.push({
      id: 'engagement',
      icon: 'pink',
      Icon: Heart,
      title: 'Story engagement',
      description: 'Your stories gained new readers this week',
      time: '3d ago',
    });
  }

  return items.slice(0, 4);
}

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: d, loading, error, mutate } = useApi(() => api.getDashboard());
  const { data: milestonesData, mutate: mutateMilestones } = useApi(() =>
    api.getMilestones().catch(() => ({ milestones: [] as CreatorMilestone[] })),
  );
  const [activeMilestone, setActiveMilestone] = useState<CreatorMilestone | null>(null);
  const [chartRange, setChartRange] = useState<'3m' | '6m' | 'all'>('3m');

  useEffect(() => { trackCreatorEvent('creator_dashboard_view'); }, []);

  useEffect(() => {
    if (milestonesData?.milestones?.length && !activeMilestone) {
      setActiveMilestone(milestonesData.milestones[0]);
    }
  }, [milestonesData, activeMilestone]);

  const chartData = useMemo(() => {
    if (!d?.subscriber_history) return [];
    const sorted = [...d.subscriber_history].sort((a, b) => a.month.localeCompare(b.month));
    const slice = chartRange === '3m' ? 4 : chartRange === '6m' ? 6 : sorted.length;
    return sorted.slice(-slice).map((row) => ({
      ...row,
      label: formatChartMonth(row.month),
    }));
  }, [d, chartRange]);

  const activityFeed = useMemo(
    () => (d ? buildActivityFeed(d, milestonesData?.milestones ?? []) : []),
    [d, milestonesData],
  );

  const handleAcknowledge = async () => {
    if (!activeMilestone) return;
    await api.acknowledgeMilestone(activeMilestone.id);
    setActiveMilestone(null);
    mutateMilestones();
  };

  const displayName = user?.display_name || 'Creator';
  const growth = d?.week_over_week_growth_pct;

  if (loading) {
    return (
      <div className="cms-page dashboard-page">
        <div className="dashboard-skeleton" style={{ height: 80, marginBottom: 36 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="dashboard-skeleton" style={{ height: 140 }} />
          ))}
        </div>
        <div className="dashboard-skeleton" style={{ height: 72, marginBottom: 32 }} />
        <div className="dashboard-skeleton" style={{ height: 280 }} />
      </div>
    );
  }

  if (error || !d) {
    const sessionExpired = isSessionError(error);
    return (
      <div className="cms-page dashboard-page">
        <div className="cms-panel cms-panel--flat" style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--ink-muted)', marginBottom: 20 }}>
            {error || 'We could not load your dashboard right now.'}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {sessionExpired ? (
              <button
                type="button"
                className="dashboard-cta"
                style={{ border: 'none' }}
                onClick={() => navigate('/login')}
              >
                Sign in again
              </button>
            ) : (
              <button
                type="button"
                className="dashboard-cta"
                style={{ border: 'none' }}
                onClick={() => mutate()}
              >
                Try again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const sharePct = d.revenue_share_pct ?? BRAND.creatorSharePct;
  const platformPct = d.platform_share_pct ?? BRAND.platformSharePct;
  const topStories = [...(d.earnings_by_story || [])]
    .sort((a, b) => b.earnings_this_month - a.earnings_this_month)
    .slice(0, 3);

  return (
    <div className="cms-page dashboard-page">
      {activeMilestone && (
        <div className="milestone-modal-backdrop">
          <div className="milestone-modal">
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎉</div>
            <h2 style={{ marginBottom: 12 }}>
              {activeMilestone.milestone_type === 'FIRST_READER' ? 'Your first reader is here!' : 'Milestone Unlocked!'}
            </h2>
            <p style={{ color: 'var(--ink-muted)', marginBottom: 24, lineHeight: 1.5 }}>
              {activeMilestone.milestone_type === 'FIRST_READER'
                ? "Someone just read your story. You're no longer writing into the void. Keep the momentum going!"
                : "You've hit a major milestone in your creator journey."}
            </p>
            <button type="button" className="dashboard-cta" style={{ width: '100%', justifyContent: 'center' }} onClick={handleAcknowledge}>
              Awesome, let&apos;s keep going
            </button>
          </div>
        </div>
      )}

      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-header__title">Welcome back, {displayName} 👋</h1>
          <p className="dashboard-header__subtitle">
            Here&apos;s how your stories and community are growing.
          </p>
        </div>
        <div className="dashboard-header__actions">
          <div className="dashboard-date-picker" aria-label="Date range">
            <CalendarDays size={16} />
            {dateRangeLabel()}
          </div>
          <Link to="/stories/new" className="dashboard-cta">
            <PenLine size={18} />
            Create New Story
          </Link>
        </div>
      </header>

      <div className="dashboard-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card__glow kpi-card__glow--gold" />
          <div className="kpi-card__icon kpi-card__icon--gold">
            <IndianRupee size={20} />
          </div>
          <div className="kpi-card__value">{formatInr(d.earnings_this_month)}</div>
          <div className="kpi-card__label">Total Earnings</div>
          {growth != null && growth > 0 && (
            <div className="kpi-card__trend">
              <TrendingUp size={14} />
              +{growth}% vs last week
            </div>
          )}
        </div>

        <div className="kpi-card">
          <div className="kpi-card__glow kpi-card__glow--purple" />
          <div className="kpi-card__icon kpi-card__icon--purple">
            <Users size={20} />
          </div>
          <div className="kpi-card__value">{d.total_subscribers}</div>
          <div className="kpi-card__label">Active Subscribers</div>
          {growth != null && growth > 0 && (
            <div className="kpi-card__trend">
              <TrendingUp size={14} />
              +{Math.min(growth, 12)}% vs last week
            </div>
          )}
        </div>

        <div className="kpi-card">
          <div className="kpi-card__glow kpi-card__glow--gold" />
          <div className="kpi-card__icon kpi-card__icon--gold">
            <Calendar size={20} />
          </div>
          <div className="kpi-card__value" style={{ fontSize: '1.35rem' }}>
            {formatPayoutDate(d.expected_payout_date)}
          </div>
          <div className="kpi-card__label">Next Payout</div>
          <div className="kpi-card__sub">Est. payout: {formatInr(d.expected_payout_amount)}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__glow kpi-card__glow--green" />
          <div className="kpi-card__icon kpi-card__icon--green">
            <TrendingUp size={20} />
          </div>
          <div className="kpi-card__value">{sharePct}%</div>
          <div className="kpi-card__label">Your Revenue Share</div>
          <div className="kpi-card__sub" title={`You keep ${sharePct}% of each ₹${BRAND.priceMonthly} subscription. Platform retains ${platformPct}%.`}>
            {sharePct}/{platformPct} creator/platform · ₹{BRAND.priceMonthly}/sub
          </div>
        </div>
      </div>

      <div className="earnings-strip">
        <div className="earnings-strip__icon">
          <Wallet size={22} />
        </div>
        <div className="earnings-strip__body">
          <div className="earnings-strip__title">
            Total earnings (all time): {formatInr(d.total_earnings)}
          </div>
          <div
            className="earnings-strip__meta"
            title={`Expected payout of ${formatInr(d.expected_payout_amount)} on ${formatPayoutDate(d.expected_payout_date)}. Schedule: ${d.payout_schedule}.`}
          >
            {formatInr(d.creator_earnings_per_subscription_inr)} per subscriber/month
            {' · '}
            Paid on {d.payout_schedule}
            {growth != null && growth > 0 && (
              <span className="growth"> · +{growth}% vs last week</span>
            )}
          </div>
        </div>
        <Link to="/stories" className="earnings-strip__link">
          View earnings <ChevronRight size={16} />
        </Link>
      </div>

      <div className="dashboard-mid-grid">
        <div className="dashboard-panel">
          <div className="dashboard-panel__head">
            <h3 className="dashboard-panel__title">Subscribers over time</h3>
            <select
              className="dashboard-panel__select"
              value={chartRange}
              onChange={(e) => setChartRange(e.target.value as '3m' | '6m' | 'all')}
              aria-label="Chart time range"
            >
              <option value="3m">Last 3 months</option>
              <option value="6m">Last 6 months</option>
              <option value="all">All time</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="goldArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C79A4B" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#C79A4B" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--dash-border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: 'var(--ink-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'var(--ink-muted)' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--dash-surface)',
                  border: '1px solid var(--dash-border)',
                  borderRadius: 12,
                  boxShadow: 'var(--dash-shadow)',
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#C79A4B"
                strokeWidth={2.5}
                fill="url(#goldArea)"
                dot={{ fill: '#C79A4B', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#C79A4B' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="dashboard-panel">
          <h3 className="dashboard-panel__title" style={{ marginBottom: 16 }}>Quick actions</h3>
          <div className="quick-actions">
            <Link to="/stories/new" className="quick-action-btn quick-action-btn--primary">
              <PenLine size={18} />
              Create New Story
            </Link>
            <Link to="/onboarding" className="quick-action-btn">
              <FileText size={18} />
              View onboarding guide
            </Link>
            <Link to="/stories/new" className="quick-action-btn">
              <Megaphone size={18} />
              Promote your stories
            </Link>
          </div>
          <div className="tip-card">
            <Lightbulb size={18} color="var(--dash-gold)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p className="tip-card__text">
              Stories with regular updates get 3× more readers. Keep writing!
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-bottom-grid">
        <div className="dashboard-panel">
          <div className="dashboard-panel__head">
            <h3 className="dashboard-panel__title">Top earning stories</h3>
            <Link to="/stories" className="panel-view-all">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          {topStories.length === 0 ? (
            <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>No earnings yet — publish your first chapter!</p>
          ) : (
            topStories.map((row, i) => {
              const storyMeta = d.stories.find((s) => s.id === row.story_id);
              return (
                <div key={row.story_id} className="story-earning-row">
                  <div
                    className="story-cover story-cover--placeholder"
                    style={storyCoverStyle(i, storyMeta && 'cover_url' in storyMeta ? (storyMeta as { cover_url?: string }).cover_url : undefined)}
                    aria-hidden
                  />
                  <div className="story-earning-row__info">
                    <div className="story-earning-row__title">{row.title}</div>
                    <div className="story-earning-row__meta">
                      {storyMeta?.chapter_count ?? '—'} chapters
                    </div>
                  </div>
                  <div className="story-earning-row__stats">
                    <span>{row.total_readers.toLocaleString('en-IN')} readers</span>
                    <span>{row.subscribers} subs</span>
                  </div>
                  <div className="story-earning-row__earnings">
                    {formatInr(row.earnings_this_month)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="dashboard-panel">
          <div className="dashboard-panel__head">
            <h3 className="dashboard-panel__title">Recent activity</h3>
            <Link to="/stories" className="panel-view-all">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          {activityFeed.map((item) => (
            <div key={item.id} className="activity-item">
              <div className={`activity-item__icon activity-item__icon--${item.icon}`}>
                <item.Icon size={18} />
              </div>
              <div>
                <div className="activity-item__title">{item.title}</div>
                <div className="activity-item__desc">{item.description}</div>
                <div className="activity-item__time">{item.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}