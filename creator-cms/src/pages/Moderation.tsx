import { useState } from 'react';
import { Shield, Check, X, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import type { ModerationItem } from '../lib/api';
import { useApi } from '../hooks/useApi';

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

  const queue = data?.queue || [];

  return (
    <div className="cms-page">
      <header className="cms-page-header">
        <div>
          <h1 className="cms-page-header__title">Moderation Queue</h1>
          <p className="cms-page-header__subtitle">
            Review flagged chapters — target 15 min/day. Zero tolerance for hard blocks.
          </p>
        </div>
        <div className="cms-page-header__actions">
          <button type="button" className="btn btn-secondary" onClick={reload} disabled={loading}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </header>

      {loading && (
        <div className="cms-loading">
          <Loader2 size={20} className="cms-loading__spin" />
          Loading queue…
        </div>
      )}

      {error && <div className="cms-panel cms-error-text">{error}</div>}

      {!loading && queue.length === 0 && (
        <div className="cms-empty">
          <Shield size={48} className="cms-empty__icon" />
          <h3 className="cms-empty__title">Queue is clear</h3>
          <p className="cms-empty__text">No chapters pending review. Great job!</p>
        </div>
      )}

      <div style={{ display: 'grid', gap: 20 }}>
        {queue.map((item: ModerationItem) => (
          <div key={item.id} className="cms-panel cms-panel--flat">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span className="badge badge-warning">Pending</span>
                  {item.toxicity_score && item.toxicity_score > 0.7 && (
                    <span className="badge badge-warning">
                      <AlertTriangle size={12} style={{ marginRight: 4 }} />
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

            <div className="cms-moderation-preview">{item.chapters.content}</div>

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
                className="btn btn-ghost"
                disabled={reviewing === item.id}
                onClick={() => handleReview(item.id, 'rejected')}
                style={{ color: '#C47832' }}
              >
                <X size={18} /> Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}