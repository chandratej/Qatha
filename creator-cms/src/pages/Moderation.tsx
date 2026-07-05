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
    <div>
      <header className="page-header">
        <div>
          <h2>Moderation Queue</h2>
          <p>Review flagged chapters — target 15 min/day. Zero tolerance for hard blocks.</p>
        </div>
        <button className="btn btn-secondary" onClick={reload} disabled={loading}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      {loading && (
        <div style={{ display: 'flex', gap: 8, color: 'var(--ink-muted)' }}>
          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Loading queue...
        </div>
      )}

      {error && <div className="card" style={{ padding: 24, color: '#C47832' }}>{error}</div>}

      {!loading && queue.length === 0 && (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <Shield size={48} color="var(--gold)" style={{ marginBottom: 16 }} />
          <h3 style={{ marginBottom: 8 }}>Queue is clear</h3>
          <p style={{ color: 'var(--ink-muted)' }}>No chapters pending review. Great job!</p>
        </div>
      )}

      <div style={{ display: 'grid', gap: 20 }}>
        {queue.map((item: ModerationItem) => (
          <div key={item.id} className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className="badge badge-warning">Pending</span>
                  {item.toxicity_score && item.toxicity_score > 0.7 && (
                    <span className="badge badge-warning">
                      <AlertTriangle size={12} style={{ marginRight: 4 }} />
                      Toxicity {(item.toxicity_score * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: '1.125rem' }}>
                  Ch {item.chapters.chapter_number}: {item.chapters.title || 'Untitled'}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>
                  by {item.creators.pen_name} · {item.reason}
                </p>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                {new Date(item.created_at).toLocaleString()}
              </span>
            </div>

            <div
              style={{
                background: 'var(--paper-warm)',
                borderRadius: 12,
                padding: 20,
                marginBottom: 16,
                fontFamily: 'var(--font-telugu)',
                fontSize: '0.9375rem',
                lineHeight: 1.7,
                maxHeight: 200,
                overflow: 'auto',
              }}
            >
              {item.chapters.content}
            </div>

            <div className="input-group" style={{ marginBottom: 16 }}>
              <label>Reviewer notes (optional)</label>
              <input
                value={notes[item.id] || ''}
                onChange={(e) => setNotes({ ...notes, [item.id]: e.target.value })}
                placeholder="Reason for decision — visible to creator on appeal"
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn btn-primary"
                disabled={reviewing === item.id}
                onClick={() => handleReview(item.id, 'approved')}
              >
                <Check size={18} /> Approve
              </button>
              <button
                className="btn btn-secondary"
                disabled={reviewing === item.id}
                onClick={() => handleReview(item.id, 'needs_revision')}
              >
                Request edits
              </button>
              <button
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