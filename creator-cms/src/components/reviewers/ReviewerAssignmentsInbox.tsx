import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { CheckCircle2, ClipboardList, Inbox, Send } from 'lucide-react';
import { platformApi } from '../../lib/platformApi';
import type { ReviewerAssignment } from '../../types/platform';
import { useAuth } from '../../context/AuthContext';
import { PROFESSIONAL_REVIEW_ROLES, GENRE_SPECIALIZATIONS } from '../../lib/platformConstants';

function statusLabel(s: string) {
  return s.replace(/_/g, ' ');
}

interface Props {
  onAction: () => void;
}

export function ReviewerAssignmentsInbox({ onAction }: Props) {
  const { user } = useAuth();
  const [slot, setSlot] = useState('slot-1');
  const [assignments, setAssignments] = useState<ReviewerAssignment[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    platformApi.getReviewerAssignments(slot).then((r) => setAssignments(r.assignments));
  }, [slot]);

  useEffect(() => {
    platformApi.getLinkedReviewerSlot(user?.id).then((r) => setSlot(r.slot));
  }, [user?.id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleSlotChange = (next: string) => {
    setSlot(next);
    platformApi.setLinkedReviewerSlot(next);
  };

  const handleAccept = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      await platformApi.acceptReviewerAssignment(id, slot);
      reload();
      onAction();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not accept');
    } finally {
      setBusyId(null);
    }
  };

  const handleSubmit = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      await platformApi.submitReviewerAssignment(id, slot);
      reload();
      onAction();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit');
    } finally {
      setBusyId(null);
    }
  };

  const pending = assignments.filter((a) => a.status === 'invited');
  const active = assignments.filter((a) => ['accepted', 'in_review'].includes(a.status));
  const done = assignments.filter((a) => ['submitted', 'validated', 'paid_out'].includes(a.status));

  return (
    <section className="cms-panel reviewer-inbox" aria-labelledby="reviewer-inbox-title">
      <div className="reviewer-inbox__head">
        <Inbox size={18} aria-hidden />
        <div>
          <h3 id="reviewer-inbox-title" className="dashboard-panel__title">Reviewer assignments inbox</h3>
          <p className="input-hint">Double-blind — author identity hidden until all reviews complete.</p>
        </div>
      </div>

      <div className="input-group">
        <label htmlFor="reviewer-slot">Your council slot (demo)</label>
        <select
          id="reviewer-slot"
          className="cms-select"
          value={slot}
          onChange={(e) => handleSlotChange(e.target.value)}
        >
          {Array.from({ length: 10 }, (_, i) => (
            <option key={i + 1} value={`slot-${i + 1}`}>Council slot {i + 1}</option>
          ))}
        </select>
        <span className="input-hint">Switch slot to see invitations received by different pool reviewers.</span>
      </div>

      {error && <p className="cms-error-text" role="alert">{error}</p>}

      {assignments.length === 0 ? (
        <p className="input-hint">
          No invitations for <strong>{slot}</strong> yet. Submit a community review as an author — matching creates invitations for council slots 1–3.
        </p>
      ) : (
        <>
          {pending.length > 0 && (
            <>
              <h4 className="reviewer-inbox__section">Invitations ({pending.length})</h4>
              <ul className="reviewer-inbox__list">
                {pending.map((a) => (
                  <AssignmentCard
                    key={a.id}
                    assignment={a}
                    action={(
                      <button
                        type="button"
                        className="katha-cta katha-cta--soft"
                        disabled={busyId === a.id}
                        onClick={() => { void handleAccept(a.id); }}
                      >
                        {busyId === a.id ? 'Accepting…' : 'Accept invitation'}
                      </button>
                    )}
                  />
                ))}
              </ul>
            </>
          )}

          {active.length > 0 && (
            <>
              <h4 className="reviewer-inbox__section">In progress ({active.length})</h4>
              <ul className="reviewer-inbox__list">
                {active.map((a) => (
                  <AssignmentCard
                    key={a.id}
                    assignment={a}
                    action={(
                      <button
                        type="button"
                        className="katha-cta katha-cta--maroon"
                        disabled={busyId === a.id}
                        onClick={() => { void handleSubmit(a.id); }}
                      >
                        <Send size={14} aria-hidden /> {busyId === a.id ? 'Submitting…' : 'Submit review'}
                      </button>
                    )}
                  />
                ))}
              </ul>
            </>
          )}

          {done.length > 0 && (
            <>
              <h4 className="reviewer-inbox__section">Completed ({done.length})</h4>
              <ul className="reviewer-inbox__list">
                {done.map((a) => (
                  <AssignmentCard key={a.id} assignment={a} action={(
                    <span className="reviewer-inbox__done">
                      <CheckCircle2 size={14} aria-hidden /> {statusLabel(a.status)}
                    </span>
                  )} />
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  );
}

function AssignmentCard({
  assignment: a,
  action,
}: {
  assignment: ReviewerAssignment;
  action: ReactNode;
}) {
  return (
    <li className="reviewer-inbox__item">
      <div className="reviewer-inbox__item-head">
        <ClipboardList size={16} aria-hidden />
        <strong>{a.manuscript_label}</strong>
        <span className={`review-status review-status--${a.status}`}>{statusLabel(a.status)}</span>
      </div>
      <p className="input-hint">
        {PROFESSIONAL_REVIEW_ROLES.find((r) => r.id === a.professional_role)?.label ?? a.professional_role}
        {' · '}
        {GENRE_SPECIALIZATIONS.find((g) => g.id === a.story_genre)?.label ?? a.story_genre}
        {' · match '}{a.matching_score}%
        {a.mode === 'paid' ? ` · earn ₹${a.payout_inr}` : ' · volunteer'}
      </p>
      <div className="reviewer-inbox__actions">{action}</div>
    </li>
  );
}