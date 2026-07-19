import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { EyeOff } from 'lucide-react';
import { platformApi } from '../../lib/platformApi';
import type { ReviewerAssignment } from '../../types/platform';
import { useAuth } from '../../context/AuthContext';
import { PROFESSIONAL_REVIEW_ROLES, GENRE_SPECIALIZATIONS } from '../../lib/platformConstants';
import { useLocale } from '../../context/LocaleContext';

function statusLabel(s: string, te?: boolean) {
  if (!te) return s.replace(/_/g, ' ');
  const map: Record<string, string> = {
    invited: 'ఆహ్వానం',
    accepted: 'అంగీకరించారు',
    in_review: 'సమీక్షలో',
    submitted: 'సమర్పించారు',
    validated: 'ధృవీకరించారు',
    paid_out: 'చెల్లించారు',
    declined: 'తిరస్కరించారు',
  };
  return map[s] ?? s.replace(/_/g, ' ');
}

interface Props {
  onAction: () => void;
}

/** Inbox cards — matches katha_reviewer_pool_v2.html inbox section */
export function ReviewerAssignmentsInbox({ onAction }: Props) {
  const { user } = useAuth();
  const { locale } = useLocale();
  const te = locale === 'te';
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
  }, [reload, onAction]);

  const handleDecline = async (assignment: ReviewerAssignment) => {
    setBusyId(assignment.id);
    setError(null);
    try {
      await platformApi.declineReviewerAssignment(assignment.id, assignment.reviewer_slot);
      reload();
      onAction();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not decline');
    } finally {
      setBusyId(null);
    }
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
  const all = [...pending, ...active, ...done];

  return (
    <section className="rpv2-inbox" aria-labelledby="reviewer-inbox-title">
      <div className="rpv2-section-head">
        <h3 id="reviewer-inbox-title" lang={te ? 'te' : undefined}>
          {te ? 'మీ సమీక్ష ఇన్‌బాక్స్' : 'Your review inbox'}
        </h3>
      </div>
      <p className="rpv2-double-blind" lang={te ? 'te' : undefined}>
        <EyeOff size={14} aria-hidden />
        {te ? 'డబుల్-బ్లైండ్ — రచయిత గుర్తింపు రక్షించబడింది' : 'Double-blind — author identity protected'}
      </p>

      {error && <p className="cms-error-text" role="alert">{error}</p>}

      {all.length === 0 ? (
        <p className="rpv2-waiting-hint" lang={te ? 'te' : undefined}>
          {te
            ? 'ఇంకా ఆహ్వానాలు లేవు. రచయితగా సమీక్ష అభ్యర్థించండి లేదా డెమో సీడ్ లోడ్ చేయండి.'
            : 'No invitations yet. Request a review as an author, or load the dev demo scenario.'}
        </p>
      ) : (
        <ul className="rpv2-inbox-list">
          {pending.map((a) => (
            <AssignmentCard
              key={a.id}
              assignment={a}
              te={te}
              statusClass="invite"
              priceLabel={a.mode === 'paid' ? `₹${Math.round(a.payout_inr)}` : (te ? 'స్వచ్ఛంద' : 'Volunteer')}
              action={(
                <div className="rpv2-inbox-actions">
                  <button
                    type="button"
                    className="rpv2-queue-cta"
                    disabled={busyId === a.id}
                    onClick={() => { void handleAccept(a); }}
                  >
                    {busyId === a.id ? (te ? '…' : '…') : (te ? 'అంగీకరించి ప్రారంభించండి' : 'Accept & begin')}
                  </button>
                  <button
                    type="button"
                    className="rpv2-chip"
                    disabled={busyId === a.id}
                    onClick={() => { void handleDecline(a); }}
                  >
                    {te ? 'తిరస్కరించు' : 'Decline'}
                  </button>
                </div>
              )}
            />
          ))}
          {active.map((a) => (
            <AssignmentCard
              key={a.id}
              assignment={a}
              te={te}
              statusClass="review"
              priceLabel={a.mode === 'paid' ? `₹${Math.round(a.payout_inr)}` : (te ? 'స్వచ్ఛంద' : 'Volunteer')}
              action={(
                <Link
                  to={`/reviewers/assignments/${a.id}`}
                  className="rpv2-inbox-action"
                  onClick={() => platformApi.setLinkedReviewerSlot(a.reviewer_slot)}
                >
                  {te ? 'సమీక్ష వర్క్‌స్పేస్ తెరవండి →' : 'Open review workspace →'}
                </Link>
              )}
            />
          ))}
          {done.map((a) => (
            <AssignmentCard
              key={a.id}
              assignment={a}
              te={te}
              statusClass="done"
              priceLabel={a.mode === 'paid' ? `₹${Math.round(a.payout_inr)}` : (te ? 'స్వచ్ఛంద' : 'Volunteer')}
              action={(
                <Link to={`/reviewers/assignments/${a.id}`} className="rpv2-inbox-action">
                  {te ? 'సమీక్ష చూడండి →' : 'View review →'}
                </Link>
              )}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function AssignmentCard({
  assignment: a,
  te,
  statusClass,
  priceLabel,
  action,
}: {
  assignment: ReviewerAssignment;
  te: boolean;
  statusClass: 'invite' | 'review' | 'done';
  priceLabel: string;
  action: ReactNode;
}) {
  const role = PROFESSIONAL_REVIEW_ROLES.find((r) => r.id === a.professional_role)?.label ?? a.professional_role;
  const genre = GENRE_SPECIALIZATIONS.find((g) => g.id === a.story_genre)?.label ?? a.story_genre;

  return (
    <li className="rpv2-inbox-card">
      <div className="rpv2-inbox-top">
        <div>
          <p className="rpv2-inbox-title">{a.manuscript_label}</p>
          <p className="rpv2-inbox-meta">
            {role} · {genre} · {a.matching_score}% {te ? 'సరిపోలిక' : 'match'}
          </p>
        </div>
        <div>
          <span className={`rpv2-status rpv2-status--${statusClass}`}>
            {statusLabel(a.status, te)}
          </span>
          <p className={`rpv2-inbox-price${a.mode !== 'paid' ? ' rpv2-inbox-price--volunteer' : ''}`}>
            {priceLabel}
          </p>
        </div>
      </div>
      {action}
    </li>
  );
}
