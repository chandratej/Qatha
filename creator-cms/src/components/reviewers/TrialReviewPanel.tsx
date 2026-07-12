import { useState } from 'react';
import { BookOpen, Star } from 'lucide-react';
import {
  TRIAL_REVIEW_DIMENSIONS,
  TRIAL_REVIEW_PASS_SCORE,
  TRIAL_REVIEW_SAMPLE,
} from '../../../../packages/shared/trialReview';

interface Props {
  busy: boolean;
  error: string | null;
  onSubmit: (payload: {
    strengths: string;
    weaknesses: string;
    suggestion: string;
    rubric_scores: Record<string, number>;
  }) => void;
}

export function TrialReviewPanel({ busy, error, onSubmit }: Props) {
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({
    constructiveness: 4,
    evidence: 4,
    actionability: 4,
    craft_sensitivity: 4,
  });

  const setScore = (id: string, value: number) => {
    setScores((prev) => ({ ...prev, [id]: value }));
  };

  const canSubmit =
    strengths.trim().length >= 10
    && weaknesses.trim().length >= 10
    && suggestion.trim().length >= 10;

  return (
    <div className="reviewer-onboarding__trial">
      <BookOpen size={18} aria-hidden />
      <div>
        <h4>Trial review — editorial quality gate</h4>
        <p className="input-hint">
          Literary Council moderators score this before pool access. Pass threshold: {TRIAL_REVIEW_PASS_SCORE}%.
        </p>
        <blockquote className="reviewer-onboarding__trial-passage">
          {TRIAL_REVIEW_SAMPLE.passage}
        </blockquote>
        <p className="input-hint">{TRIAL_REVIEW_SAMPLE.prompt}</p>

        <label className="reviewer-onboarding__field">
          <span>Strength</span>
          <textarea className="rw-textarea" rows={2} value={strengths} onChange={(e) => setStrengths(e.target.value)} />
        </label>
        <label className="reviewer-onboarding__field">
          <span>Weakness</span>
          <textarea className="rw-textarea" rows={2} value={weaknesses} onChange={(e) => setWeaknesses(e.target.value)} />
        </label>
        <label className="reviewer-onboarding__field">
          <span>Actionable suggestion</span>
          <textarea className="rw-textarea" rows={2} value={suggestion} onChange={(e) => setSuggestion(e.target.value)} />
        </label>

        <fieldset className="reviewer-onboarding__rubric">
          <legend><Star size={14} aria-hidden /> Self-assessment rubric (1–5)</legend>
          {TRIAL_REVIEW_DIMENSIONS.map((dim) => (
            <label key={dim.id} className="reviewer-onboarding__rubric-row">
              <span>{dim.label}</span>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={scores[dim.id] ?? 4}
                onChange={(e) => setScore(dim.id, Number(e.target.value))}
              />
              <span className="reviewer-onboarding__rubric-val">{scores[dim.id] ?? 4}</span>
            </label>
          ))}
        </fieldset>

        {error && <p className="input-hint" role="alert" style={{ color: 'var(--katha-danger, #b42318)' }}>{error}</p>}

        <button
          type="button"
          className="katha-cta katha-cta--maroon"
          disabled={busy || !canSubmit}
          onClick={() => onSubmit({
            strengths: strengths.trim(),
            weaknesses: weaknesses.trim(),
            suggestion: suggestion.trim(),
            rubric_scores: scores,
          })}
        >
          {busy ? 'Submitting trial review…' : 'Submit trial review for council review'}
        </button>
      </div>
    </div>
  );
}