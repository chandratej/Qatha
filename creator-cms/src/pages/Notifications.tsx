import { useCallback, useMemo, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { platformApi } from '../lib/platformApi';
import { NotificationCard } from '../components/notifications/NotificationCard';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import { StudioEmptyState } from '../components/studio/StudioEmptyState';
import { useLocale } from '../context/LocaleContext';
import {
  filterNotifications,
  normalizePlatformNotification,
  unreadCount,
  type NotificationFilter,
} from '../lib/notificationFeed';

const FILTER_KEYS: Record<NotificationFilter, 'notifications.filterAll' | 'notifications.filterReview' | 'notifications.filterPublish' | 'notifications.filterRevenue' | 'notifications.filterReaders'> = {
  all: 'notifications.filterAll',
  reviews: 'notifications.filterReview',
  publishing: 'notifications.filterPublish',
  revenue: 'notifications.filterRevenue',
  readers: 'notifications.filterReaders',
};

export function Notifications() {
  const { t } = useLocale();
  const { user } = useAuth();
  const userId = user?.id || 'anonymous-creator';
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [busy, setBusy] = useState(false);

  const { data, loading, error, mutate } = useApi(
    () =>
      import('../lib/notificationClient')
        .then((m) => m.fetchNotificationsShared(userId))
        .then((list) => list.map(normalizePlatformNotification)),
    [userId],
  );

  const items = data ?? [];
  const filtered = useMemo(() => filterNotifications(items, filter), [items, filter]);
  const unread = unreadCount(items);

  const handleMarkRead = useCallback(async (id: string) => {
    await platformApi.markNotificationRead(id);
    const { invalidateNotificationsCache } = await import('../lib/notificationClient');
    invalidateNotificationsCache();
    mutate();
  }, [mutate]);

  const handleMarkAll = async () => {
    setBusy(true);
    try {
      await platformApi.markAllNotificationsRead(userId);
      const { invalidateNotificationsCache } = await import('../lib/notificationClient');
      invalidateNotificationsCache();
      mutate();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cms-page studio-page notifications-studio--premium wc-page-enter">
      <StudioPageHeader
        variant="hero"
        eyebrow={t('notifications.eyebrow')}
        eyebrowIcon={Bell}
        title={t('notifications.title')}
        subtitle={t('notifications.subtitle')}
        actions={unread > 0 ? (
          <button
            type="button"
            className="katha-cta katha-cta--soft katha-cta--compact"
            disabled={busy}
            onClick={() => { void handleMarkAll(); }}
          >
            <CheckCheck size={14} aria-hidden />
            {busy ? t('notifications.marking') : t('notifications.markAll')}
          </button>
        ) : undefined}
      />

      <div className="wc-stagger-children">
      <div className="notification-bell__filters notifications-filters--premium">
        {(Object.keys(FILTER_KEYS) as NotificationFilter[]).map((f) => (
          <button
            key={f}
            type="button"
            className={`notification-bell__filter${filter === f ? ' notification-bell__filter--active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {t(FILTER_KEYS[f])}
          </button>
        ))}
      </div>

      {error && <p className="cms-error-text" role="alert">{error}</p>}
      {loading && <p className="input-hint">{t('common.loading')}</p>}

      {!loading && filtered.length === 0 ? (
        <StudioEmptyState
          icon={Bell}
          title={t('notifications.emptyTitle')}
          text={t('notifications.emptyText')}
        />
      ) : (
        <div className="notifications-page__feed notifications-feed">
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
    </div>
  );
}