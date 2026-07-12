import { useCallback, useEffect, useState } from 'react';
import { Gavel, Scale } from 'lucide-react';
import { platformApi } from '../../lib/platformApi';
import type { ModerationCase } from '../../types/platform';

interface Props {
  onAction: () => void;
}

function statusLabel(s: string) {
  return s.replace(/_/g, ' ');
}

export function AppealsModerationQueue({ onAction }: Props) {
  const [cases, setCases] = useState<ModerationCase[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const reload = useCallback(() => {
    platformApi.listModerationCases({ case_type: 'appeal', open_only: true })
      .then((r) => setCases(r.cases))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load appeals'));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleAssign = async (caseId: string) => {
    setBusyId(caseId);
    setError(null);
    try {
      await platformApi.assignModerationCase(caseId);
      reload();
      onAction();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Assign failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleResolve = async (caseId: string, status: 'resolved' | 'dismissed') => {
    setBusyId(caseId);
    setError(null);
    try {
      await platformApi.resolveModerationCase(caseId, status, notes[caseId]?.trim() || undefined);
      reload();
      onAction();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Resolution failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="cms-panel appeals-moderation-queue" aria-labelledby="appeals-mod-title">
      <div className="reviewer-inbox__head">
        <Scale size={18} aria-hidden />
        <div>
          <h3 id="appeals-mod-title" className="dashboard-panel__title">Review appeals</h3>
          <p className="input-hint">Independent review of council decisions — LRC-12-D4.</p>
        </div>
      </div>

      {error && <p className="input-hint" role="alert">{error}</p>}

      {cases.length === 0 ? (
        <p className="input-hint">No open appeals awaiting review.</p>
      ) : (
        <ul className="council-admin-queue__list">
          {cases.map((c) => (
            <li key={c.id} className={`council-admin-queue__item council-admin-queue__item--${c.status}`}>
              <div className="council-admin-queue__item-head">
                <strong>{c.metadata?.story_title as string || 'Review appeal'}</strong>
                <span className={`review-status review-status--${c.status}`}>{statusLabel(c.status)}</span>
              </div>
              <p className="input-hint">
                Filed {new Date(c.created_at).toLocaleDateString()}
                {c.metadata?.majority_decision ? ` · decision: ${String(c.metadata.majority_decision).replace(/_/g, ' ')}` : ''}
              </p>
              <blockquote className="reviewer-moderation-queue__motivation">{c.reason}</blockquote>
              <div className="appeals-moderation-queue__actions">
                {c.status === 'open' && (
                  <button
                    type="button"
                    className="katha-cta katha-cta--soft katha-cta--compact"
                    disabled={busyId === c.id}
                    onClick={() => { void handleAssign(c.id); }}
                  >
                    {busyId === c.id ? 'Assigning…' : 'Take case'}
                  </button>
                )}
                {c.status === 'investigating' && (
                  <>
                    <label className="input-hint">
                      Resolution notes
                      <textarea
                        className="rw-textarea"
                        rows={2}
                        value={notes[c.id] || ''}
                        onChange={(e) => setNotes((prev) => ({ ...prev, [c.id]: e.target.value }))}
                        placeholder="Document independent review findings…"
                      />
                    </label>
                    <div className="reviewer-moderation-queue__actions">
                      <button
                        type="button"
                        className="katha-cta katha-cta--maroon katha-cta--compact"
                        disabled={busyId === c.id}
                        onClick={() => { void handleResolve(c.id, 'resolved'); }}
                      >
                        <Gavel size={14} aria-hidden /> Uphold appeal
                      </button>
                      <button
                        type="button"
                        className="katha-cta katha-cta--soft katha-cta--compact"
                        disabled={busyId === c.id}
                        onClick={() => { void handleResolve(c.id, 'dismissed'); }}
                      >
                        Dismiss appeal
                      </button>
                    </div>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}