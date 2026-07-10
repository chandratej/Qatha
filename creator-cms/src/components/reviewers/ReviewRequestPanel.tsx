import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, BookOpen, CheckCircle2, ChevronDown, IndianRupee, Users } from 'lucide-react';
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
import {
  buildReviewManuscriptOptions,
  type ReviewManuscriptOption,
} from '../../lib/reviewManuscriptOptions';
import {
  appendDevManuscriptOptions,
  devPaidReviewEligible,
  isReviewDevSandbox,
} from '../../lib/reviewDevSandbox';

interface Props {
  onRequested: () => void;
}

const FEE_OPTIONS = [REVIEW_PACKAGE.minFeeInr, 169, REVIEW_PACKAGE.maxFeeInr];

export function ReviewRequestPanel({ onRequested }: Props) {
  const { user, isMockMode } = useAuth();
  const authorId = user?.id || 'anonymous-creator';

  const [stories, setStories] = useState<ReviewManuscriptOption[]>([]);
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
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const selectedStory = stories.find((s) => s.id === storyId);
  const totalReaders = selectedStory?.total_readers ?? 0;
  const authorTrust = trustLevelForReaders(totalReaders);
  const paidEligibility = useMemo(() => {
    if (devPaidReviewEligible(Boolean(user?.id))) {
      return { eligible: true, reasons: [] as string[] };
    }
    return checkPaidReviewEligibility({
      verifiedAuthor: Boolean(user?.id),
      storyTrustLevel: authorTrust,
      totalReaders,
    });
  }, [user?.id, authorTrust, totalReaders]);

  useEffect(() => {
    api.getCreatorStories()
      .then((r) => {
        const fetched = (r.stories || []).map((s) => ({
          id: s.id,
          title: s.title,
          genre: s.genre,
          total_readers: s.total_readers,
        }));
        let list = buildReviewManuscriptOptions(fetched, {
          includeDemoWhenEmpty: true,
          alwaysIncludeDemo: isMockMode || isReviewDevSandbox(),
        });
        list = appendDevManuscriptOptions(list);
        setStories(list);
        if (list[0]) {
          setStoryId(list[0].id);
          if (list[0].genre) {
            const g = list[0].genre.toLowerCase().replace(/\s+/g, '_');
            if (GENRE_SPECIALIZATIONS.some((x) => x.id === g)) setStoryGenre(g);
          }
        }
      })
      .catch(() => {
        let list = buildReviewManuscriptOptions([], { includeDemoWhenEmpty: true });
        list = appendDevManuscriptOptions(list);
        setStories(list);
        if (list[0]) setStoryId(list[0].id);
      });

    platformApi.getReviewerPoolSummary().then((s) => setPoolAvailable(s.available));
  }, [isMockMode]);

  const refreshPool = () => {
    platformApi.getReviewerPoolSummary().then((s) => setPoolAvailable(s.available));
  };

  useEffect(() => {
    if (!isReviewDevSandbox()) return;
    refreshPool();
    const t = window.setInterval(refreshPool, 5000);
    return () => window.clearInterval(t);
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
      setError('Choose a manuscript');
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
      await platformApi.prepareReviewRequest(authorId, story.id);
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
          ? `Matched ${result.request.reviewers_matched} reviewers (avg ${result.matchingAvgScore}%). ₹${fee} in escrow.`
          : `Community review queued — ${result.request.reviewers_matched} readers matched (${result.matchingAvgScore}%).`,
      );
      platformApi.getReviewerPoolSummary().then((s) => setPoolAvailable(s.available));
      onRequested();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not request review';
      setError(msg);
      requestAnimationFrame(() => {
        document.getElementById('review-request-error')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const story = stories.find((s) => s.id === storyId);
    if (!story?.genre) return;
    const g = story.genre.toLowerCase().replace(/\s+/g, '_');
    if (GENRE_SPECIALIZATIONS.some((x) => x.id === g)) {
      setStoryGenre(g);
    }
  }, [storyId, stories]);

  return (
    <section className="cms-panel review-request-panel review-request-panel--calm" aria-labelledby="review-request-title">
      <h3 id="review-request-title" className="review-request-panel__title">
        <BookOpen size={18} aria-hidden /> Request feedback
      </h3>
      <p className="review-request-panel__intro">
        Double-blind · respectful · evidence-based. Choose a manuscript and we match reviewers.
      </p>

      {success && (
        <div className="event-status-banner" role="status">
          <p className="event-status-banner__text">
            <CheckCircle2 size={18} aria-hidden className="event-status-banner__icon" />
            <span>{success}</span>
          </p>
        </div>
      )}
      {error && (
        <div id="review-request-error" className="event-status-banner event-status-banner--error" role="alert">
          <p className="event-status-banner__text">
            <AlertCircle size={18} aria-hidden className="event-status-banner__icon" />
            <span>{error}</span>
          </p>
        </div>
      )}

      {stories.length === 0 ? (
        <p className="input-hint">
          No manuscripts yet.{' '}
          <Link to="/stories/new">Create a story</Link> first.
        </p>
      ) : (
        <div className="review-request-form review-request-form--calm">
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
            {selectedStory?.isDemo && (
              <span className="input-hint">Demo manuscript for trying the review loop locally.</span>
            )}
          </div>

          <fieldset className="review-request-form__mode review-request-form__mode--cards">
            <legend className="sr-only">Review mode</legend>
            <label className={`review-mode-card${mode === 'volunteer' ? ' review-mode-card--on' : ''}`}>
              <input
                type="radio"
                name="review-mode"
                checked={mode === 'volunteer'}
                onChange={() => setMode('volunteer')}
              />
              <span className="review-mode-card__title">Community (free)</span>
              <span className="review-mode-card__hint">Volunteer beta readers</span>
            </label>
            <label className={`review-mode-card${mode === 'paid' ? ' review-mode-card--on' : ''}${!paidEligibility.eligible ? ' review-mode-card--disabled' : ''}`}>
              <input
                type="radio"
                name="review-mode"
                checked={mode === 'paid'}
                onChange={() => setMode('paid')}
                disabled={!paidEligibility.eligible}
              />
              <span className="review-mode-card__title">Professional (paid)</span>
              <span className="review-mode-card__hint">
                ₹{REVIEW_PACKAGE.minFeeInr}–₹{REVIEW_PACKAGE.maxFeeInr}
              </span>
            </label>
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
                  <option key={f} value={f}>₹{f} · reviewers earn ₹{reviewerPayoutEach(f)} each</option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            className="katha-cta katha-cta--maroon review-request-form__submit"
            disabled={busy || !storyId}
            onClick={() => { void handleSubmit(); }}
          >
            {busy
              ? 'Matching reviewers…'
              : mode === 'paid'
                ? `Request professional review · ₹${fee}`
                : 'Request community review'}
          </button>

          <p className="review-request-panel__pool" role="status">
            <Users size={14} aria-hidden />
            <span>{poolAvailable} reviewers available</span>
            {mode === 'paid' && paidEligibility.eligible && (
              <span> · ₹{payoutEach} each after validation</span>
            )}
          </p>

          <button
            type="button"
            className="review-request-advanced"
            onClick={() => setAdvancedOpen((v) => !v)}
            aria-expanded={advancedOpen}
          >
            Customize matching
            <ChevronDown size={14} className={`review-request-advanced__chevron${advancedOpen ? ' review-request-advanced__chevron--open' : ''}`} aria-hidden />
          </button>

          {advancedOpen && (
            <div className="review-request-advanced__body">
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

              <div className="input-group">
                <span className="label">Specializations (max 3)</span>
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
            </div>
          )}
        </div>
      )}
    </section>
  );
}