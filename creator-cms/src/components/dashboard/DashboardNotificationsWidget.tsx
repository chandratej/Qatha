import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { platformApi } from '../../lib/platformApi';
import { useAuth } from '../../context/AuthContext';
import { normalizePlatformNotification, relativeTime } from '../../lib/notificationFeed';

export function DashboardNotificationsWidget() {
  const { user } = useAuth();
  const userId = user?.id || 'anonymous-creator';

  const { data } = useApi(
    () => platformApi.getNotifications(userId).then((r) => r.notifications.map(normalizePlatformNotification)),
    [userId],
  );

  const unread = useMemo(() => (data ?? []).filter((n) => !n.read_at), [data]);
  const recent = unread.slice(0, 3);

  return (
    <section className="cms-panel dashboard-notifications-widget" aria-labelledby="dash-notif-title">
      <div className="dashboard-notifications-widget__head">
        <Bell size={16} aria-hidden />
        <h3 id="dash-notif-title" className="dashboard-panel__title">Alerts</h3>
        {unread.length > 0 && (
          <span className="dashboard-notifications-widget__badge">{unread.length}</span>
        )}
      </div>
      {recent.length === 0 ? (
        <p className="input-hint">No new alerts. Schedule, reviews, and moderation updates appear here.</p>
      ) : (
        <ul className="dashboard-notifications-widget__list">
          {recent.map((n) => (
            <li key={n.id}>
              <Link to={n.action_url || '/notifications'} className="dashboard-notifications-widget__item">
                <strong>{n.title}</strong>
                <span>{relativeTime(n.created_at)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link to="/notifications" className="dashboard-notifications-widget__all">View all notifications</Link>
    </section>
  );
}