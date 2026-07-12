import { useMemo, useState } from 'react';
import { Shield, Check, X, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import type { ModerationItem } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import { useLocale } from '../context/LocaleContext';
import { sanitizeHtml } from '../lib/sanitizeHtml';

export function Moderation() {
  const { t } = useLocale();
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
    <div className="cms-page studio-page moderation-studio moderation-studio--premium">
      <StudioPageHeader
        variant="hero"
        eyebrow={t('moderation.eyebrow')}
        eyebrowIcon={Shield}
        title={t('moderation.title')}
        subtitle={t('moderation.subtitle')}
        actions={(
          <>
            <select
              className="cms-select"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as 'pending' | 'all'); setPage(0); }}
              aria-label={t('moderation.filterLabel')}
            >
              <option value="pending">{t('moderation.filterPending')}</option>
              <option value="all">{t('moderation.filterAll')}</option>
            </select>
            <button type="button" className="btn btn-secondary" onClick={reload} disabled={loading}>
              <RefreshCw size={16} />
              {t('moderation.refresh')}
            </button>
          </>
        )}
      />

      {loading && (
        <div className="cms-loading">
          <Loader2 size={20} className="cms-loading__spin" />
          {t('moderation.loading')}
        </div>
      )}

      {error && <div className="cms-panel cms-error-text">{error}</div>}

      {!loading && queue.length === 0 && (
        <div className="studio-empty studio-empty--premium">
          <div className="studio-empty__glyph" aria-hidden><Shield size={32} /></div>
          <h3 className="studio-empty__title">{t('moderation.emptyTitle')}</h3>
          <p className="studio-empty__text">{t('moderation.emptyText')}</p>
        </div>
      )}

      <div style={{ display: 'grid', gap: 20 }}>
        {pagedQueue.map((item: ModerationItem) => (
          <article
            key={item.id}
            className={`moderation-card${item.toxicity_score != null && item.toxicity_score > 0.7 ? ' moderation-card--flagged' : ''}`}
          >
            <header className="moderation-card__head">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  <span className="moderation-card__badge">{t('moderation.pending')}</span>
                  {item.toxicity_score != null && (
                    <span className={`badge ${item.toxicity_score > 0.7 ? 'badge-warning' : 'badge-gold'}`}>
                      {item.toxicity_score > 0.7 && <AlertTriangle size={12} style={{ marginRight: 4 }} />}
                      {t('moderation.toxicity')} {(item.toxicity_score * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                <h3 className="moderation-card__title">
                  {t('moderation.chapter')} {item.chapters.chapter_number}: {item.chapters.title || t('moderation.untitled')}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginTop: 4 }}>
                  {item.creators.pen_name} · {item.reason}
                </p>
              </div>
              <time style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }} dateTime={item.created_at}>
                {new Date(item.created_at).toLocaleString()}
              </time>
            </header>

            <div
              className="cms-moderation-preview"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.chapters.content || '') }}
            />

            <div className="input-group" style={{ marginTop: 14 }}>
              <label>{t('moderation.notesLabel')}</label>
              <input
                value={notes[item.id] || ''}
                onChange={(e) => setNotes({ ...notes, [item.id]: e.target.value })}
                placeholder={t('moderation.notesPlaceholder')}
              />
            </div>

            <footer className="moderation-card__actions">
              <button
                type="button"
                className="katha-cta katha-cta--maroon katha-cta--compact"
                disabled={reviewing === item.id}
                onClick={() => handleReview(item.id, 'approved')}
              >
                <Check size={18} /> {t('moderation.approve')}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={reviewing === item.id}
                onClick={() => handleReview(item.id, 'needs_revision')}
              >
                {t('moderation.requestEdits')}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-danger"
                disabled={reviewing === item.id}
                onClick={() => handleReview(item.id, 'rejected')}
              >
                <X size={18} /> {t('moderation.reject')}
              </button>
            </footer>
          </article>
        ))}
      </div>

      {queue.length > PAGE_SIZE && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
          <button type="button" className="btn btn-ghost" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            {t('moderation.prevPage')}
          </button>
          <span style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', alignSelf: 'center' }}>
            {t('moderation.page')} {page + 1} / {pageCount}
          </span>
          <button type="button" className="btn btn-ghost" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>
            {t('moderation.nextPage')}
          </button>
        </div>
      )}
    </div>
  );
}