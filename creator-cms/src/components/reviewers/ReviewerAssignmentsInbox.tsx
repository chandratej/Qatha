import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronDown, Inbox, PenLine } from 'lucide-react';
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
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  const handleAccept = async (assignment: ReviewerAssignment) => {
    setBusyId(assignment.id);
    setError(null);
    try {
      platformApi.setLinkedReviewerSlot(assignment.reviewer_slot);
      await platformApi.acceptReviewerAssignment(assignment.id, assignment.reviewer_slot);
      setSlot(assignment.reviewer_slot);
      reload();
      onAction();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not accept');
    } finally {
      setBusyId(null);
    }
  };

  const pending = assignments.filter((a) => a.status === 'invited');
  const active = assignments.filter((a) => ['accepted', 'in_review'].includes(a.status));
  const done = assignments.filter((a) => ['submitted', 'validated', 'paid_out'].includes(a.status));

  return (
    <section className="reviewer-inbox reviewer-inbox--calm" aria-labelledby="reviewer-inbox-title">
      <div className="reviewer-inbox__head">
        <Inbox size={20} aria-hidden />
        <div>
          <h3 id="reviewer-inbox-title" className="reviewer-inbox__title">Your review inbox</h3>
          <p className="reviewer-inbox__subtitle">Double-blind · author identity protected</p>
        </div>
      </div>

      <button
        type="button"
        className="reviewer-inbox__settings"
        onClick={() => setSettingsOpen((v) => !v)}
        aria-expanded={settingsOpen}
      >
        Council slot: {slot.replace('slot-', '#')}
        <ChevronDown size={14} className={`reviewer-inbox__settings-chevron${settingsOpen ? ' reviewer-inbox__settings-chevron--open' : ''}`} aria-hidden />
      </button>
      {settingsOpen && (
        <div className="reviewer-inbox__settings-body">
          <label htmlFor="reviewer-slot" className="sr-only">Council slot</label>
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
          <span className="input-hint">Switch slot to see different reviewer invitations (demo).</span>
        </div>
      )}

      {error && <p className="cms-error-text" role="alert">{error}</p>}

      {assignments.length === 0 ? (
        <div className="reviewer-inbox__empty">
          <p>No invitations for {slot} yet.</p>
          <p className="input-hint">Request a community review as an author, or load the dev demo scenario.</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="reviewer-inbox__group">
              <h4 className="reviewer-inbox__section">Invitations</h4>
              <ul className="reviewer-inbox__list">
                {pending.map((a) => (
                  <AssignmentCard
                    key={a.id}
                    assignment={a}
                    variant="invite"
                    action={(
                      <button
                        type="button"
                        className="katha-cta katha-cta--maroon"
                        disabled={busyId === a.id}
                        onClick={() => { void handleAccept(a); }}
                      >
                        {busyId === a.id ? 'Accepting…' : 'Accept & begin'}
                      </button>
                    )}
                  />
                ))}
              </ul>
            </div>
          )}

          {active.length > 0 && (
            <div className="reviewer-inbox__group">
              <h4 className="reviewer-inbox__section">In progress</h4>
              <ul className="reviewer-inbox__list">
                {active.map((a) => (
                  <AssignmentCard
                    key={a.id}
                    assignment={a}
                    variant="active"
                    action={(
                      <div className="reviewer-inbox__action-row">
                        <Link
                          to={`/reviewers/assignments/${a.id}`}
                          className="katha-cta katha-cta--maroon reviewer-inbox__primary-cta"
                          onClick={() => platformApi.setLinkedReviewerSlot(a.reviewer_slot)}
                        >
                          <PenLine size={14} aria-hidden /> Open review workspace
                        </Link>
                      </div>
                    )}
                  />
                ))}
              </ul>
            </div>
          )}

          {done.length > 0 && (
            <div className="reviewer-inbox__group">
              <h4 className="reviewer-inbox__section">Completed</h4>
              <ul className="reviewer-inbox__list">
                {done.map((a) => (
                  <AssignmentCard
                    key={a.id}
                    assignment={a}
                    variant="done"
                    action={(
                      <div className="reviewer-inbox__action-row">
                        <Link to={`/reviewers/assignments/${a.id}`} className="reviewer-inbox__secondary-cta">
                          View review
                        </Link>
                        <span className="reviewer-inbox__done">
                          <CheckCircle2 size={14} aria-hidden /> {statusLabel(a.status)}
                        </span>
                      </div>
                    )}
                  />
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function AssignmentCard({
  assignment: a,
  variant,
  action,
}: {
  assignment: ReviewerAssignment;
  variant: 'invite' | 'active' | 'done';
  action: ReactNode;
}) {
  const role = PROFESSIONAL_REVIEW_ROLES.find((r) => r.id === a.professional_role)?.label ?? a.professional_role;
  const genre = GENRE_SPECIALIZATIONS.find((g) => g.id === a.story_genre)?.label ?? a.story_genre;

  return (
    <li className={`reviewer-inbox__card reviewer-inbox__card--${variant}`}>
      <div className="reviewer-inbox__card-body">
        <h5 className="reviewer-inbox__card-title">{a.manuscript_label}</h5>
        <p className="reviewer-inbox__card-meta">
          {role} · {genre} · {a.matching_score}% match
          {a.mode === 'paid' ? ` · ₹${a.payout_inr}` : ' · volunteer'}
        </p>
        <span className={`review-status review-status--${a.status}`}>{statusLabel(a.status)}</span>
      </div>
      <div className="reviewer-inbox__card-actions">{action}</div>
    </li>
  );
}