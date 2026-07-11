import { useCallback, useMemo, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { platformApi } from '../lib/platformApi';
import { NotificationCard } from '../components/notifications/NotificationCard';
import {
  filterNotifications,
  NOTIFICATION_FILTER_LABELS,
  normalizePlatformNotification,
  unreadCount,
  type NotificationFilter,
} from '../lib/notificationFeed';

export function Notifications() {
  const { user } = useAuth();
  const userId = user?.id || 'anonymous-creator';
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [busy, setBusy] = useState(false);

  const { data, loading, error, mutate } = useApi(
    () => platformApi.getNotifications(userId).then((r) => r.notifications.map(normalizePlatformNotification)),
    [userId],
  );

  const items = data ?? [];
  const filtered = useMemo(() => filterNotifications(items, filter), [items, filter]);
  const unread = unreadCount(items);

  const handleMarkRead = useCallback(async (id: string) => {
    await platformApi.markNotificationRead(id);
    mutate();
  }, [mutate]);

  const handleMarkAll = async () => {
    setBusy(true);
    try {
      await platformApi.markAllNotificationsRead(userId);
      mutate();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="notifications-page">
      <header className="cms-page-header">
        <div className="notifications-page__head">
          <Bell size={22} aria-hidden />
          <div>
            <h1 className="cms-page-header__title">Notifications</h1>
            <p className="cms-page-header__subtitle">
              Review, publishing, and moderation alerts — triage in one place.
            </p>
          </div>
        </div>
        {unread > 0 && (
          <button
            type="button"
            className="katha-cta katha-cta--soft katha-cta--compact"
            disabled={busy}
            onClick={() => { void handleMarkAll(); }}
          >
            <CheckCheck size={14} aria-hidden />
            {busy ? 'Marking…' : 'Mark all read'}
          </button>
        )}
      </header>

      <div className="notification-bell__filters notifications-page__filters">
        {(Object.keys(NOTIFICATION_FILTER_LABELS) as NotificationFilter[]).map((f) => (
          <button
            key={f}
            type="button"
            className={`notification-bell__filter${filter === f ? ' notification-bell__filter--active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {NOTIFICATION_FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {error && <p className="cms-error-text" role="alert">{error}</p>}
      {loading && <p className="input-hint">Loading notifications…</p>}

      {!loading && filtered.length === 0 ? (
        <div className="notifications-page__empty cms-panel">
          <p>No alerts in this filter. Review invitations and moderation updates appear here.</p>
        </div>
      ) : (
        <div className="notifications-page__feed">
          {filtered.map((n) => (
            <NotificationCard
              key={n.id}
              notification={n}
              onOpen={(id) => { void handleMarkRead(id); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}