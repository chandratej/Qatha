import { useState } from 'react';
import { MessageSquare, Sparkles, X } from 'lucide-react';
import type {
  ReviewChecklistItem,
  ReviewComment,
  ReviewWorkspaceMetrics,
  StoryIntelligenceSnapshot,
} from '../../../types/reviewWorkspace';
import { categoryLabel } from '../../../lib/reviewCategories';
import { useReviewLanguage } from './ReviewLanguageBar';

interface Props {
  comments: ReviewComment[];
  checklist: ReviewChecklistItem[];
  metrics: ReviewWorkspaceMetrics;
  storyIntel: StoryIntelligenceSnapshot;
  reviewerRqi: number;
  potentialRqi: number;
  commentFilter: 'all' | 'open' | 'resolved' | 'pinned' | 'critical';
  searchQuery: string;
  activeCommentId: string | null;
  onClose: () => void;
  onFilterChange: (f: Props['commentFilter']) => void;
  onSearchChange: (q: string) => void;
  onCommentSelect: (id: string) => void;
  onToggleChecklist: (id: string) => void;
  onToggleCommentStatus: (id: string, status: ReviewComment['status']) => void;
}

const FILTERS = ['all', 'open', 'critical', 'resolved'] as const;

export function RightIntelligencePanel({
  comments,
  checklist,
  metrics,
  storyIntel,
  reviewerRqi,
  potentialRqi,
  commentFilter,
  searchQuery,
  activeCommentId,
  onClose,
  onFilterChange,
  onSearchChange,
  onCommentSelect,
  onToggleChecklist,
  onToggleCommentStatus,
}: Props) {
  const [insightsOpen, setInsightsOpen] = useState(false);
  const { language } = useReviewLanguage();
  const checklistDone = checklist.filter((c) => c.completed).length;

  return (
    <aside className="rw-sheet-panel rw-sheet-panel--notes" aria-label="Observations">
      <div className="rw-sheet-panel__head">
        <Sparkles size={16} aria-hidden />
        <span>Your notes</span>
        <span className="rw-panel__header-meta">{metrics.commentsCount}</span>
        <button type="button" className="rw-sheet-panel__close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
      </div>

      <div className="rw-sheet-panel__body">
        <div className="rw-search-row">
          <input
            type="search"
            className="rw-search-input"
            placeholder="Search notes…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search observations"
          />
        </div>
        <div className="rw-filter-row" role="group" aria-label="Filter observations">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={`rw-filter-chip${commentFilter === f ? ' rw-filter-chip--on' : ''}`}
              onClick={() => onFilterChange(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <ul className="rw-comment-queue rw-comment-queue--sheet">
          {comments.length === 0 ? (
            <li className="rw-empty-hint">Highlight any passage while reading to capture a note.</li>
          ) : (
            comments.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={`rw-comment-card${activeCommentId === c.id ? ' rw-comment-card--active' : ''}`}
                  onClick={() => onCommentSelect(c.id)}
                >
                  <div className="rw-comment-card__head">
                    <MessageSquare size={12} aria-hidden />
                    <span className="rw-comment-card__cat">{categoryLabel(c.category, language)}</span>
                    {c.priority === 'critical' && (
                      <span className="rw-priority rw-priority--critical">critical</span>
                    )}
                  </div>
                  <p className="rw-comment-card__reason">{c.reason}</p>
                  <div className="rw-comment-card__actions">
                    <button
                      type="button"
                      className="rw-mini-btn"
                      onClick={(e) => { e.stopPropagation(); onToggleCommentStatus(c.id, c.status === 'resolved' ? 'open' : 'resolved'); }}
                    >
                      {c.status === 'resolved' ? 'Reopen' : 'Done'}
                    </button>
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>

        <button
          type="button"
          className="rw-insights-toggle__btn"
          onClick={() => setInsightsOpen((v) => !v)}
          aria-expanded={insightsOpen}
        >
          <span>Review progress</span>
          <span className="rw-insights-toggle__meta">RQI {reviewerRqi} · SQI {storyIntel.sqi}</span>
        </button>
        {insightsOpen && (
          <div className="rw-insights-body">
            <p className="rw-insights-line">Checklist {checklistDone}/{checklist.length}</p>
            <ul className="rw-checklist rw-checklist--compact">
              {checklist.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <label className="rw-checklist__item">
                    <input type="checkbox" checked={item.completed} onChange={() => onToggleChecklist(item.id)} />
                    <span>{item.label}</span>
                  </label>
                </li>
              ))}
            </ul>
            <p className="rw-insights-line rw-insights-line--muted">
              Potential +{Math.max(0, Math.round(potentialRqi - reviewerRqi))} RQI with quality review
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}