import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, BarChart3, Download, Lightbulb, Users } from 'lucide-react';
import {
  Area, Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { api } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { trackCreatorEvent } from '../lib/analyticsEvents';
import { BackLink } from '../components/BackLink';
import { formatCompact } from '../lib/dashboardFormat';

type DateRange = '7d' | '30d' | 'all';

export function Analytics() {
  const { storyId } = useParams();
  const { data, loading, error } = useApi(() => api.getAnalytics(storyId!), [storyId]);
  const [dateRange, setDateRange] = useState<DateRange>('all');

  useEffect(() => {
    if (storyId) trackCreatorEvent('creator_analytics_view', { story_id: storyId });
  }, [storyId]);

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
    return <div className="cms-page"><div className="dashboard-skeleton" style={{ height: 72, marginBottom: 32 }} /></div>;
  }
  if (error || !data) {
    return <div className="cms-page"><div className="cms-panel cms-error-text">{error || 'Analytics unavailable'}</div></div>;
  }

  const totalReads = filteredChapters.reduce((s, c) => s + c.total_views, 0);
  const avgCompletion = filteredChapters.length
    ? Math.round(filteredChapters.reduce((s, c) => s + c.completion_rate, 0) / filteredChapters.length)
    : 0;

  const insights = data.drop_off_insights ?? [];

  return (
    <div className="cms-page">
      <header className="cms-page-header">
        <div className="cms-page-header__with-back">
          <BackLink to={`/stories/${storyId}`} label="Back to chapters" />
          <div>
            <h1 className="cms-page-header__title">{data.story?.title || 'Story Analytics'}</h1>
            <p className="cms-page-header__subtitle">Reads, retention, revenue, and reader insights.</p>
          </div>
        </div>
        <div className="cms-page-header__actions">
          <select className="cms-select" value={dateRange} onChange={(e) => setDateRange(e.target.value as DateRange)} aria-label="Chapter range">
            <option value="7d">Last 7 chapters</option>
            <option value="30d">Last 30 chapters</option>
            <option value="all">All chapters</option>
          </select>
          <button type="button" className="btn btn-secondary" onClick={exportCsv}><Download size={16} aria-hidden /> Export CSV</button>
        </div>
      </header>

      <div className="cms-kpi-grid">
        <div className="cms-kpi-card" title="Total chapter views"><div className="cms-kpi-card__value">{totalReads.toLocaleString('en-IN')}</div><div className="cms-kpi-card__label">Total reads</div></div>
        <div className="cms-kpi-card" title="Average completion"><div className="cms-kpi-card__value">{avgCompletion}%</div><div className="cms-kpi-card__label">Avg retention</div></div>
        <div className="cms-kpi-card" title="Subscribers from this story"><div className="cms-kpi-card__value">{data.subscribers_gained}</div><div className="cms-kpi-card__label">Subscribers gained</div></div>
        <div className="cms-kpi-card" title="Estimated revenue"><div className="cms-kpi-card__value">{formatCompact(chartData.reduce((s, r) => s + r.revenue, 0))}</div><div className="cms-kpi-card__label">Est. revenue (₹)</div></div>
      </div>

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
                  <AlertTriangle size={16} color="#C47832" aria-hidden />
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