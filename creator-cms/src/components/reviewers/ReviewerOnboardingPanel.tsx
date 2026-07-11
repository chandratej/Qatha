import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, GraduationCap, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { ReviewerOnboardingRecord } from '../../lib/reviewerOnboarding';
import { platformApi } from '../../lib/platformApi';
import { GENRE_SPECIALIZATIONS } from '../../lib/platformConstants';

export function ReviewerOnboardingPanel() {
  const { user } = useAuth();
  const userId = user?.id || 'anonymous-creator';
  const [record, setRecord] = useState<ReviewerOnboardingRecord | null>(null);
  const [genres, setGenres] = useState<string[]>([]);
  const [motivation, setMotivation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const { record: next } = await platformApi.getReviewerOnboarding(userId);
      setRecord(next);
      setGenres(next.genres);
      setMotivation(next.motivation);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load onboarding status');
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleGenre = (id: string) => {
    setGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : prev.length < 3 ? [...prev, id] : prev,
    );
  };

  const handleApply = async () => {
    setBusy(true);
    setError(null);
    try {
      const { record: next } = await platformApi.applyReviewerOnboarding(userId, {
        genres,
        languages: ['telugu', 'english'],
        motivation: motivation.trim(),
      });
      setRecord(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Application failed');
    } finally {
      setBusy(false);
    }
  };

  const handleTraining = async () => {
    setBusy(true);
    setError(null);
    try {
      const { record: next } = await platformApi.certifyReviewerOnboarding(userId);
      setRecord(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Certification failed');
    } finally {
      setBusy(false);
    }
  };

  if (!record) {
    return (
      <section className="reviewer-onboarding" aria-busy="true">
        <p className="input-hint">Loading reviewer onboarding…</p>
      </section>
    );
  }

  if (record.status === 'pending_moderation') {
    return (
      <section className="reviewer-onboarding reviewer-onboarding--done" aria-labelledby="onboard-pending-title">
        <GraduationCap size={22} aria-hidden />
        <div>
          <h3 id="onboard-pending-title">Training complete — awaiting council review</h3>
          <p className="input-hint">
            A Literary Council moderator will review your motivation and genre expertise. You&apos;ll be notified when approved.
          </p>
        </div>
      </section>
    );
  }

  if (record.status === 'certified') {
    return (
      <section className="reviewer-onboarding reviewer-onboarding--done" aria-labelledby="onboard-done-title">
        <CheckCircle2 size={22} aria-hidden />
        <div>
          <h3 id="onboard-done-title">You&apos;re certified in the Reviewer Pool</h3>
          <p className="input-hint">Switch to the Review tab to accept assignments and open Review Studio.</p>
        </div>
      </section>
    );
  }

  if (record.status === 'suspended') {
    return (
      <section className="reviewer-onboarding" aria-labelledby="onboard-suspended-title">
        <h3 id="onboard-suspended-title">Application not approved</h3>
        <p className="input-hint">Contact support if you believe this was a mistake.</p>
      </section>
    );
  }

  return (
    <section className="reviewer-onboarding" aria-labelledby="onboard-title">
      <header className="reviewer-onboarding__head">
        <GraduationCap size={20} aria-hidden />
        <div>
          <h3 id="onboard-title">Join the Reviewer Pool</h3>
          <p className="reviewer-onboarding__intro">
            Apply to review stories with structured, respectful craft feedback. PRD path: apply → training → certification.
          </p>
        </div>
      </header>

      {error && (
        <p className="input-hint" role="alert" style={{ color: 'var(--katha-danger, #b42318)' }}>
          {error}
        </p>
      )}

      {record.status === 'not_applied' && (
        <div className="reviewer-onboarding__form">
          <label className="reviewer-onboarding__field">
            <span>Genre expertise (max 3)</span>
            <div className="review-role-chips" role="group">
              {GENRE_SPECIALIZATIONS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={`studio-chip review-role-chip${genres.includes(g.id) ? ' review-role-chip--on' : ''}`}
                  onClick={() => toggleGenre(g.id)}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </label>
          <label className="reviewer-onboarding__field">
            <span>Why do you want to review?</span>
            <textarea
              className="rw-textarea"
              rows={3}
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              placeholder="Share your literary background and what you hope to contribute…"
            />
          </label>
          <button
            type="button"
            className="katha-cta katha-cta--maroon"
            disabled={busy || genres.length === 0 || motivation.trim().length < 20}
            onClick={() => void handleApply()}
          >
            {busy ? 'Submitting…' : 'Apply to Reviewer Pool'}
          </button>
        </div>
      )}

      {(record.status === 'applied' || record.status === 'training') && !record.trainingCompleted && (
        <div className="reviewer-onboarding__training">
          <Sparkles size={18} aria-hidden />
          <div>
            <h4>Complete reviewer training</h4>
            <p className="input-hint">
              Learn double-blind etiquette, evidence-based notes, and Telugu craft sensitivity. (~5 min demo module)
            </p>
            <ul className="reviewer-onboarding__checklist">
              <li>Constructive tone — improve stories, never gatekeep</li>
              <li>Anchor every note to a passage</li>
              <li>Respect author voice and regional language</li>
              <li>Council decision maps to clear next steps</li>
            </ul>
            <button
              type="button"
              className="katha-cta katha-cta--maroon"
              disabled={busy}
              onClick={() => void handleTraining()}
            >
              {busy ? '…' : 'Complete training & get certified'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}