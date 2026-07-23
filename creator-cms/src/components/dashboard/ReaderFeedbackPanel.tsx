import { useCallback } from 'react';
import { MessageSquareQuote, CheckCircle2 } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { api } from '../../lib/api';
import type { ReaderFeedback } from '../../../../packages/shared/readerFeedback';

interface ReaderFeedbackPanelProps {
  storyId: string;
  storyTitle?: string;
}

function typeLabel(type: string) {
  return type.replace(/_/g, ' ');
}

export function ReaderFeedbackPanel({ storyId, storyTitle }: ReaderFeedbackPanelProps) {
  const load = useCallback(
    () => api.getReaderFeedback(storyId).catch(() => ({ feedback: [] as ReaderFeedback[] })),
    [storyId],
  );
  const { data, reload } = useApi(load, [storyId]);

  const items = (data?.feedback ?? []).filter((f) => f.status !== 'archived');
  if (items.length === 0) {
    return (
      <p className="input-hint">
        Reader feedback from the reader app will appear here once chapters are live
        {storyTitle ? ` for “${storyTitle}”` : ''}.
      </p>
    );
  }

  const updateStatus = async (id: string, status: string) => {
    await api.updateReaderFeedback(storyId, id, { status });
    await reload();
  };

  return (
    <ul className="reader-feedback-panel__list">
      {items.map((item) => (
        <li key={item.id} className={`reader-feedback-panel__item${item.status === 'resolved' ? ' is-resolved' : ''}`}>
          <div className="reader-feedback-panel__meta">
            <MessageSquareQuote size={14} aria-hidden />
            <span className="reader-feedback-panel__type">{typeLabel(item.feedback_type)}</span>
            {item.chapter_number ? <span>Ch. {item.chapter_number}</span> : null}
            {item.status === 'pending' ? <span className="reader-feedback-panel__pending">Pending</span> : null}
          </div>
          <p>{item.body}</p>
          {item.feedback_type === 'praise' ? (
            // Praise is author-moderated, never an aggregate score (Req 3.2): "published"
            // is what the public /:id/praise endpoint surfaces as a testimonial on the
            // story page; any other status keeps it visible only here, to the author.
            item.status === 'published' ? (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => { void updateStatus(item.id, 'resolved'); }}
              >
                Make private
              </button>
            ) : (
              <div className="reader-feedback-panel__actions">
                <button
                  type="button"
                  className="katha-cta katha-cta--soft"
                  onClick={() => { void updateStatus(item.id, 'published'); }}
                >
                  Show publicly on story page
                </button>
                {item.status === 'pending' && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => { void updateStatus(item.id, 'resolved'); }}
                  >
                    Keep private
                  </button>
                )}
              </div>
            )
          ) : (
            <>
              {item.status === 'pending' && (
                <div className="reader-feedback-panel__actions">
                  <button
                    type="button"
                    className="katha-cta katha-cta--soft"
                    onClick={() => { void updateStatus(item.id, 'published'); }}
                  >
                    Publish to inbox
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => { void updateStatus(item.id, 'archived'); }}
                  >
                    Dismiss
                  </button>
                </div>
              )}
              {item.status === 'published' && (
                <button
                  type="button"
                  className="katha-cta katha-cta--soft"
                  onClick={() => { void updateStatus(item.id, 'resolved'); }}
                >
                  <CheckCircle2 size={14} aria-hidden /> Mark resolved
                </button>
              )}
            </>
          )}
        </li>
      ))}
    </ul>
  );
}