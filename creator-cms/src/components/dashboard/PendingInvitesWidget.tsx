import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export function PendingInvitesWidget() {
  const { user } = useAuth();
  const load = useCallback(
    () => api.getPendingInvites(user?.email).catch(() => ({ invites: [] })),
    [user?.email],
  );
  const { data, reload } = useApi(load, [user?.email]);

  const pending = data?.invites ?? [];
  if (pending.length === 0) return null;

  const accept = async (inviteId: string) => {
    await api.acceptStoryInvite(inviteId, user?.email);
    await reload();
  };

  return (
    <section className="cms-panel dashboard-invites-widget" aria-labelledby="dash-invites-title">
      <div className="dashboard-notifications-widget__head">
        <UserPlus size={16} aria-hidden />
        <h3 id="dash-invites-title" className="dashboard-panel__title">Collaboration invites</h3>
        <span className="dashboard-notifications-widget__badge">{pending.length}</span>
      </div>
      <ul className="dashboard-notifications-widget__list">
        {pending.slice(0, 3).map((inv) => (
          <li key={inv.id} className="dashboard-invites-widget__row">
            <span>
              <strong>{inv.role.replace('_', ' ')}</strong>
              {inv.chapter_number ? ` · Ch. ${inv.chapter_number}` : ''}
            </span>
            <button type="button" className="katha-cta katha-cta--soft" onClick={() => { void accept(inv.id); }}>
              Accept
            </button>
          </li>
        ))}
      </ul>
      <Link to="/stories" className="dashboard-notifications-widget__all">Open stories</Link>
    </section>
  );
}