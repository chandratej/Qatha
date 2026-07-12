import { useMemo, useState } from 'react';
import { MessageSquareQuote, ScrollText } from 'lucide-react';
import { platformApi } from '../../lib/platformApi';
import type { ReviewerFeedbackBundle, StructuredReviewComment } from '../../types/platform';
import { THREAD_MENTION_AUTHOR } from '../../../../packages/shared/reviewThreads';

function commentLocation(c: StructuredReviewComment): string {
  return [c.chapter_ref, c.scene_ref, c.paragraph_ref, c.sentence_ref]
    .filter(Boolean)
    .join(' · ');
}

function hasAuthorActivity(comments: StructuredReviewComment[]): boolean {
  return comments.some(
    (c) => (c.threads?.some((t) => t.role === 'author') ?? false)
      || (c.author_resolution && c.author_resolution !== 'pending'),
  );
}

interface Props {
  bundles: ReviewerFeedbackBundle[];
  onReply?: () => void;
}

export function ReviewerFeedbackInbox({ bundles, onReply }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(() => {
    const active = bundles.find((b) => hasAuthorActivity(b.comments));
    return active?.assignment.id ?? bundles[0]?.assignment.id ?? null;
  });
  const [busyComment, setBusyComment] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const { withReplies, awaiting } = useMemo(() => {
    const replied = bundles.filter((b) => hasAuthorActivity(b.comments));
    const waiting = bundles.filter((b) => !hasAuthorActivity(b.comments));
    return { withReplies: replied, awaiting: waiting };
  }, [bundles]);

  const sendReply = async (requestId: string, commentId: string) => {
    const body = (replyDrafts[commentId] || '').trim();
    if (!body) return;
    setBusyComment(commentId);
    try {
      await platformApi.replyToReviewCommentAsReviewer(requestId, commentId, body);
      setReplyDrafts((prev) => ({ ...prev, [commentId]: '' }));
      onReply?.();
    } finally {
      setBusyComment(null);
    }
  };

  if (bundles.length === 0) {
    return (
      <section className="reviewer-feedback reviewer-feedback--calm" aria-labelledby="reviewer-feedback-title">
        <div className="reviewer-feedback__head">
          <ScrollText size={20} aria-hidden />
          <div>
            <h3 id="reviewer-feedback-title" className="reviewer-feedback__title">Author responses</h3>
            <p className="reviewer-feedback__subtitle">
              When authors reply to your passage notes, threads appear here.
            </p>
          </div>
        </div>
        <div className="reviewer-feedback__empty">
          <p>No submitted reviews with author threads yet.</p>
          <p className="input-hint">Complete a review in Review Studio — author replies land here.</p>
        </div>
      </section>
    );
  }

  const renderBundle = (bundle: ReviewerFeedbackBundle) => {
    const { assignment, comments } = bundle;
    const expanded = expandedId === assignment.id;

    return (
      <li key={assignment.id} className={`reviewer-feedback__card${expanded ? ' reviewer-feedback__card--open' : ''}`}>
        <button
          type="button"
          className="reviewer-feedback__card-toggle"
          onClick={() => setExpandedId((id) => (id === assignment.id ? null : assignment.id))}
          aria-expanded={expanded}
        >
          <div className="reviewer-feedback__card-head">
            <h5 className="reviewer-feedback__card-title">{assignment.manuscript_label}</h5>
            {hasAuthorActivity(comments) && (
              <span className="reviewer-feedback__badge">Author replied</span>
            )}
          </div>
          <p className="reviewer-feedback__card-meta">
            {comments.length} note{comments.length !== 1 ? 's' : ''} submitted
            {assignment.submitted_at ? ` · ${new Date(assignment.submitted_at).toLocaleDateString()}` : ''}
          </p>
        </button>

        {expanded && (
          <div className="reviewer-feedback__body">
            <ul className="reviewer-feedback__notes-list">
              {comments.map((c) => (
                <li key={c.id} className="reviewer-feedback__note">
                  <div className="reviewer-feedback__note-head">
                    <span className="reviewer-feedback__note-cat">{c.category.replace(/_/g, ' ')}</span>
                    {commentLocation(c) && (
                      <span className="reviewer-feedback__note-loc">{commentLocation(c)}</span>
                    )}
                    {c.author_resolution && c.author_resolution !== 'pending' && (
                      <span className={`author-feedback__resolution author-feedback__resolution--${c.author_resolution}`}>
                        Author: {c.author_resolution}
                      </span>
                    )}
                  </div>
                  {c.passage_ref && (
                    <blockquote className="reviewer-feedback__note-passage">"{c.passage_ref}"</blockquote>
                  )}
                  <p className="reviewer-feedback__note-reason">{c.reason}</p>
                  {c.threads && c.threads.length > 0 && (
                    <ul className="author-feedback__threads">
                      {c.threads.map((t) => (
                        <li key={t.id} className={`author-feedback__thread author-feedback__thread--${t.role}`}>
                          <span className="author-feedback__thread-role">{t.role}</span>
                          <p>{t.body}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                  {c.id && (
                    <label className="author-feedback__reply">
                      <span className="input-hint">
                        Reply to author · use {THREAD_MENTION_AUTHOR} to notify
                      </span>
                      <textarea
                        className="rw-textarea"
                        rows={2}
                        value={replyDrafts[c.id] || ''}
                        onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [c.id!]: e.target.value }))}
                        placeholder={`Clarify your note or suggest a revision path… (${THREAD_MENTION_AUTHOR})`}
                      />
                      <button
                        type="button"
                        className="katha-cta katha-cta--soft katha-cta--compact"
                        disabled={busyComment === c.id || !(replyDrafts[c.id] || '').trim()}
                        onClick={() => { void sendReply(bundle.request_id, c.id!); }}
                      >
                        Send reply
                      </button>
                    </label>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </li>
    );
  };

  return (
    <section className="reviewer-feedback reviewer-feedback--calm" aria-labelledby="reviewer-feedback-title">
      <div className="reviewer-feedback__head">
        <MessageSquareQuote size={20} aria-hidden />
        <div>
          <h3 id="reviewer-feedback-title" className="reviewer-feedback__title">Author responses</h3>
          <p className="reviewer-feedback__subtitle">
            Continue the craft conversation — authors may accept, defer, or ask questions on your notes.
          </p>
        </div>
      </div>

      {withReplies.length > 0 && (
        <div className="reviewer-feedback__group">
          <h4 className="reviewer-feedback__section">Needs your attention</h4>
          <ul className="reviewer-feedback__list">{withReplies.map(renderBundle)}</ul>
        </div>
      )}

      {awaiting.length > 0 && (
        <div className="reviewer-feedback__group">
          <h4 className="reviewer-feedback__section">Awaiting author response</h4>
          <ul className="reviewer-feedback__list">{awaiting.map(renderBundle)}</ul>
        </div>
      )}
    </section>
  );
}