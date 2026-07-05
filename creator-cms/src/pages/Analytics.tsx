import { useParams, Link } from 'react-router-dom';
import { AlertTriangle, Lightbulb } from 'lucide-react';
import { api } from '../lib/api';
import { useApi } from '../hooks/useApi';

type DropOffInsight = {
  chapter_number: number;
  view_drop_pct: number;
  completion_drop_pct: number;
  avg_scroll_pct: number;
  suggestion: string;
};

export function Analytics() {
  const { storyId } = useParams();
  const { data, loading, error } = useApi(() => api.getAnalytics(storyId!), [storyId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', padding: 24 }}>
        <div style={{ height: 60, width: 300, borderRadius: 8, background: 'var(--paper-warm)', animation: 'shimmer 2s infinite linear', backgroundImage: 'linear-gradient(90deg, var(--paper-warm) 0%, var(--border) 50%, var(--paper-warm) 100%)', backgroundSize: '200% 100%' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          <div style={{ height: 120, borderRadius: 12, background: 'var(--paper-warm)', animation: 'shimmer 2s infinite linear', backgroundImage: 'linear-gradient(90deg, var(--paper-warm) 0%, var(--border) 50%, var(--paper-warm) 100%)', backgroundSize: '200% 100%' }} />
          <div style={{ height: 120, borderRadius: 12, background: 'var(--paper-warm)', animation: 'shimmer 2s infinite linear', backgroundImage: 'linear-gradient(90deg, var(--paper-warm) 0%, var(--border) 50%, var(--paper-warm) 100%)', backgroundSize: '200% 100%' }} />
          <div style={{ height: 120, borderRadius: 12, background: 'var(--paper-warm)', animation: 'shimmer 2s infinite linear', backgroundImage: 'linear-gradient(90deg, var(--paper-warm) 0%, var(--border) 50%, var(--paper-warm) 100%)', backgroundSize: '200% 100%' }} />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <div className="card" style={{ padding: 24 }}>{error || 'Analytics unavailable'}</div>;
  }

  const totalReads = data.chapters.reduce((s, c) => s + c.total_views, 0);
  const avgCompletion = data.chapters.length
    ? Math.round(data.chapters.reduce((s, c) => s + c.completion_rate, 0) / data.chapters.length)
    : 0;

  const insights: DropOffInsight[] = (data as { drop_off_insights?: DropOffInsight[] }).drop_off_insights
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
    <div>
      <header className="page-header">
        <div>
          <h2>{data.story?.title || 'Story Analytics'}</h2>
          <p>Understand where readers drop off and optimize your pacing.</p>
        </div>
      </header>

      <div className="grid-stats" style={{ marginBottom: 32 }}>
        <div className="card stat-card"><div className="stat-value">{totalReads.toLocaleString()}</div><div className="stat-label">Total reads</div></div>
        <div className="card stat-card"><div className="stat-value">{data.chapters.length}</div><div className="stat-label">Chapters published</div></div>
        <div className="card stat-card"><div className="stat-value">{avgCompletion}%</div><div className="stat-label">Avg completion rate</div></div>
        <div className="card stat-card"><div className="stat-value">{data.subscribers_gained}</div><div className="stat-label">Subscribers gained</div></div>
      </div>

      {insights.length > 0 && (
        <div className="card" style={{ padding: 24, marginBottom: 24, borderLeft: '4px solid #C47832' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Lightbulb size={20} color="var(--gold)" />
            <h3 style={{ fontSize: '1.125rem' }}>Drop-off insights</h3>
          </div>
          {insights.map((insight) => (
            <div
              key={insight.chapter_number}
              style={{
                padding: '16px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <AlertTriangle size={16} color="#C47832" />
                <strong>Chapter {insight.chapter_number}</strong>
                <span style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>
                  −{insight.view_drop_pct}% readers · −{insight.completion_drop_pct}% completion
                </span>
              </div>
              <p style={{ fontSize: '0.9375rem', color: 'var(--ink-soft)', lineHeight: 1.6 }}>
                {insight.suggestion}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ marginBottom: 20 }}>Chapter breakdown</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
              <th style={{ padding: '12px 8px', fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>Chapter</th>
              <th style={{ padding: '12px 8px', fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>Views</th>
              <th style={{ padding: '12px 8px', fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>Completion</th>
              <th style={{ padding: '12px 8px', fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>Avg scroll</th>
            </tr>
          </thead>
          <tbody>
            {data.chapters.map((ch) => (
              <tr key={ch.chapter_number} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '14px 8px' }}>
                  Ch {ch.chapter_number} 
                  <Link to={`/stories/${storyId}`} style={{ marginLeft: 8, fontSize: '0.75rem' }} className="btn btn-ghost">Manage</Link>
                </td>
                <td style={{ padding: '14px 8px' }}>{ch.total_views.toLocaleString()}</td>
                <td style={{ padding: '14px 8px' }}>
                  {ch.completion_rate}%
                  {ch.completion_rate < 70 && ch.chapter_number > 1 && (
                    <AlertTriangle size={14} color="#C47832" style={{ marginLeft: 6, verticalAlign: 'middle' }} />
                  )}
                </td>
                <td style={{ padding: '14px 8px' }}>{ch.avg_scroll_pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}