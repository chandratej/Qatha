import { useCallback, useEffect, useState } from 'react';
import { ClipboardCheck, UserCheck, UserX } from 'lucide-react';
import { platformApi } from '../../lib/platformApi';

interface PendingApplication {
  user_id: string;
  status: string;
  genres: string[];
  motivation: string;
  applied_at?: string;
  languages?: string[];
  rqi?: number;
}

interface Props {
  onAction: () => void;
}

export function ReviewerModerationQueue({ onAction }: Props) {
  const [applications, setApplications] = useState<PendingApplication[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    platformApi.getPendingReviewerApplications()
      .then((r) => setApplications(r.applications as PendingApplication[]))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load applications'));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleModerate = async (userId: string, decision: 'approve' | 'reject') => {
    setBusyId(userId);
    setError(null);
    try {
      await platformApi.moderateReviewerApplication(userId, decision);
      reload();
      onAction();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Moderation failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="cms-panel reviewer-moderation-queue" aria-labelledby="reviewer-mod-title">
      <div className="reviewer-inbox__head">
        <ClipboardCheck size={18} aria-hidden />
        <div>
          <h3 id="reviewer-mod-title" className="dashboard-panel__title">Reviewer applications</h3>
          <p className="input-hint">Legal &amp; Trust gate — review motivations before pool access.</p>
        </div>
      </div>

      {error && <p className="input-hint" role="alert">{error}</p>}

      {applications.length === 0 ? (
        <p className="input-hint">No applications awaiting moderation.</p>
      ) : (
        <ul className="council-admin-queue__list">
          {applications.map((app) => (
            <li key={app.user_id} className="council-admin-queue__item">
              <div className="council-admin-queue__item-head">
                <strong>Reviewer {app.user_id.slice(0, 8)}…</strong>
                <span className="review-status review-status--pending">pending moderation</span>
              </div>
              <p className="input-hint">
                Genres: {app.genres.join(', ') || '—'}
                {app.applied_at ? ` · applied ${new Date(app.applied_at).toLocaleDateString()}` : ''}
              </p>
              <blockquote className="reviewer-moderation-queue__motivation">{app.motivation}</blockquote>
              <div className="reviewer-moderation-queue__actions">
                <button
                  type="button"
                  className="katha-cta katha-cta--maroon katha-cta--compact"
                  disabled={busyId === app.user_id}
                  onClick={() => void handleModerate(app.user_id, 'approve')}
                >
                  <UserCheck size={14} aria-hidden /> Approve
                </button>
                <button
                  type="button"
                  className="katha-cta katha-cta--soft katha-cta--compact"
                  disabled={busyId === app.user_id}
                  onClick={() => void handleModerate(app.user_id, 'reject')}
                >
                  <UserX size={14} aria-hidden /> Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}