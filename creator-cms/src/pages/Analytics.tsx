import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AlertTriangle, Lightbulb, BarChart3 } from 'lucide-react';
import { api } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { trackCreatorEvent } from '../lib/analyticsEvents';

type DropOffInsight = {
  chapter_number: number;
  view_drop_pct: number;
  completion_drop_pct: number;
  avg_scroll_pct: number;
  suggestion: string;
};

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

  if (loading) {
    return (
      <div className="cms-page">
        <div className="dashboard-skeleton" style={{ height: 72, marginBottom: 32 }} />
        <div className="cms-kpi-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="dashboard-skeleton" style={{ height: 120 }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="cms-page">
        <div className="cms-panel cms-error-text">{error || 'Analytics unavailable'}</div>
      </div>
    );
  }

  const totalReads = filteredChapters.reduce((s, c) => s + c.total_views, 0);
  const avgCompletion = filteredChapters.length
    ? Math.round(filteredChapters.reduce((s, c) => s + c.completion_rate, 0) / filteredChapters.length)
    : 0;

  const insights: DropOffInsight[] = data.drop_off_insights
    ?? data.chapters.slice(1).flatMap((ch, i) => {
      const prev = data.chapters[i];
      const viewDrop = prev.total_views > 0
        ? Math.round(100 * (prev.total_views - ch.total_views) / prev.total_views)
        : 0;
      const completionDrop = prev.completion_rate - ch.completion_rate;
      if (viewDrop < 15 && completionDrop < 12) return [];
      return [{
        chapter_number: ch.chapter_number,
        view_drop_pct: viewDrop,
        completion_drop_pct: completionDrop,
        avg_scroll_pct: ch.avg_scroll_pct,
        suggestion: ch.avg_scroll_pct < 70
          ? `Most readers stopped around ${100 - ch.avg_scroll_pct}% into Chapter ${ch.chapter_number}. Consider shorter paragraphs or a stronger hook.`
          : `Chapter ${ch.chapter_number} loses ${viewDrop}% of readers vs. the previous chapter. Review pacing and cliffhanger strength.`,
      }];
    });

  return (
    <div className="cms-page">
      <header className="cms-page-header">
        <div>
          <h1 className="cms-page-header__title">{data.story?.title || 'Story Analytics'}</h1>
          <p className="cms-page-header__subtitle">
            Understand where readers drop off and optimize your pacing for better retention.
          </p>
        </div>
        <div className="cms-page-header__actions" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            className="cms-input"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            aria-label="Date range"
            style={{ width: 'auto' }}
          >
            <option value="7d">Last 7 chapters</option>
            <option value="30d">Last 30 chapters</option>
            <option value="all">All chapters</option>
          </select>
          <Link to={`/stories/${storyId}`} className="btn btn-secondary">Back to chapters</Link>
        </div>
      </header>

      <div className="cms-kpi-grid">
        <div className="cms-kpi-card">
          <div className="cms-kpi-card__value">{totalReads.toLocaleString('en-IN')}</div>
          <div className="cms-kpi-card__label">Total reads</div>
        </div>
        <div className="cms-kpi-card">
          <div className="cms-kpi-card__value">{filteredChapters.length}</div>
          <div className="cms-kpi-card__label">Chapters published</div>
        </div>
        <div className="cms-kpi-card">
          <div className="cms-kpi-card__value">{avgCompletion}%</div>
          <div className="cms-kpi-card__label">Avg completion rate</div>
        </div>
        <div className="cms-kpi-card">
          <div className="cms-kpi-card__value">{data.subscribers_gained}</div>
          <div className="cms-kpi-card__label">Subscribers gained</div>
        </div>
      </div>

      {insights.length > 0 && (
        <div className="cms-callout">
          <div className="cms-callout__head">
            <Lightbulb size={20} color="var(--dash-gold)" />
            <h3 className="cms-callout__title">Drop-off insights</h3>
          </div>
          {insights.map((insight) => (
            <div key={insight.chapter_number} className="cms-insight-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <AlertTriangle size={16} color="#C47832" />
                <strong style={{ color: 'var(--ink)' }}>Chapter {insight.chapter_number}</strong>
                <span style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>
                  −{insight.view_drop_pct}% readers · −{insight.completion_drop_pct}% completion
                </span>
              </div>
              <p className="cms-callout__body">{insight.suggestion}</p>
            </div>
          ))}
        </div>
      )}

      <div className="cms-panel cms-panel--flat">
        <div className="cms-panel__head">
          <h3 className="cms-panel__title" style={{ margin: 0 }}>
            <BarChart3 size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Chapter breakdown
          </h3>
        </div>
        <div className="cms-table-wrap">
          <table className="cms-table">
            <thead>
              <tr>
                <th>Chapter</th>
                <th>Views</th>
                <th>Completion</th>
                <th>Avg scroll</th>
              </tr>
            </thead>
            <tbody>
              {filteredChapters.map((ch) => (
                <tr key={ch.chapter_number}>
                  <td>
                    Ch {ch.chapter_number}
                    <Link
                      to={`/stories/${storyId}/chapters/${ch.chapter_number}`}
                      className="btn btn-ghost"
                      style={{ marginLeft: 8, fontSize: '0.75rem', padding: '4px 8px' }}
                      onClick={() => trackCreatorEvent('creator_chapter_edit_from_analytics', { story_id: storyId, chapter: ch.chapter_number })}
                    >
                      Edit
                    </Link>
                  </td>
                  <td>{ch.total_views.toLocaleString('en-IN')}</td>
                  <td>
                    {ch.completion_rate}%
                    {ch.completion_rate < 70 && ch.chapter_number > 1 && (
                      <AlertTriangle size={14} color="#C47832" style={{ marginLeft: 6, verticalAlign: 'middle' }} />
                    )}
                  </td>
                  <td>{ch.avg_scroll_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}