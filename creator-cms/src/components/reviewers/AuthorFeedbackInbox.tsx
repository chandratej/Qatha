import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, ChevronDown, Gavel, MessageSquareQuote, ScrollText, Sparkles,
} from 'lucide-react';
import { platformApi } from '../../lib/platformApi';
import type { AuthorReviewFeedbackBundle } from '../../lib/platformStore';
import type { AuthorCommentResolution, ReviewSubmissionSummary, StructuredReviewComment } from '../../types/platform';
import { GENRE_SPECIALIZATIONS, REVIEW_DECISIONS } from '../../lib/platformConstants';
import { THREAD_MENTION_REVIEWER } from '../../../../packages/shared/reviewThreads';
import { isAcceptDecision, isRevisionDecision, MAX_REVISION_ROUNDS } from '../../../../packages/shared/peerReviewRevision';

function statusLabel(s: string) {
  return s.replace(/_/g, ' ');
}

function decisionLabel(id?: string) {
  if (!id) return null;
  return REVIEW_DECISIONS.find((d) => d.id === id)?.label ?? id.replace(/_/g, ' ');
}

function categoryLabel(id: string) {
  return id.replace(/_/g, ' ');
}

function hasReadableFeedback(bundle: AuthorReviewFeedbackBundle): boolean {
  const { request, submissions } = bundle;
  return (
    (request.structured_comments?.length ?? 0) > 0
    || submissions.some((s) => s.review_summary?.overall_review)
    || request.reviews_received > 0
  );
}

function commentLocation(c: StructuredReviewComment): string {
  return [c.chapter_ref, c.scene_ref, c.paragraph_ref, c.sentence_ref]
    .filter(Boolean)
    .join(' · ');
}

interface Props {
  bundles: AuthorReviewFeedbackBundle[];
  onResolve?: () => void;
}

export function AuthorFeedbackInbox({ bundles, onResolve }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(() => {
    const ready = bundles.find((b) => hasReadableFeedback(b));
    return ready?.request.id ?? null;
  });

  const { ready, waiting } = useMemo(() => {
    const readyList = bundles.filter((b) => hasReadableFeedback(b));
    const waitingList = bundles.filter((b) => !hasReadableFeedback(b) && !['completed', 'cancelled'].includes(b.request.status));
    return { ready: readyList, waiting: waitingList };
  }, [bundles]);

  if (bundles.length === 0) {
    return (
      <section className="author-feedback author-feedback--calm" aria-labelledby="author-feedback-title">
        <div className="author-feedback__head">
          <ScrollText size={20} aria-hidden />
          <div>
            <h3 id="author-feedback-title" className="author-feedback__title">Your council feedback</h3>
            <p className="author-feedback__subtitle">Passage-level notes and council decisions appear here after reviewers submit.</p>
          </div>
        </div>
        <div className="author-feedback__empty">
          <p>No review requests yet.</p>
          <p className="input-hint">Request a community review below to invite Reviewer Pool readers.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="author-feedback author-feedback--calm" aria-labelledby="author-feedback-title">
      <div className="author-feedback__head">
        <ScrollText size={20} aria-hidden />
        <div>
          <h3 id="author-feedback-title" className="author-feedback__title">Your council feedback</h3>
          <p className="author-feedback__subtitle">
            Double-blind · reviewer identities hidden until all reviews are in
          </p>
        </div>
      </div>

      {ready.length > 0 && (
        <div className="author-feedback__group">
          <h4 className="author-feedback__section">Ready to read</h4>
          <ul className="author-feedback__list">
            {ready.map((bundle) => (
              <FeedbackCard
                key={bundle.request.id}
                bundle={bundle}
                expanded={expandedId === bundle.request.id}
                onToggle={() => setExpandedId((id) => (id === bundle.request.id ? null : bundle.request.id))}
                onResolve={onResolve}
              />
            ))}
          </ul>
        </div>
      )}

      {waiting.length > 0 && (
        <div className="author-feedback__group">
          <h4 className="author-feedback__section">Awaiting reviewers</h4>
          <ul className="author-feedback__list">
            {waiting.map((bundle) => (
              <WaitingCard key={bundle.request.id} bundle={bundle} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function WaitingCard({ bundle }: { bundle: AuthorReviewFeedbackBundle }) {
  const { request } = bundle;
  const pct = Math.round((request.reviews_received / Math.max(1, request.reviewers_matched)) * 100);
  const genre = GENRE_SPECIALIZATIONS.find((g) => g.id === request.story_genre)?.label ?? request.story_genre;

  return (
    <li className="author-feedback__card author-feedback__card--waiting">
      <div className="author-feedback__card-head">
        <h5 className="author-feedback__card-title">{request.story_title}</h5>
        <span className={`review-status review-status--${request.status}`}>{statusLabel(request.status)}</span>
      </div>
      <p className="author-feedback__card-meta">{genre} · {request.reviews_received}/{request.reviewers_matched} reviews in</p>
      <div className="review-progress-bar" aria-hidden>
        <span className="review-progress-bar__fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="input-hint">Reviewers are reading your manuscript. Feedback will appear here as they submit.</p>
    </li>
  );
}

function FeedbackCard({
  bundle,
  expanded,
  onToggle,
  onResolve,
}: {
  bundle: AuthorReviewFeedbackBundle;
  expanded: boolean;
  onToggle: () => void;
  onResolve?: () => void;
}) {
  const { request, submissions } = bundle;
  const [busyComment, setBusyComment] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [revisionNotes, setRevisionNotes] = useState('');
  const [appealReason, setAppealReason] = useState('');
  const [lifecycleBusy, setLifecycleBusy] = useState(false);
  const [satisfactionRating, setSatisfactionRating] = useState<number | null>(null);

  const resolveComment = async (commentId: string, resolution: AuthorCommentResolution) => {
    setBusyComment(commentId);
    try {
      await platformApi.resolveAuthorComment(request.id, commentId, resolution);
      onResolve?.();
    } finally {
      setBusyComment(null);
    }
  };

  const sendReply = async (commentId: string) => {
    const body = (replyDrafts[commentId] || '').trim();
    if (!body) return;
    setBusyComment(commentId);
    try {
      await platformApi.replyToReviewComment(request.id, commentId, body);
      setReplyDrafts((prev) => ({ ...prev, [commentId]: '' }));
      onResolve?.();
    } finally {
      setBusyComment(null);
    }
  };

  const comments = request.structured_comments ?? [];
  const pct = Math.round((request.reviews_received / Math.max(1, request.reviewers_matched)) * 100);
  const genre = GENRE_SPECIALIZATIONS.find((g) => g.id === request.story_genre)?.label ?? request.story_genre;
  const decision = decisionLabel(request.majority_decision);
  const showLifecycle = request.status === 'decision_ready';
  const canAcknowledge = showLifecycle && isAcceptDecision(request.majority_decision);
  const canResubmit = showLifecycle
    && isRevisionDecision(request.majority_decision)
    && (request.revision_round ?? 0) < MAX_REVISION_ROUNDS;
  const canAppeal = showLifecycle && request.audit_status !== 'appealed';
  const appealPending = request.audit_status === 'appealed';

  const acknowledgeDecision = async () => {
    setLifecycleBusy(true);
    try {
      await platformApi.acknowledgePeerReview(request.id, satisfactionRating ?? undefined);
      setSatisfactionRating(null);
      onResolve?.();
    } finally {
      setLifecycleBusy(false);
    }
  };

  const resubmitForRevision = async () => {
    setLifecycleBusy(true);
    try {
      await platformApi.resubmitPeerReview(request.id, revisionNotes.trim() || undefined);
      setRevisionNotes('');
      onResolve?.();
    } finally {
      setLifecycleBusy(false);
    }
  };

  const submitAppeal = async () => {
    const reason = appealReason.trim();
    if (reason.length < 10) return;
    setLifecycleBusy(true);
    try {
      await platformApi.submitPeerReviewAppeal(request.id, reason);
      setAppealReason('');
      onResolve?.();
    } finally {
      setLifecycleBusy(false);
    }
  };

  return (
    <li className={`author-feedback__card${expanded ? ' author-feedback__card--open' : ''}`}>
      <button type="button" className="author-feedback__card-toggle" onClick={onToggle} aria-expanded={expanded}>
        <div className="author-feedback__card-head">
          <h5 className="author-feedback__card-title">{request.story_title}</h5>
          <span className={`review-status review-status--${request.status}`}>{statusLabel(request.status)}</span>
        </div>
        <p className="author-feedback__card-meta">
          {genre} · {request.reviews_received}/{request.reviewers_matched} reviews
          {decision ? ` · Council: ${decision}` : ''}
        </p>
        <div className="review-progress-bar" aria-hidden>
          <span className="review-progress-bar__fill" style={{ width: `${pct}%` }} />
        </div>
        <ChevronDown
          size={16}
          aria-hidden
          className={`author-feedback__chevron${expanded ? ' author-feedback__chevron--open' : ''}`}
        />
      </button>

      {expanded && (
        <div className="author-feedback__body">
          {decision && (
            <div className="author-feedback__decision">
              <Sparkles size={16} aria-hidden />
              <div>
                <span className="author-feedback__decision-label">Council decision</span>
                <strong>{decision}</strong>
                {request.consensus_pct != null && (
                  <span className="input-hint"> · {request.consensus_pct}% consensus</span>
                )}
              </div>
            </div>
          )}

          {submissions.map((sub) => (
            <ReviewerSummaryBlock key={sub.id} slot={sub.reviewer_slot} summary={sub.review_summary} />
          ))}

          {comments.length > 0 && (
            <div className="author-feedback__notes">
              <h6 className="author-feedback__notes-title">
                <MessageSquareQuote size={15} aria-hidden /> Passage notes ({comments.length})
              </h6>
              <ul className="author-feedback__notes-list">
                {comments.map((c, idx) => (
                  <li key={`${c.chapter_ref}-${c.paragraph_ref}-${idx}`} className="author-feedback__note">
                    <div className="author-feedback__note-head">
                      <span className="author-feedback__note-cat">{categoryLabel(c.category)}</span>
                      <span className={`author-feedback__note-priority author-feedback__note-priority--${c.priority}`}>
                        {c.priority}
                      </span>
                      {commentLocation(c) && (
                        <span className="author-feedback__note-loc">{commentLocation(c)}</span>
                      )}
                    </div>
                    {c.passage_ref && (
                      <blockquote className="author-feedback__note-passage">"{c.passage_ref}"</blockquote>
                    )}
                    <p className="author-feedback__note-reason">{c.reason}</p>
                    {c.recommendation && (
                      <p className="author-feedback__note-rec">
                        <strong>Suggestion:</strong> {c.recommendation}
                      </p>
                    )}
                    {c.expected_impact && (
                      <p className="author-feedback__note-impact">
                        <strong>Impact:</strong> {c.expected_impact}
                      </p>
                    )}
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
                      <div className="author-feedback__note-actions">
                        {c.author_resolution && c.author_resolution !== 'pending' ? (
                          <span className={`author-feedback__resolution author-feedback__resolution--${c.author_resolution}`}>
                            {c.author_resolution}
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="studio-chip"
                              disabled={busyComment === c.id}
                              onClick={() => { void resolveComment(c.id!, 'accepted'); }}
                            >
                              Accept suggestion
                            </button>
                            <button
                              type="button"
                              className="studio-chip"
                              disabled={busyComment === c.id}
                              onClick={() => { void resolveComment(c.id!, 'deferred'); }}
                            >
                              Defer
                            </button>
                            <button
                              type="button"
                              className="studio-chip"
                              disabled={busyComment === c.id}
                              onClick={() => { void resolveComment(c.id!, 'rejected'); }}
                            >
                              Decline
                            </button>
                          </>
                        )}
                        <label className="author-feedback__reply">
                          <span className="input-hint">
                            Reply to reviewer · use {THREAD_MENTION_REVIEWER} to notify
                          </span>
                          <textarea
                            className="rw-textarea"
                            rows={2}
                            value={replyDrafts[c.id] || ''}
                            onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [c.id!]: e.target.value }))}
                            placeholder={`Clarify your revision plan or ask a question… (${THREAD_MENTION_REVIEWER})`}
                          />
                          <button
                            type="button"
                            className="katha-cta katha-cta--soft katha-cta--compact"
                            disabled={busyComment === c.id || !(replyDrafts[c.id] || '').trim()}
                            onClick={() => { void sendReply(c.id!); }}
                          >
                            Send reply
                          </button>
                        </label>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {appealPending && (
            <p className="author-feedback__appeal-pending input-hint">
              <Gavel size={14} aria-hidden /> Your appeal is under independent review. You will be notified when a decision is posted.
            </p>
          )}

          {canAppeal && (
            <div className="author-feedback__appeal">
              <label className="input-hint">
                File an appeal if you believe the council decision had a procedural issue
                <textarea
                  className="rw-textarea"
                  rows={2}
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  placeholder="Describe the procedural concern (10+ characters)…"
                />
              </label>
              <button
                type="button"
                className="katha-cta katha-cta--soft katha-cta--compact"
                disabled={lifecycleBusy || appealReason.trim().length < 10}
                onClick={() => { void submitAppeal(); }}
              >
                <Gavel size={14} aria-hidden /> Submit appeal
              </button>
            </div>
          )}

          {showLifecycle && (canAcknowledge || canResubmit) && (
            <div className="author-feedback__lifecycle">
              {canAcknowledge && (
                <div className="author-feedback__satisfaction">
                  <p className="input-hint" id={`satisfaction-label-${request.id}`}>
                    How helpful was this council review? (optional)
                  </p>
                  <div className="author-feedback__stars" role="group" aria-labelledby={`satisfaction-label-${request.id}`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`author-feedback__star${satisfactionRating === n ? ' author-feedback__star--on' : ''}`}
                        aria-pressed={satisfactionRating === n}
                        aria-label={`${n} out of 5`}
                        onClick={() => setSatisfactionRating(n)}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="katha-cta katha-cta--maroon katha-cta--compact"
                    disabled={lifecycleBusy}
                    onClick={() => { void acknowledgeDecision(); }}
                  >
                    Mark review complete
                  </button>
                </div>
              )}
              {canResubmit && (
                <div className="author-feedback__resubmit">
                  <label className="input-hint">
                    Resubmit for council re-review (round {(request.revision_round ?? 0) + 1}/{MAX_REVISION_ROUNDS})
                  </label>
                  <textarea
                    className="rw-textarea"
                    rows={2}
                    value={revisionNotes}
                    onChange={(e) => setRevisionNotes(e.target.value)}
                    placeholder="Summarize what you changed since the last round…"
                  />
                  <button
                    type="button"
                    className="katha-cta katha-cta--soft katha-cta--compact"
                    disabled={lifecycleBusy}
                    onClick={() => { void resubmitForRevision(); }}
                  >
                    Resubmit for re-review
                  </button>
                </div>
              )}
            </div>
          )}

          {request.story_id && !request.story_id.startsWith('demo-') && (
            <Link to={`/stories/${request.story_id}`} className="katha-cta katha-cta--soft author-feedback__revise-cta">
              <BookOpen size={14} aria-hidden /> Open manuscript to revise
            </Link>
          )}
          {(request.story_id?.startsWith('demo-') ?? false) && (
            <p className="input-hint">Demo manuscript — link your own story when requesting a review to jump into the editor.</p>
          )}
        </div>
      )}
    </li>
  );
}

function ReviewerSummaryBlock({
  slot,
  summary,
}: {
  slot: string;
  summary?: ReviewSubmissionSummary;
}) {
  if (!summary?.overall_review && !summary?.strengths && !summary?.weaknesses) return null;

  const slotNum = slot.replace('slot-', '#');
  const decision = decisionLabel(summary.majority_decision);

  return (
    <article className="author-feedback__summary" lang={/[\u0C00-\u0C7F]/.test(summary.overall_review) ? 'te' : undefined}>
      <header className="author-feedback__summary-head">
        <h6>Council reviewer {slotNum}</h6>
        {decision && <span className="author-feedback__summary-decision">{decision}</span>}
      </header>
      {summary.overall_review && (
        <p className="author-feedback__summary-overall">{summary.overall_review}</p>
      )}
      <div className="author-feedback__summary-grid">
        {summary.strengths && (
          <div>
            <span className="author-feedback__summary-label">Strengths</span>
            <p>{summary.strengths}</p>
          </div>
        )}
        {summary.weaknesses && (
          <div>
            <span className="author-feedback__summary-label">Areas to refine</span>
            <p>{summary.weaknesses}</p>
          </div>
        )}
      </div>
      {summary.recommendation && (
        <p className="author-feedback__summary-rec">
          <strong>Recommendation:</strong> {summary.recommendation}
        </p>
      )}
    </article>
  );
}