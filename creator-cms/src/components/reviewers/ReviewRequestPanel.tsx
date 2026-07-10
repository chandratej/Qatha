import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, BookOpen, CheckCircle2, IndianRupee, Users } from 'lucide-react';
import { platformApi } from '../../lib/platformApi';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { REVIEW_PACKAGE, REVIEWER_ROLES } from '../../lib/platformConstants';
import { reviewerPayoutEach } from '../../business/reviewerMatching';
import { trackCreatorEvent } from '../../lib/analyticsEvents';

interface Props {
  onRequested: () => void;
}

const FEE_OPTIONS = [REVIEW_PACKAGE.minFeeInr, 169, REVIEW_PACKAGE.maxFeeInr];

export function ReviewRequestPanel({ onRequested }: Props) {
  const { user } = useAuth();
  const authorId = user?.id || 'anonymous-creator';

  const [stories, setStories] = useState<Array<{ id: string; title: string }>>([]);
  const [storyId, setStoryId] = useState('');
  const [mode, setMode] = useState<'paid' | 'volunteer'>('paid');
  const [fee, setFee] = useState<number>(REVIEW_PACKAGE.minFeeInr);
  const [preferredRoles, setPreferredRoles] = useState<string[]>([]);
  const [poolAvailable, setPoolAvailable] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    api.getCreatorStories()
      .then((r) => {
        const list = (r.stories || []).map((s) => ({ id: s.id, title: s.title }));
        setStories(list);
        if (list[0]) setStoryId(list[0].id);
      })
      .catch(() => setStories([]));

    platformApi.getReviewerPoolSummary().then((s) => setPoolAvailable(s.available));
  }, []);

  const payoutEach = useMemo(
    () => (mode === 'paid' ? reviewerPayoutEach(fee) : 0),
    [mode, fee],
  );

  const toggleRole = (roleId: string) => {
    setPreferredRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((r) => r !== roleId)
        : prev.length < 3
          ? [...prev, roleId]
          : prev,
    );
  };

  const handleSubmit = async () => {
    const story = stories.find((s) => s.id === storyId);
    if (!story) {
      setError('Choose a story from your library');
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await platformApi.requestPeerReview({
        authorId,
        storyId: story.id,
        storyTitle: story.title,
        mode,
        packageFeeInr: mode === 'paid' ? fee : 0,
        preferredRoles,
        markPaid: mode === 'paid',
      });
      trackCreatorEvent('peer_review_requested', {
        story_id: story.id,
        mode,
        fee: result.request.package_fee_inr,
        reviewers_matched: result.request.reviewers_matched,
      });
      setSuccess(
        mode === 'paid'
          ? `Review requested! ₹${fee} held — ${result.request.reviewers_matched} anonymous reviewers matched (₹${result.payoutEach} each).`
          : `Volunteer review queued — ${result.request.reviewers_matched} beta readers matched anonymously.`,
      );
      platformApi.getReviewerPoolSummary().then((s) => setPoolAvailable(s.available));
      onRequested();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not request review');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="cms-panel review-request-panel" aria-labelledby="review-request-title">
      <h3 id="review-request-title" className="dashboard-panel__title">
        <BookOpen size={18} aria-hidden /> Request a review
      </h3>
      <p className="input-hint review-request-panel__intro">
        Three anonymous reviewers · majority decision · equal payouts. Your manuscript identity stays private until decision.
      </p>

      <div className="review-request-panel__pool" role="status">
        <Users size={16} aria-hidden />
        <span><strong>{poolAvailable}</strong> reviewers available in pool now</span>
      </div>

      {success && (
        <div className="event-status-banner" role="status">
          <p className="event-status-banner__text">
            <CheckCircle2 size={18} aria-hidden className="event-status-banner__icon" />
            <span>{success}</span>
          </p>
        </div>
      )}
      {error && (
        <div className="event-status-banner event-status-banner--error" role="alert">
          <p className="event-status-banner__text">
            <AlertCircle size={18} aria-hidden className="event-status-banner__icon" />
            <span>{error}</span>
          </p>
        </div>
      )}

      {stories.length === 0 ? (
        <p className="input-hint">
          No manuscripts yet.{' '}
          <Link to="/stories/new">Create a story</Link> then return to request peer review.
        </p>
      ) : (
        <div className="review-request-form">
          <div className="input-group">
            <label htmlFor="review-story">Manuscript</label>
            <select
              id="review-story"
              className="cms-select"
              value={storyId}
              onChange={(e) => setStoryId(e.target.value)}
            >
              {stories.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>

          <fieldset className="review-request-form__mode">
            <legend>Review mode</legend>
            <label className="review-mode-option">
              <input
                type="radio"
                name="review-mode"
                checked={mode === 'paid'}
                onChange={() => setMode('paid')}
              />
              <span>
                <strong>Premium peer review</strong>
                <span className="input-hint">₹{REVIEW_PACKAGE.minFeeInr}–₹{REVIEW_PACKAGE.maxFeeInr} · paid experts</span>
              </span>
            </label>
            <label className="review-mode-option">
              <input
                type="radio"
                name="review-mode"
                checked={mode === 'volunteer'}
                onChange={() => setMode('volunteer')}
              />
              <span>
                <strong>Volunteer beta read</strong>
                <span className="input-hint">Free · community beta readers</span>
              </span>
            </label>
          </fieldset>

          {mode === 'paid' && (
            <div className="input-group">
              <label htmlFor="review-fee">
                <IndianRupee size={14} aria-hidden style={{ verticalAlign: 'middle' }} /> Package fee
              </label>
              <select
                id="review-fee"
                className="cms-select"
                value={fee}
                onChange={(e) => setFee(Number(e.target.value))}
              >
                {FEE_OPTIONS.map((f) => (
                  <option key={f} value={f}>₹{f} · reviewers earn ₹{reviewerPayoutEach(f)} each</option>
                ))}
              </select>
              <span className="input-hint">
                Platform keeps {REVIEW_PACKAGE.platformCommissionPct}% · remainder split equally among {REVIEW_PACKAGE.reviewerCount} reviewers
              </span>
            </div>
          )}

          <div className="input-group">
            <span className="label">Preferred specializations (optional, max 3)</span>
            <div className="review-role-chips" role="group" aria-label="Reviewer specializations">
              {REVIEWER_ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`studio-chip review-role-chip${preferredRoles.includes(r.id) ? ' review-role-chip--on' : ''}`}
                  aria-pressed={preferredRoles.includes(r.id)}
                  onClick={() => toggleRole(r.id)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="review-request-form__summary">
            {mode === 'paid' ? (
              <p className="input-hint">
                You pay <strong>₹{fee}</strong> · each reviewer earns <strong>₹{payoutEach}</strong>
              </p>
            ) : (
              <p className="input-hint">Free volunteer queue · typical turnaround 3–5 days</p>
            )}
          </div>

          <button
            type="button"
            className="katha-cta katha-cta--maroon"
            disabled={busy || !storyId || poolAvailable < REVIEW_PACKAGE.reviewerCount}
            onClick={() => { void handleSubmit(); }}
          >
            {busy
              ? 'Matching reviewers…'
              : mode === 'paid'
                ? `Request premium review · ₹${fee}`
                : 'Request volunteer beta read'}
          </button>
        </div>
      )}
    </section>
  );
}