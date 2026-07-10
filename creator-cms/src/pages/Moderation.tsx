import { useMemo, useState } from 'react';
import { Shield, Check, X, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import type { ModerationItem } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import { sanitizeHtml } from '../lib/sanitizeHtml';

export function Moderation() {
  const { data, loading, error, reload } = useApi(() => api.getModerationQueue());
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const handleReview = async (id: string, decision: string) => {
    setReviewing(id);
    try {
      await api.reviewModeration(id, decision, notes[id]);
      await reload();
    } finally {
      setReviewing(null);
    }
  };

  const [statusFilter, setStatusFilter] = useState<'pending' | 'all'>('pending');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 5;

  const queue = useMemo(() => {
    const all = data?.queue || [];
    return statusFilter === 'pending' ? all.filter((q) => q.status === 'pending') : all;
  }, [data?.queue, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(queue.length / PAGE_SIZE));
  const pagedQueue = queue.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="cms-page studio-page moderation-studio">
      <StudioPageHeader
        eyebrow="Trust & safety"
        eyebrowIcon={Shield}
        title="Moderation queue"
        subtitle="Review flagged chapters — target 15 min/day. Zero tolerance for hard blocks."
        actions={(
          <>
            <select
              className="cms-select"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as 'pending' | 'all'); setPage(0); }}
              aria-label="Filter queue"
            >
              <option value="pending">Pending only</option>
              <option value="all">All items</option>
            </select>
            <button type="button" className="btn btn-secondary" onClick={reload} disabled={loading}>
              <RefreshCw size={16} />
              Refresh
            </button>
          </>
        )}
      />

      {loading && (
        <div className="cms-loading">
          <Loader2 size={20} className="cms-loading__spin" />
          Loading queue…
        </div>
      )}

      {error && <div className="cms-panel cms-error-text">{error}</div>}

      {!loading && queue.length === 0 && (
        <div className="studio-empty">
          <div className="studio-empty__glyph" aria-hidden><Shield size={32} /></div>
          <h3 className="studio-empty__title">Queue is clear</h3>
          <p className="studio-empty__text">No chapters pending review. Great job!</p>
        </div>
      )}

      <div style={{ display: 'grid', gap: 20 }}>
        {pagedQueue.map((item: ModerationItem) => (
          <div
            key={item.id}
            className={`cms-panel cms-panel--flat moderation-item${item.toxicity_score != null && item.toxicity_score > 0.7 ? ' moderation-item--flagged' : ''}`}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span className="badge badge-warning">Pending</span>
                  {item.toxicity_score != null && (
                    <span className={`badge ${item.toxicity_score > 0.7 ? 'badge-warning' : 'badge-gold'}`}>
                      {item.toxicity_score > 0.7 && <AlertTriangle size={12} style={{ marginRight: 4 }} />}
                      Toxicity {(item.toxicity_score * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                <h3 className="cms-story-card__title">
                  Ch {item.chapters.chapter_number}: {item.chapters.title || 'Untitled'}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginTop: 4 }}>
                  by {item.creators.pen_name} · {item.reason}
                </p>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                {new Date(item.created_at).toLocaleString()}
              </span>
            </div>

            <div
              className="cms-moderation-preview"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.chapters.content || '') }}
            />

            <div className="input-group" style={{ marginBottom: 16 }}>
              <label>Reviewer notes (optional)</label>
              <input
                value={notes[item.id] || ''}
                onChange={(e) => setNotes({ ...notes, [item.id]: e.target.value })}
                placeholder="Reason for decision — visible to creator on appeal"
              />
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary"
                disabled={reviewing === item.id}
                onClick={() => handleReview(item.id, 'approved')}
              >
                <Check size={18} /> Approve
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={reviewing === item.id}
                onClick={() => handleReview(item.id, 'needs_revision')}
              >
                Request edits
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-danger"
                disabled={reviewing === item.id}
                onClick={() => handleReview(item.id, 'rejected')}
              >
                <X size={18} /> Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      {queue.length > PAGE_SIZE && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
          <button type="button" className="btn btn-ghost" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', alignSelf: 'center' }}>
            Page {page + 1} of {pageCount}
          </span>
          <button type="button" className="btn btn-ghost" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}