import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, BookOpen, CheckCircle2, IndianRupee, Users } from 'lucide-react';
import { platformApi } from '../../lib/platformApi';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  GENRE_SPECIALIZATIONS,
  PROFESSIONAL_REVIEW_ROLES,
  REVIEW_PACKAGE,
  REVIEWER_ROLES,
  trustLevelForReaders,
} from '../../lib/platformConstants';
import { checkPaidReviewEligibility } from '../../business/literaryCouncil';
import { reviewerPayoutEach } from '../../business/reviewerMatching';
import { trackCreatorEvent } from '../../lib/analyticsEvents';

interface Props {
  onRequested: () => void;
}

interface StoryOption {
  id: string;
  title: string;
  genre?: string;
  total_readers?: number;
}

const FEE_OPTIONS = [REVIEW_PACKAGE.minFeeInr, 169, REVIEW_PACKAGE.maxFeeInr];

export function ReviewRequestPanel({ onRequested }: Props) {
  const { user } = useAuth();
  const authorId = user?.id || 'anonymous-creator';

  const [stories, setStories] = useState<StoryOption[]>([]);
  const [storyId, setStoryId] = useState('');
  const [mode, setMode] = useState<'paid' | 'volunteer'>('volunteer');
  const [fee, setFee] = useState<number>(REVIEW_PACKAGE.minFeeInr);
  const [professionalRole, setProfessionalRole] = useState('literary_reviewer');
  const [storyGenre, setStoryGenre] = useState('romance');
  const [preferredRoles, setPreferredRoles] = useState<string[]>([]);
  const [poolAvailable, setPoolAvailable] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedStory = stories.find((s) => s.id === storyId);
  const totalReaders = selectedStory?.total_readers ?? 0;
  const authorTrust = trustLevelForReaders(totalReaders);
  const paidEligibility = useMemo(
    () => checkPaidReviewEligibility({
      verifiedAuthor: Boolean(user?.id),
      storyTrustLevel: authorTrust,
      totalReaders,
    }),
    [user?.id, authorTrust, totalReaders],
  );

  useEffect(() => {
    api.getCreatorStories()
      .then((r) => {
        const list = (r.stories || []).map((s) => ({
          id: s.id,
          title: s.title,
          genre: s.genre,
          total_readers: s.total_readers,
        }));
        setStories(list);
        if (list[0]) {
          setStoryId(list[0].id);
          if (list[0].genre) {
            const g = list[0].genre.toLowerCase().replace(/\s+/g, '_');
            if (GENRE_SPECIALIZATIONS.some((x) => x.id === g)) setStoryGenre(g);
          }
        }
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
    if (mode === 'paid' && !paidEligibility.eligible) {
      setError(paidEligibility.reasons.join(' · '));
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
        professionalRole,
        storyGenre,
        authorTrustLevel: authorTrust,
        authorVerified: Boolean(user?.id),
        totalReaders,
        markPaid: mode === 'paid',
      });
      trackCreatorEvent('peer_review_requested', {
        story_id: story.id,
        mode,
        fee: result.request.package_fee_inr,
        reviewers_matched: result.request.reviewers_matched,
        matching_score: result.matchingAvgScore,
        professional_role: professionalRole,
      });
      setSuccess(
        mode === 'paid'
          ? `Literary Council matched ${result.request.reviewers_matched} anonymous reviewers (avg match ${result.matchingAvgScore}%). ₹${fee} in escrow — double-blind review begins.`
          : `Community review queued — ${result.request.reviewers_matched} volunteer readers matched (match score ${result.matchingAvgScore}%). New reviewers start here.`,
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
        <BookOpen size={18} aria-hidden /> Request professional literary feedback
      </h3>
      <p className="input-hint review-request-panel__intro">
        Double-blind matching · evidence-based structured comments · reviews improve stories, not reject them.
      </p>

      <div className="review-request-panel__pool" role="status">
        <Users size={16} aria-hidden />
        <span><strong>{poolAvailable}</strong> council reviewers available · escrow protected</span>
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
          <Link to="/stories/new">Create a story</Link> then return for Literary Council review.
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

          <div className="input-group">
            <label htmlFor="professional-role">Professional role</label>
            <select
              id="professional-role"
              className="cms-select"
              value={professionalRole}
              onChange={(e) => setProfessionalRole(e.target.value)}
            >
              {PROFESSIONAL_REVIEW_ROLES.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
            <span className="input-hint">
              {PROFESSIONAL_REVIEW_ROLES.find((r) => r.id === professionalRole)?.dimensions.join(', ').replace(/_/g, ' ')}
            </span>
          </div>

          <div className="input-group">
            <label htmlFor="story-genre">Genre expertise</label>
            <select
              id="story-genre"
              className="cms-select"
              value={storyGenre}
              onChange={(e) => setStoryGenre(e.target.value)}
            >
              {GENRE_SPECIALIZATIONS.map((g) => (
                <option key={g.id} value={g.id}>{g.label}</option>
              ))}
            </select>
          </div>

          <fieldset className="review-request-form__mode">
            <legend>Review mode</legend>
            <label className="review-mode-option">
              <input
                type="radio"
                name="review-mode"
                checked={mode === 'volunteer'}
                onChange={() => setMode('volunteer')}
              />
              <span>
                <strong>Community review (free)</strong>
                <span className="input-hint">New reviewers start here · volunteer beta readers</span>
              </span>
            </label>
            <label className="review-mode-option">
              <input
                type="radio"
                name="review-mode"
                checked={mode === 'paid'}
                onChange={() => setMode('paid')}
                disabled={!paidEligibility.eligible}
              />
              <span>
                <strong>Professional review (paid)</strong>
                <span className="input-hint">
                  ₹{REVIEW_PACKAGE.minFeeInr}–₹{REVIEW_PACKAGE.maxFeeInr} · verified author + Story Trust required
                </span>
              </span>
            </label>
            {mode === 'paid' && !paidEligibility.eligible && (
              <p className="input-hint cms-error-text" style={{ margin: 0 }}>
                {paidEligibility.reasons.join(' · ')}
              </p>
            )}
          </fieldset>

          {mode === 'paid' && paidEligibility.eligible && (
            <div className="input-group">
              <label htmlFor="review-fee">
                <IndianRupee size={14} aria-hidden style={{ verticalAlign: 'middle' }} /> Escrow fee
              </label>
              <select
                id="review-fee"
                className="cms-select"
                value={fee}
                onChange={(e) => setFee(Number(e.target.value))}
              >
                {FEE_OPTIONS.map((f) => (
                  <option key={f} value={f}>₹{f} · reviewers earn ₹{reviewerPayoutEach(f)} each (quarterly payout)</option>
                ))}
              </select>
            </div>
          )}

          <div className="input-group">
            <span className="label">Additional specializations (optional, max 3)</span>
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
            {mode === 'paid' && paidEligibility.eligible ? (
              <p className="input-hint">
                Escrow <strong>₹{fee}</strong> · {REVIEW_PACKAGE.reviewerCount} reviewers · <strong>₹{payoutEach}</strong> each after validation
              </p>
            ) : (
              <p className="input-hint">Free community path · builds reviewer reputation toward paid eligibility</p>
            )}
          </div>

          <button
            type="button"
            className="katha-cta katha-cta--maroon"
            disabled={busy || !storyId || poolAvailable < REVIEW_PACKAGE.reviewerCount}
            onClick={() => { void handleSubmit(); }}
          >
            {busy
              ? 'Running matching engine…'
              : mode === 'paid'
                ? `Request professional review · ₹${fee}`
                : 'Request community review (free)'}
          </button>
        </div>
      )}
    </section>
  );
}