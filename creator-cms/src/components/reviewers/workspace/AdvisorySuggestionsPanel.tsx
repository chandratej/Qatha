import { useCallback, useEffect, useState } from 'react';
import { Bot, Check, Sparkles, X } from 'lucide-react';
import { platformApi } from '../../../lib/platformApi';
import { formatAdvisoryConfidence } from '../../../../../packages/shared/aiReviewAdvisory';
import type { AdvisorySuggestion } from '../../../../../packages/shared/aiReviewAdvisory';

interface Props {
  assignmentId: string;
  reviewerSlot: string;
  onAcceptSuggestion?: (suggestion: AdvisorySuggestion) => void;
}

export function AdvisorySuggestionsPanel({ assignmentId, reviewerSlot, onAcceptSuggestion }: Props) {
  const [suggestions, setSuggestions] = useState<AdvisorySuggestion[]>([]);
  const [advisoryLive, setAdvisoryLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    platformApi.getAdvisorySuggestions(assignmentId, reviewerSlot)
      .then((r) => {
        setSuggestions(r.suggestions.filter((s) => s.status === 'pending'));
        setAdvisoryLive(r.advisory_ai_live);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load advisory hints'))
      .finally(() => setLoading(false));
  }, [assignmentId, reviewerSlot]);

  useEffect(() => {
    reload();
  }, [reload]);

  const respond = async (id: string, action: 'accepted' | 'ignored') => {
    setBusyId(id);
    try {
      const { suggestion } = await platformApi.respondToAdvisorySuggestion(id, action);
      if (action === 'accepted' && onAcceptSuggestion) onAcceptSuggestion(suggestion);
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="rw-advisory" aria-labelledby="rw-advisory-title">
      <div className="rw-advisory__head">
        <Sparkles size={14} aria-hidden />
        <h4 id="rw-advisory-title">Advisory craft hints</h4>
        <span className="rw-advisory__badge" title={advisoryLive ? 'xAI advisory' : 'Heuristic advisory'}>
          <Bot size={12} aria-hidden />
          {advisoryLive ? 'AI advisory' : 'Heuristic'}
        </span>
      </div>
      <p className="rw-advisory__disclaimer input-hint">
        Suggestions only — you decide what enters your review. Failure never blocks manual craft notes.
      </p>

      {loading && <p className="rw-empty-hint" role="status" aria-live="polite">Loading hints…</p>}
      {error && <p className="rw-advisory__error" role="alert">{error}</p>}

      {!loading && suggestions.length === 0 && !error && (
        <p className="rw-empty-hint">No pending hints — add your own observations while reading.</p>
      )}

      <ul className="rw-advisory__list">
        {suggestions.map((s) => (
          <li key={s.id} className="rw-advisory__item">
            <div className="rw-advisory__item-head">
              <span className="rw-advisory__cat">{s.category.replace(/_/g, ' ')}</span>
              <span className="rw-advisory__conf" title={`Confidence ${Math.round(s.confidence * 100)}%`}>
                {formatAdvisoryConfidence(s.confidence)}
              </span>
            </div>
            <p className="rw-advisory__body">{s.body}</p>
            {s.evidence && (
              <blockquote className="rw-advisory__evidence">"{s.evidence}"</blockquote>
            )}
            <div className="rw-advisory__actions">
              <button
                type="button"
                className="rw-mini-btn rw-mini-btn--accept"
                disabled={busyId === s.id}
                onClick={() => { void respond(s.id, 'accepted'); }}
              >
                <Check size={12} aria-hidden /> Use in review
              </button>
              <button
                type="button"
                className="rw-mini-btn"
                disabled={busyId === s.id}
                onClick={() => { void respond(s.id, 'ignored'); }}
              >
                <X size={12} aria-hidden /> Dismiss
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}