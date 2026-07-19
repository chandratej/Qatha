import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, GraduationCap, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { ReviewerOnboardingRecord } from '../../lib/reviewerOnboarding';
import { platformApi } from '../../lib/platformApi';
import { GENRE_SPECIALIZATIONS } from '../../lib/platformConstants';
import { TrialReviewPanel } from './TrialReviewPanel';
import {
  CURRENT_REVIEWER_AGREEMENT_VERSION,
  REVIEWER_AGREEMENT_SUMMARY,
} from '../../../../packages/shared/reviewerAgreement';
import { useLocale } from '../../context/LocaleContext';

/** Apply card — matches katha_reviewer_pool_join_v2.html */
export function ReviewerOnboardingPanel() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const te = locale === 'te';
  const userId = user?.id || 'anonymous-creator';
  const [record, setRecord] = useState<ReviewerOnboardingRecord | null>(null);
  const [genres, setGenres] = useState<string[]>([]);
  const [motivation, setMotivation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreementAccepted, setAgreementAccepted] = useState(false);

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
        agreement_accepted: agreementAccepted,
        agreement_version: CURRENT_REVIEWER_AGREEMENT_VERSION,
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
      const { record: next } = await platformApi.completeReviewerTrainingOnboarding(userId);
      setRecord(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Training step failed');
    } finally {
      setBusy(false);
    }
  };

  const handleTrialSubmit = async (payload: {
    strengths: string;
    weaknesses: string;
    suggestion: string;
    rubric_scores: Record<string, number>;
  }) => {
    setBusy(true);
    setError(null);
    try {
      const { record: next } = await platformApi.submitTrialReviewOnboarding(userId, payload);
      setRecord(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Trial review failed');
    } finally {
      setBusy(false);
    }
  };

  if (!record) {
    return (
      <section className="rpv2-apply" aria-busy="true">
        <p className="rpv2-waiting-hint">{te ? 'లోడ్…' : 'Loading…'}</p>
      </section>
    );
  }

  if (record.status === 'pending_moderation') {
    return (
      <section className="rpv2-apply" aria-labelledby="onboard-pending-title">
        <div className="rpv2-apply__head">
          <GraduationCap size={22} aria-hidden />
          <div>
            <h3 id="onboard-pending-title" lang={te ? 'te' : undefined}>
              {te ? 'ట్రయల్ సమీక్ష సమర్పించబడింది — మండలి పరిశీలనలో' : 'Trial review submitted — awaiting council review'}
            </h3>
            <p className="rpv2-apply__intro" lang={te ? 'te' : undefined}>
              {te
                ? 'మండలి మోడరేటర్ మీ ట్రయల్ అభిప్రాయాన్ని చూస్తారు. ఆమోదించినప్పుడు తెలియజేస్తాము.'
                : "A Literary Council moderator will review your trial feedback. You'll be notified when approved."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (record.status === 'certified') {
    return (
      <section className="rpv2-apply" aria-labelledby="onboard-done-title">
        <div className="rpv2-apply__head">
          <CheckCircle2 size={22} aria-hidden />
          <div>
            <h3 id="onboard-done-title" lang={te ? 'te' : undefined}>
              {te ? 'మీరు రివ్యూయర్ పూల్‌లో ధృవీకరించబడ్డారు' : "You're certified in the Reviewer Pool"}
            </h3>
            <p className="rpv2-apply__intro" lang={te ? 'te' : undefined}>
              {te
                ? 'సమీక్ష ట్యాబ్‌కి వెళ్లి అసైన్‌మెంట్‌లు అంగీకరించండి.'
                : 'Switch to the Review tab to accept assignments and open Review Studio.'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (record.status === 'suspended') {
    return (
      <section className="rpv2-apply">
        <h3 lang={te ? 'te' : undefined}>{te ? 'దరఖాస్తు ఆమోదం కాలేదు' : 'Application not approved'}</h3>
        <p className="rpv2-apply__intro">{te ? 'తప్పు అనిపిస్తే సపోర్ట్‌ని సంప్రదించండి.' : 'Contact support if you believe this was a mistake.'}</p>
      </section>
    );
  }

  const needs: string[] = [];
  if (genres.length === 0) needs.push(te ? 'కనీసం 1 జానర్ ఎంచుకోండి' : 'select at least 1 genre');
  else if (genres.length < 1) needs.push(te ? '1 జానర్ మరింత ఎంచుకోండి' : 'select 1 more genre');
  // Prototype shows "1 more genre" when only 2 selected if max is 3 optional - we require at least 1
  if (motivation.trim().length < 20) {
    const left = 20 - motivation.trim().length;
    needs.push(te ? `కారణం రాయండి (${left} అక్షరాలు మరిన్ని)` : `write a reason (${left} more characters)`);
  }
  if (!agreementAccepted) needs.push(te ? 'ఒప్పందాన్ని అంగీకరించండి' : 'accept the agreement');
  const canApply = !busy && needs.length === 0;

  return (
    <section className="rpv2-apply" aria-labelledby="onboard-title">
      <div className="rpv2-apply__head">
        <GraduationCap size={22} aria-hidden />
        <div>
          <h3 id="onboard-title" lang={te ? 'te' : undefined}>
            {te ? 'సమీక్షకుల సమూహంలో చేరండి' : 'Join the Reviewer Pool'}
          </h3>
          <p className="rpv2-apply__intro" lang={te ? 'te' : undefined}>
            {te
              ? 'దరఖాస్తు → శిక్షణ → ట్రయల్ సమీక్ష → మండలి పరిశీలన. ఆధారాలతో కూడిన నైపుణ్య అభిప్రాయం మాత్రమే.'
              : 'Apply → training → trial review → council moderation. Evidence-based craft feedback only.'}
          </p>
        </div>
      </div>

      {error && record.status !== 'training' && (
        <p className="rpv2-apply-hint missing" role="alert">{error}</p>
      )}

      {record.status === 'not_applied' && (
        <>
          <span className="rpv2-field-label" lang={te ? 'te' : undefined}>
            {te ? 'జానర్ నైపుణ్యం (గరిష్టం 3)' : 'Genre expertise (max 3)'}
          </span>
          <div className="rpv2-chip-row" role="group">
            {GENRE_SPECIALIZATIONS.map((g) => (
              <button
                key={g.id}
                type="button"
                className={`rpv2-genre-chip${genres.includes(g.id) ? ' rpv2-genre-chip--on' : ''}`}
                onClick={() => toggleGenre(g.id)}
              >
                {g.label}
              </button>
            ))}
          </div>

          <span className="rpv2-field-label" lang={te ? 'te' : undefined}>
            {te ? 'మీరు ఎందుకు సమీక్షించాలనుకుంటున్నారు?' : 'Why do you want to review?'}
          </span>
          <textarea
            className="rpv2-textarea"
            rows={3}
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            placeholder={te
              ? 'మీ సాహిత్య నేపథ్యం, మీరు ఏమి అందించాలనుకుంటున్నారో పంచుకోండి…'
              : 'Share your literary background and what you hope to contribute…'}
            lang={te ? 'te' : undefined}
          />

          <label className="rpv2-agreement" lang={te ? 'te' : undefined}>
            <input
              type="checkbox"
              checked={agreementAccepted}
              onChange={(e) => setAgreementAccepted(e.target.checked)}
            />
            <span>
              {REVIEWER_AGREEMENT_SUMMARY}
              {' '}
              <span style={{ color: 'var(--rpv2-text-3)' }}>({CURRENT_REVIEWER_AGREEMENT_VERSION})</span>
            </span>
          </label>

          <button
            type="button"
            className={`rpv2-apply-btn${canApply ? ' rpv2-apply-btn--ready' : ''}`}
            disabled={!canApply}
            onClick={() => { void handleApply(); }}
            aria-describedby={needs.length ? 'apply-missing-hint' : undefined}
          >
            {busy
              ? (te ? 'సమర్పిస్తోంది…' : 'Submitting…')
              : (te ? 'సమూహంలో చేరడానికి దరఖాస్తు చేయండి' : 'Apply to Reviewer Pool')}
          </button>
          {needs.length > 0 && (
            <p id="apply-missing-hint" className="rpv2-apply-hint" role="status" lang={te ? 'te' : undefined}>
              {te ? 'బటన్‌ను యాక్టివేట్ చేయడానికి: ' : 'To activate the button: '}
              <span className="missing">{needs.join(' · ')}</span>
            </p>
          )}
        </>
      )}

      {(record.status === 'applied' || record.status === 'training') && !record.trainingCompleted && (
        <div>
          <div className="rpv2-apply__head">
            <Sparkles size={18} aria-hidden />
            <div>
              <h3 lang={te ? 'te' : undefined}>{te ? 'సమీక్షకుల శిక్షణ పూర్తి చేయండి' : 'Complete reviewer training'}</h3>
              <p className="rpv2-apply__intro" lang={te ? 'te' : undefined}>
                {te
                  ? 'డబుల్-బ్లైండ్ నైతికత, ఆధారాలతో నోట్స్, తెలుగు నైపుణ్య సున్నితత్వం. (~5 నిమి)'
                  : 'Double-blind etiquette, evidence-based notes, Telugu craft sensitivity. (~5 min)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="rpv2-apply-btn rpv2-apply-btn--ready"
            disabled={busy}
            onClick={() => { void handleTraining(); }}
          >
            {busy ? '…' : (te ? 'శిక్షణ మాడ్యూల్ పూర్తి చేయండి' : 'Complete training module')}
          </button>
        </div>
      )}

      {record.trainingCompleted && (
        <TrialReviewPanel busy={busy} error={error} onSubmit={(p) => void handleTrialSubmit(p)} />
      )}
    </section>
  );
}
