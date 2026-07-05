import { Link } from 'react-router-dom';
import { TrendingUp, Users, IndianRupee, Calendar, ArrowRight, Wallet } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { CreatorMilestone } from '../lib/api';
import { useApi } from '../hooks/useApi';

async function trackEvent(event: string) {
  try {
    const base = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
    await fetch(`${base}/api/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, properties: { source: 'creator_cms' } }),
    });
  } catch (_) {}
}

function formatInr(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function Dashboard() {
  const { data: d, loading, error } = useApi(() => api.getDashboard());
  const { data: milestonesData, mutate: mutateMilestones } = useApi(() => api.getMilestones());
  
  const [activeMilestone, setActiveMilestone] = useState<CreatorMilestone | null>(null);

  useEffect(() => { trackEvent('creator_dashboard_view'); }, []);

  useEffect(() => {
    if (milestonesData?.milestones?.length && !activeMilestone) {
      setActiveMilestone(milestonesData.milestones[0]);
    }
  }, [milestonesData, activeMilestone]);

  const handleAcknowledge = async () => {
    if (!activeMilestone) return;
    await api.acknowledgeMilestone(activeMilestone.id);
    setActiveMilestone(null);
    mutateMilestones();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
        <div style={{ height: 100, borderRadius: 12, background: 'var(--paper-warm)', animation: 'shimmer 2s infinite linear', backgroundImage: 'linear-gradient(90deg, var(--paper-warm) 0%, var(--border) 50%, var(--paper-warm) 100%)', backgroundSize: '200% 100%' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          <div style={{ height: 140, borderRadius: 12, background: 'var(--paper-warm)', animation: 'shimmer 2s infinite linear', backgroundImage: 'linear-gradient(90deg, var(--paper-warm) 0%, var(--border) 50%, var(--paper-warm) 100%)', backgroundSize: '200% 100%' }} />
          <div style={{ height: 140, borderRadius: 12, background: 'var(--paper-warm)', animation: 'shimmer 2s infinite linear', backgroundImage: 'linear-gradient(90deg, var(--paper-warm) 0%, var(--border) 50%, var(--paper-warm) 100%)', backgroundSize: '200% 100%' }} />
          <div style={{ height: 140, borderRadius: 12, background: 'var(--paper-warm)', animation: 'shimmer 2s infinite linear', backgroundImage: 'linear-gradient(90deg, var(--paper-warm) 0%, var(--border) 50%, var(--paper-warm) 100%)', backgroundSize: '200% 100%' }} />
          <div style={{ height: 140, borderRadius: 12, background: 'var(--paper-warm)', animation: 'shimmer 2s infinite linear', backgroundImage: 'linear-gradient(90deg, var(--paper-warm) 0%, var(--border) 50%, var(--paper-warm) 100%)', backgroundSize: '200% 100%' }} />
        </div>
      </div>
    );
  }

  if (error || !d) {
    return (
      <div className="card" style={{ padding: 32, textAlign: 'center' }}>
        <p style={{ color: 'var(--ink-muted)', marginBottom: 16 }}>{error || 'Unable to load dashboard'}</p>
        <p style={{ fontSize: '0.875rem' }}>Start the backend: <code>cd backend && npm run dev</code></p>
      </div>
    );
  }

  const sharePct = d.revenue_share_pct ?? 60;

  return (
    <div>
      <header className="page-header">
        <div>
          <h2>Creator Dashboard</h2>
          <p>
            Your earnings, readers, and growth — transparent from day one.
            {' '}You keep <strong>{sharePct}%</strong> of every ₹99 subscription.
          </p>
        </div>
      </header>

      {/* Hooked Model: Milestone Modal (e.g., First Reader) */}
      {activeMilestone && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', zIndex: 999
        }}>
          <div className="card" style={{ padding: 40, maxWidth: 400, textAlign: 'center', animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎉</div>
            <h2 style={{ marginBottom: 12 }}>
              {activeMilestone.milestone_type === 'FIRST_READER' ? 'Your first reader is here!' : 'Milestone Unlocked!'}
            </h2>
            <p style={{ color: 'var(--ink-muted)', marginBottom: 24, lineHeight: 1.5 }}>
              {activeMilestone.milestone_type === 'FIRST_READER' 
                ? "Someone just read your story. You're no longer writing into the void. Keep the momentum going by publishing your next chapter!"
                : "You've hit a major milestone in your creator journey."}
            </p>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleAcknowledge}>
              Awesome, let's keep going
            </button>
          </div>
        </div>
      )}

      <div className="grid-stats">
        <div className="card stat-card">
          <IndianRupee size={20} color="var(--gold)" style={{ marginBottom: 12 }} />
          <div className="stat-value">{formatInr(d.earnings_this_month)}</div>
          <div className="stat-label">Earnings this month</div>
        </div>
        <div className="card stat-card">
          <Users size={20} color="var(--ember)" style={{ marginBottom: 12 }} />
          <div className="stat-value">{d.total_subscribers}</div>
          <div className="stat-label">Active subscribers</div>
        </div>
        <div className="card stat-card">
          <Calendar size={20} color="var(--gold-dark)" style={{ marginBottom: 12 }} />
          <div className="stat-value" style={{ fontSize: '1.25rem' }}>{d.expected_payout_date}</div>
          <div className="stat-label">Next payout · {formatInr(d.expected_payout_amount)}</div>
        </div>
        <div className="card stat-card">
          <TrendingUp size={20} color="#228B57" style={{ marginBottom: 12 }} />
          <div className="stat-value">{sharePct}%</div>
          <div className="stat-label">Your revenue share</div>
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <Wallet size={22} color="var(--gold)" />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 600 }}>Total earnings (all time): {formatInr(d.total_earnings)}</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginTop: 4 }}>
            {formatInr(d.creator_earnings_per_subscription_inr)} per subscriber/month · Payout on {d.payout_schedule}
            {d.week_over_week_growth_pct != null && d.week_over_week_growth_pct > 0 && (
              <span style={{ color: '#228B57', marginLeft: 8 }}>+{d.week_over_week_growth_pct}% vs last week</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 32 }}>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 20, fontSize: '1.125rem' }}>Subscribers over time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={d.subscriber_history}>
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--ink-muted)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--ink-muted)' }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Line type="monotone" dataKey="count" stroke="var(--gold)" strokeWidth={2} dot={{ fill: 'var(--gold)', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16, fontSize: '1.125rem' }}>Quick actions</h3>
          <Link to="/stories/new" className="btn btn-primary" style={{ width: '100%', marginBottom: 12, display: 'flex' }}>
            Start a new story
          </Link>
          <Link to="/onboarding" className="btn btn-secondary" style={{ width: '100%', display: 'flex' }}>
            View onboarding guide
          </Link>
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ marginBottom: 20, fontSize: '1.125rem' }}>Earnings by story</h3>
        {d.earnings_by_story.map((row) => (
          <div key={row.story_id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
            <div style={{ fontWeight: 500 }}>{row.title}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>{row.total_readers} readers</div>
            <div style={{ fontSize: '0.875rem' }}>{row.subscribers} subs</div>
            <div style={{ fontWeight: 600, textAlign: 'right', color: row.earnings_this_month > 0 ? 'var(--gold-dark)' : 'var(--ink-muted)' }}>
              {formatInr(row.earnings_this_month)}
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: '1.125rem' }}>Stories breakdown</h3>
          <Link to="/stories" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.875rem' }}>
            View all <ArrowRight size={16} />
          </Link>
        </div>
        {d.stories.map((story) => (
          <div key={story.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontWeight: 500 }}>{story.title}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>{story.chapter_count} chapters</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600 }}>{story.total_readers} readers</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                {story.views_this_week} this week
                {story.earnings_this_month != null && story.earnings_this_month > 0 && (
                  <span> · {formatInr(story.earnings_this_month)} earned</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}