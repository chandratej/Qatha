import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, BarChart3, Download, IndianRupee, Lightbulb, TrendingUp, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Area, Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { api } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { trackCreatorEvent } from '../lib/analyticsEvents';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import { StoryTrustBadge } from '../components/studio/StoryTrustBadge';
import { StoryTrustLadder } from '../components/studio/StoryTrustLadder';
import { formatCompact } from '../lib/dashboardFormat';
import {
  SPI_WEIGHTS,
  trustLevelForReaders,
  effectiveCreatorSharePct,
  type StoryTrustLevelId,
} from '../lib/platformConstants';

type DateRange = '7d' | '30d' | 'all';

export function Analytics() {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, mutate } = useApi(() => api.getAnalytics(storyId!), [storyId]);
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [recomputing, setRecomputing] = useState(false);

  useEffect(() => {
    if (storyId) trackCreatorEvent('creator_analytics_view', { story_id: storyId });
  }, [storyId]);

  const handleRecomputeTrust = async () => {
    if (!storyId) return;
    setRecomputing(true);
    try {
      await api.recomputeStoryTrust(storyId);
      trackCreatorEvent('story_trust_recompute', { story_id: storyId });
      await mutate();
    } finally {
      setRecomputing(false);
    }
  };

  const filteredChapters = useMemo(() => {
    if (!data?.chapters) return [];
    if (dateRange === 'all') return data.chapters;
    const limit = dateRange === '7d' ? 7 : 30;
    return data.chapters.slice(-limit);
  }, [data, dateRange]);

  const chartData = useMemo(() => filteredChapters.map((ch) => ({
    name: `Ch ${ch.chapter_number}`,
    reads: ch.total_views,
    retention: ch.completion_rate,
    revenue: Math.round(ch.total_views * 0.08),
  })), [filteredChapters]);

  const demographics = data?.demographics ?? [
    { label: '18–24', pct: 34 },
    { label: '25–34', pct: 41 },
    { label: '35–44', pct: 18 },
    { label: '45+', pct: 7 },
  ];

  const popularChapters = useMemo(() =>
    [...filteredChapters].sort((a, b) => b.total_views - a.total_views).slice(0, 5),
  [filteredChapters]);

  const exportCsv = () => {
    const rows = [['Chapter', 'Views', 'Completion %', 'Avg Scroll %'], ...filteredChapters.map((c) => [c.chapter_number, c.total_views, c.completion_rate, c.avg_scroll_pct])];
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${storyId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="cms-page studio-page analytics-studio">
        <div className="dashboard-skeleton" style={{ height: 72, marginBottom: 32 }} />
        <div className="studio-metrics">
          {[1, 2, 3, 4].map((i) => <div key={i} className="dashboard-skeleton" style={{ height: 72 }} />)}
        </div>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="cms-page studio-page analytics-studio">
        <div className="studio-empty">
          <div className="studio-empty__glyph" aria-hidden><BarChart3 size={32} /></div>
          <h2 className="studio-empty__title">Analytics unavailable</h2>
          <p className="studio-empty__text">{error || 'We could not load analytics for this story.'}</p>
          <div className="studio-empty__actions">
            <button type="button" className="katha-cta katha-cta--soft" onClick={() => mutate()}>Try again</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/stories')}>Back to library</button>
          </div>
        </div>
      </div>
    );
  }

  const totalReads = filteredChapters.reduce((s, c) => s + c.total_views, 0);
  // Prefer live Story Trust from API (SPI); fall back to reader heuristic
  const liveTrust = (data.story_trust?.trust_level
    || data.story?.trust_level
    || trustLevelForReaders(totalReads)) as StoryTrustLevelId;
  const spiScore = data.story_trust?.spi_score ?? data.story?.spi_score ?? null;
  const spiComponents = data.story_trust?.spi_components ?? data.story?.spi_components ?? null;
  const authorShare = effectiveCreatorSharePct(liveTrust);
  const avgCompletion = filteredChapters.length
    ? Math.round(filteredChapters.reduce((s, c) => s + c.completion_rate, 0) / filteredChapters.length)
    : 0;
  const estRevenue = chartData.reduce((s, r) => s + r.revenue, 0);

  const insights = data.drop_off_insights ?? [];

  return (
    <div className="cms-page studio-page analytics-studio">
      <StudioPageHeader
        eyebrow="Reader insights"
        eyebrowIcon={BarChart3}
        title={data.story?.title || 'Story Analytics'}
        subtitle="Story Trust signals — retention, completion, and reader growth drive your literary earnings."
        backTo={`/stories/${storyId}`}
        backLabel="Back to chapters"
        actions={(
          <>
            <select className="cms-select" value={dateRange} onChange={(e) => setDateRange(e.target.value as DateRange)} aria-label="Chapter range">
              <option value="7d">Last 7 chapters</option>
              <option value="30d">Last 30 chapters</option>
              <option value="all">All chapters</option>
            </select>
            <button type="button" className="btn btn-secondary" onClick={exportCsv}>
              <Download size={16} aria-hidden /> Export CSV
            </button>
          </>
        )}
      />

      <div className="studio-metrics" role="list" aria-label="Analytics metrics">
        <div className="studio-metric studio-metric--reads" role="listitem">
          <span className="studio-metric__icon"><TrendingUp size={18} aria-hidden /></span>
          <span>
            <span className="studio-metric__value">{totalReads.toLocaleString('en-IN')}</span>
            <span className="studio-metric__label">Total reads</span>
          </span>
        </div>
        <div className="studio-metric studio-metric--retention" role="listitem">
          <span className="studio-metric__icon"><BarChart3 size={18} aria-hidden /></span>
          <span>
            <span className="studio-metric__value">{avgCompletion}%</span>
            <span className="studio-metric__label">Avg retention</span>
          </span>
        </div>
        <div className="studio-metric studio-metric--subscribers" role="listitem">
          <span className="studio-metric__icon"><Users size={18} aria-hidden /></span>
          <span>
            <span className="studio-metric__value">{data.subscribers_gained}</span>
            <span className="studio-metric__label">Subscribers gained</span>
          </span>
        </div>
        <div className="studio-metric studio-metric--revenue studio-metric--earnings" role="listitem">
          <span className="studio-metric__icon"><IndianRupee size={18} aria-hidden /></span>
          <span>
            <span className="studio-metric__value">{formatCompact(estRevenue)}</span>
            <span className="studio-metric__label">Est. revenue (₹)</span>
          </span>
        </div>
      </div>

      <section className="cms-panel analytics-trust-panel" aria-labelledby="analytics-trust-title">
        <div className="analytics-trust-panel__head">
          <h2 id="analytics-trust-title" className="dashboard-panel__title">
            Story Trust & SPI
            {spiScore != null && (
              <span className="analytics-spi-score" title="Story Performance Index">
                {' '}· SPI {Number(spiScore).toFixed(1)}
              </span>
            )}
          </h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <StoryTrustBadge level={liveTrust} showShare />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { void handleRecomputeTrust(); }}
              disabled={recomputing}
            >
              {recomputing ? 'Refreshing…' : 'Refresh SPI'}
            </button>
          </div>
        </div>
        <p className="monetization-panel__lead">
          {authorShare > 0
            ? `Live trust: ${liveTrust}. This story earns a ${authorShare}% author share on quarterly revenue (40% base × Story Trust multiplier, up to 60% at Apex).`
            : 'Build reader value to reach Performing trust — the monetization gate. 40% base · up to 60% at Apex.'}
        </p>
        <div className="analytics-spi-grid">
          <ul className="monetization-spi-list monetization-spi-list--compact">
            {SPI_WEIGHTS.map((w) => {
              const live = spiComponents?.[w.id];
              return (
                <li key={w.id} className="monetization-spi-item">
                  <span className="monetization-spi-item__label">{w.label}</span>
                  <div className="monetization-spi-item__bar-wrap">
                    <div
                      className="monetization-spi-item__bar"
                      style={{ width: `${live != null ? Math.min(100, Number(live)) : w.weightPct}%` }}
                    />
                  </div>
                  <span className="monetization-spi-item__pct">
                    {live != null ? `${Math.round(Number(live))}` : `${w.weightPct}% wt`}
                  </span>
                </li>
              );
            })}
          </ul>
          <StoryTrustLadder activeLevel={liveTrust} />
        </div>
      </section>

      <div className="analytics-charts-grid">
        <div className="cms-panel">
          <h3 className="cms-panel__title"><BarChart3 size={18} aria-hidden /> Multi-metric overview</h3>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--dash-border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--ink-muted)' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: 'var(--ink-muted)' }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--ink-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--dash-surface)', border: '1px solid var(--dash-border)', borderRadius: 12 }} />
              <Legend />
              <Bar yAxisId="left" dataKey="reads" name="Reads" fill="var(--dash-gold-soft)" stroke="var(--dash-gold)" />
              <Line yAxisId="right" type="monotone" dataKey="retention" name="Retention %" stroke="var(--accent-sage)" strokeWidth={2} />
              <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue ₹" fill="var(--accent-wine-soft)" stroke="var(--accent-wine)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="cms-panel">
          <h3 className="cms-panel__title"><Users size={18} aria-hidden /> Reader demographics</h3>
          <ul className="demographics-list">
            {demographics.map((d) => (
              <li key={d.label} className="demographics-row">
                <span>{d.label}</span>
                <div className="demographics-row__bar" role="progressbar" aria-valuenow={d.pct} aria-valuemin={0} aria-valuemax={100}>
                  <div style={{ width: `${d.pct}%` }} />
                </div>
                <span>{d.pct}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="analytics-bottom-grid">
        <div className="cms-panel">
          <h3 className="cms-panel__title">Popular chapters</h3>
          <ol className="top-stories__list">
            {popularChapters.map((ch, i) => (
              <li key={ch.chapter_number} className="top-stories__item">
                <span className="top-stories__rank">{i + 1}</span>
                <span>Chapter {ch.chapter_number}</span>
                <span className="top-stories__reads">{ch.total_views.toLocaleString('en-IN')} reads · {ch.completion_rate}% retention</span>
              </li>
            ))}
          </ol>
        </div>

        {insights.length > 0 && (
          <div className="cms-callout">
            <div className="cms-callout__head"><Lightbulb size={20} color="var(--dash-gold)" /><h3 className="cms-callout__title">Drop-off insights</h3></div>
            {insights.map((insight) => (
              <div key={insight.chapter_number} className="cms-insight-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <AlertTriangle size={16} color="var(--katha-turmeric)" aria-hidden />
                  <strong>Chapter {insight.chapter_number}</strong>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>−{insight.view_drop_pct}% readers</span>
                </div>
                <p className="cms-callout__body">{insight.suggestion}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}