import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Gavel, Hourglass, MessageSquareQuote, ScrollText, Sparkles,
} from 'lucide-react';
import { platformApi } from '../../lib/platformApi';
import type { AuthorReviewFeedbackBundle } from '../../lib/platformStore';
import type { AuthorCommentResolution, ReviewSubmissionSummary, StructuredReviewComment } from '../../types/platform';
import { GENRE_SPECIALIZATIONS, REVIEW_DECISIONS } from '../../lib/platformConstants';
import { THREAD_MENTION_REVIEWER } from '../../../../packages/shared/reviewThreads';
import { isAcceptDecision, isRevisionDecision, MAX_REVISION_ROUNDS } from '../../../../packages/shared/peerReviewRevision';
import { useLocale } from '../../context/LocaleContext';

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

/** Author feedback — matches katha_review_feedback_v2.html */
export function AuthorFeedbackInbox({ bundles, onResolve }: Props) {
  const { locale } = useLocale();
  const te = locale === 'te';
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
      <section aria-labelledby="author-feedback-title">
        <div className="rpv2-section-head--left">
          <ScrollText size={18} aria-hidden />
          <div>
            <h3 id="author-feedback-title" lang={te ? 'te' : undefined}>
              {te ? 'మీ మండలి అభిప్రాయం' : 'Your council feedback'}
            </h3>
            <p className="rpv2-section-sub" lang={te ? 'te' : undefined}>
              {te
                ? 'సమీక్షకులు సమర్పించిన తర్వాత పేరా నోట్స్ ఇక్కడ కనిపిస్తాయి.'
                : 'Passage-level notes appear here after reviewers submit.'}
            </p>
          </div>
        </div>
        <div className="rpv2-empty" lang={te ? 'te' : undefined}>
          <p>{te ? 'ఇంకా సమీక్ష అభ్యర్థనలు లేవు.' : 'No review requests yet.'}</p>
          <p className="rpv2-waiting-hint">
            {te ? 'క్రింద కమ్యూనిటీ సమీక్ష అభ్యర్థించండి.' : 'Request a community review below.'}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="author-feedback-title">
      <div className="rpv2-section-head--left">
        <ScrollText size={18} aria-hidden />
        <div>
          <h3 id="author-feedback-title" lang={te ? 'te' : undefined}>
            {te ? 'మీ మండలి అభిప్రాయం' : 'Your council feedback'}
          </h3>
          <p className="rpv2-section-sub" lang={te ? 'te' : undefined}>
            {te
              ? 'డబుల్-బ్లైండ్ · అన్ని సమీక్షలు వచ్చేవరకు సమీక్షకుల గుర్తింపు రహస్యం'
              : 'Double-blind · reviewer identities hidden until all reviews are in'}
          </p>
        </div>
      </div>

      {ready.length > 0 && (
        <div>
          {ready.map((bundle) => (
            <FeedbackCard
              key={bundle.request.id}
              bundle={bundle}
              te={te}
              expanded={expandedId === bundle.request.id || ready.length === 1}
              onToggle={() => setExpandedId((id) => (id === bundle.request.id ? null : bundle.request.id))}
              onResolve={onResolve}
            />
          ))}
        </div>
      )}

      {waiting.length > 0 && (
        <div>
          <div className="rpv2-section-head--left">
            <Hourglass size={18} aria-hidden />
            <h3 lang={te ? 'te' : undefined}>{te ? 'సమీక్షకుల కోసం వేచి ఉన్నవి' : 'Awaiting reviewers'}</h3>
          </div>
          {waiting.map((bundle) => (
            <WaitingCard key={bundle.request.id} bundle={bundle} te={te} />
          ))}
        </div>
      )}
    </section>
  );
}

function WaitingCard({ bundle, te }: { bundle: AuthorReviewFeedbackBundle; te: boolean }) {
  const { request } = bundle;
  const pct = Math.round((request.reviews_received / Math.max(1, request.reviewers_matched)) * 100);
  const genre = GENRE_SPECIALIZATIONS.find((g) => g.id === request.story_genre)?.label ?? request.story_genre;

  return (
    <div className="rpv2-card">
      <div className="rpv2-card-top">
        <div>
          <p className="rpv2-card-title" lang={te ? 'te' : undefined}>{request.story_title}</p>
          <p className="rpv2-card-meta" lang={te ? 'te' : undefined}>
            {genre} · {request.reviews_received}/{request.reviewers_matched} {te ? 'సమీక్షలు వచ్చాయి' : 'reviews in'}
          </p>
        </div>
        <span className="rpv2-status rpv2-status--review" lang={te ? 'te' : undefined}>
          {te ? 'సమీక్షలో' : 'In review'}
        </span>
      </div>
      <div className="rpv2-progress" aria-hidden>
        <div className="rpv2-progress__fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="rpv2-waiting-hint" lang={te ? 'te' : undefined}>
        {te
          ? 'సమీక్షకులు మీ మాన్యుస్క్రిప్ట్ చదువుతున్నారు. వారు సమర్పించిన వెంటనే అభిప్రాయం ఇక్కడ కనిపిస్తుంది.'
          : 'Reviewers are reading your manuscript. Feedback will appear here as they submit.'}
      </p>
    </div>
  );
}

function FeedbackCard({
  bundle,
  te,
  expanded,
  onToggle,
  onResolve,
}: {
  bundle: AuthorReviewFeedbackBundle;
  te: boolean;
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
  const isDemo = request.story_id?.startsWith('demo-') ?? false;

  return (
    <div className="rpv2-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        style={{
          width: '100%', background: 'none', border: 'none', padding: 0,
          textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', color: 'inherit',
        }}
      >
        <div className="rpv2-card-top">
          <div>
            <p className="rpv2-card-title" lang={te ? 'te' : undefined}>
              {request.story_title}
              {isDemo && <span className="rpv2-demo-tag">Demo</span>}
            </p>
            <p className="rpv2-card-meta" lang={te ? 'te' : undefined}>
              {genre} · {request.reviews_received}/{request.reviewers_matched}{' '}
              {te ? 'సమీక్షలు వచ్చాయి' : 'reviews'}
            </p>
          </div>
          <span className="rpv2-status rpv2-status--review" lang={te ? 'te' : undefined}>
            {te ? 'సమీక్షలో' : statusLabel(request.status)}
          </span>
        </div>
        <div className="rpv2-progress" aria-hidden>
          <div className="rpv2-progress__fill" style={{ width: `${pct}%` }} />
        </div>
      </button>

      {expanded && (
        <div>
          {decision && (
            <div className="rpv2-decision" lang={te ? 'te' : undefined}>
              <Sparkles size={16} aria-hidden />
              {te ? 'మండలి నిర్ణయం:' : 'Council decision:'} <b>{decision}</b>
              {request.consensus_pct != null && (
                <span> · {request.consensus_pct}% {te ? 'ఏకాభిప్రాయం' : 'consensus'}</span>
              )}
            </div>
          )}

          {submissions.map((sub) => (
            <ReviewerSummaryBlock key={sub.id} slot={sub.reviewer_slot} summary={sub.review_summary} te={te} />
          ))}

          {comments.length > 0 && (
            <div>
              <p className="rpv2-notes-title" lang={te ? 'te' : undefined}>
                <MessageSquareQuote size={15} aria-hidden />
                {te ? `పేరా నోట్స్ (${comments.length})` : `Passage notes (${comments.length})`}
              </p>
              <ul className="rpv2-notes-list">
                {comments.map((c, idx) => (
                  <li key={c.id ?? `note-${idx}`} className="rpv2-note">
                    <div className="rpv2-note-head">
                      <span className="rpv2-note-cat">{categoryLabel(c.category)}</span>
                      <span className={`rpv2-note-priority rpv2-note-priority--${c.priority}`}>
                        {c.priority === 'high' ? (te ? 'అధిక' : 'high')
                          : c.priority === 'medium' ? (te ? 'మధ్యమ' : 'medium')
                            : (te ? 'తక్కువ' : 'low')}
                      </span>
                      {commentLocation(c) && (
                        <span className="rpv2-note-loc">{commentLocation(c)}</span>
                      )}
                    </div>
                    {c.passage_ref && (
                      <blockquote className="rpv2-note-passage">"{c.passage_ref}"</blockquote>
                    )}
                    <p className="rpv2-note-reason">{c.reason}</p>
                    {c.recommendation && (
                      <p className="rpv2-note-reason">
                        <strong>{te ? 'సూచన:' : 'Suggestion:'}</strong> {c.recommendation}
                      </p>
                    )}
                    {c.id && (
                      <>
                        <div className="rpv2-note-actions">
                          {c.author_resolution && c.author_resolution !== 'pending' ? (
                            <span className={`rpv2-resolution rpv2-resolution--${c.author_resolution === 'rejected' ? 'rejected' : c.author_resolution}`}>
                              {c.author_resolution === 'accepted' ? (te ? 'అంగీకరించారు' : 'Accepted')
                                : c.author_resolution === 'deferred' ? (te ? 'తర్వాత' : 'Deferred')
                                  : (te ? 'వద్దు' : 'Declined')}
                            </span>
                          ) : (
                            <>
                              <button type="button" className="rpv2-chip" disabled={busyComment === c.id}
                                onClick={() => { void resolveComment(c.id!, 'accepted'); }}>
                                {te ? 'అంగీకరించు' : 'Accept'}
                              </button>
                              <button type="button" className="rpv2-chip" disabled={busyComment === c.id}
                                onClick={() => { void resolveComment(c.id!, 'deferred'); }}>
                                {te ? 'తర్వాత' : 'Defer'}
                              </button>
                              <button type="button" className="rpv2-chip" disabled={busyComment === c.id}
                                onClick={() => { void resolveComment(c.id!, 'rejected'); }}>
                                {te ? 'వద్దు' : 'Decline'}
                              </button>
                            </>
                          )}
                        </div>
                        <span className="rpv2-reply-hint" lang={te ? 'te' : undefined}>
                          {te ? 'సమీక్షకుడికి రిప్లై చేయండి' : `Reply to reviewer · ${THREAD_MENTION_REVIEWER}`}
                        </span>
                        <textarea
                          className="rpv2-reply-box"
                          rows={2}
                          value={replyDrafts[c.id] || ''}
                          onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [c.id!]: e.target.value }))}
                          placeholder={te ? 'మీ సవరణ ప్రణాళికను వివరించండి…' : 'Clarify your revision plan…'}
                          lang={te ? 'te' : undefined}
                        />
                        <button
                          type="button"
                          className="rpv2-reply-send"
                          disabled={busyComment === c.id || !(replyDrafts[c.id] || '').trim()}
                          onClick={() => { void sendReply(c.id!); }}
                        >
                          {te ? 'పంపండి' : 'Send'}
                        </button>
                        {!(replyDrafts[c.id] || '').trim() && (
                          <span className="rpv2-reply-hint">
                            {te ? 'పంపడానికి రిప్లై రాయండి' : 'Write a reply to enable Send'}
                          </span>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {appealPending && (
            <p className="rpv2-waiting-hint">
              <Gavel size={14} aria-hidden /> {te ? 'మీ అప్పీల్ పరిశీలనలో ఉంది.' : 'Your appeal is under review.'}
            </p>
          )}

          {canAppeal && (
            <div style={{ marginTop: 12 }}>
              <textarea
                className="rpv2-reply-box"
                rows={2}
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                placeholder={te ? 'ప్రక్రియ సమస్యను వివరించండి (10+ అక్షరాలు)…' : 'Describe the procedural concern (10+ characters)…'}
              />
              <button
                type="button"
                className="rpv2-reply-send"
                disabled={lifecycleBusy || appealReason.trim().length < 10}
                onClick={async () => {
                  if (appealReason.trim().length < 10) return;
                  setLifecycleBusy(true);
                  try {
                    await platformApi.submitPeerReviewAppeal(request.id, appealReason.trim());
                    setAppealReason('');
                    onResolve?.();
                  } finally {
                    setLifecycleBusy(false);
                  }
                }}
              >
                <Gavel size={12} aria-hidden /> {te ? 'అప్పీల్ సమర్పించండి' : 'Submit appeal'}
              </button>
            </div>
          )}

          {showLifecycle && (canAcknowledge || canResubmit) && (
            <div style={{ marginTop: 14 }}>
              {canAcknowledge && (
                <div>
                  <p className="rpv2-reply-hint">{te ? 'ఈ సమీక్ష ఎంత ఉపయోగపడింది?' : 'How helpful was this review?'}</p>
                  <div style={{ display: 'flex', gap: 6, margin: '6px 0' }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className="rpv2-chip"
                        aria-pressed={satisfactionRating === n}
                        onClick={() => setSatisfactionRating(n)}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="rpv2-queue-cta"
                    disabled={lifecycleBusy}
                    onClick={async () => {
                      setLifecycleBusy(true);
                      try {
                        await platformApi.acknowledgePeerReview(request.id, satisfactionRating ?? undefined);
                        setSatisfactionRating(null);
                        onResolve?.();
                      } finally {
                        setLifecycleBusy(false);
                      }
                    }}
                  >
                    {te ? 'సమీక్ష పూర్తి' : 'Mark review complete'}
                  </button>
                </div>
              )}
              {canResubmit && (
                <div style={{ marginTop: 10 }}>
                  <textarea
                    className="rpv2-reply-box"
                    rows={2}
                    value={revisionNotes}
                    onChange={(e) => setRevisionNotes(e.target.value)}
                    placeholder={te ? 'మీరు మార్చినవి సంక్షిప్తంగా…' : 'Summarize what you changed…'}
                  />
                  <button
                    type="button"
                    className="rpv2-reply-send"
                    disabled={lifecycleBusy}
                    onClick={async () => {
                      setLifecycleBusy(true);
                      try {
                        await platformApi.resubmitPeerReview(request.id, revisionNotes.trim() || undefined);
                        setRevisionNotes('');
                        onResolve?.();
                      } finally {
                        setLifecycleBusy(false);
                      }
                    }}
                  >
                    {te ? `మళ్లీ సమర్పించండి (${(request.revision_round ?? 0) + 1}/${MAX_REVISION_ROUNDS})` : `Resubmit (${(request.revision_round ?? 0) + 1}/${MAX_REVISION_ROUNDS})`}
                  </button>
                </div>
              )}
            </div>
          )}

          {request.story_id && !isDemo && (
            <Link to={`/stories/${request.story_id}`} className="rpv2-inbox-action" style={{ marginTop: 12 }}>
              <BookOpen size={14} aria-hidden /> {te ? 'మాన్యుస్క్రిప్ట్ తెరవండి' : 'Open manuscript to revise'}
            </Link>
          )}
          {isDemo && (
            <p className="rpv2-demo-note" lang={te ? 'te' : undefined}>
              {te
                ? 'నమూనా మాన్యుస్క్రిప్ట్ — మీ సొంత కథను సమీక్షకు అభ్యర్థించినప్పుడు నేరుగా ఎడిటర్‌లోకి వెళ్తారు.'
                : 'Demo manuscript — link your own story when requesting a review to jump into the editor.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function statusLabel(s: string) {
  return s.replace(/_/g, ' ');
}

function ReviewerSummaryBlock({
  slot,
  summary,
  te,
}: {
  slot: string;
  summary?: ReviewSubmissionSummary;
  te: boolean;
}) {
  if (!summary?.overall_review && !summary?.strengths && !summary?.weaknesses) return null;

  const slotNum = slot.replace('slot-', '#');
  const decision = decisionLabel(summary.majority_decision);

  return (
    <article className="rpv2-summary" lang={/[\u0C00-\u0C7F]/.test(summary.overall_review || '') ? 'te' : undefined}>
      <div className="rpv2-summary__head">
        <h6>{te ? `మండలి సమీక్షకుడు ${slotNum}` : `Council reviewer ${slotNum}`}</h6>
        {decision && <span className="rpv2-summary__decision">{decision}</span>}
      </div>
      {summary.overall_review && (
        <p className="rpv2-summary__overall">{summary.overall_review}</p>
      )}
      <div className="rpv2-summary__grid">
        {summary.strengths && (
          <div>
            <span className="rpv2-summary__label">{te ? 'బలాలు' : 'Strengths'}</span>
            <p>{summary.strengths}</p>
          </div>
        )}
        {summary.weaknesses && (
          <div>
            <span className="rpv2-summary__label">{te ? 'మెరుగుపరచాల్సినవి' : 'Areas to refine'}</span>
            <p>{summary.weaknesses}</p>
          </div>
        )}
      </div>
      {summary.recommendation && (
        <p className="rpv2-summary__overall">
          <strong>{te ? 'సూచన:' : 'Recommendation:'}</strong> {summary.recommendation}
        </p>
      )}
    </article>
  );
}
