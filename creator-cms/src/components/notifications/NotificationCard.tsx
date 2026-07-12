import { Link } from 'react-router-dom';
import { domainLabel, relativeTime } from '../../lib/notificationFeed';
import type { PlatformNotification } from '../../lib/notificationsLocal';
import { useLocale } from '../../context/LocaleContext';

interface Props {
  notification: PlatformNotification;
  onOpen?: (id: string) => void;
}

export function NotificationCard({ notification, onOpen }: Props) {
  const { t } = useLocale();
  const unread = !notification.read_at;
  const href = notification.action_url || '/notifications';

  return (
    <article
      className={`notification-card${unread ? ' notification-card--unread' : ''}`}
      data-priority={notification.priority}
    >
      <div className="notification-card__meta">
        <span className="notification-card__domain">{domainLabel(notification.domain)}</span>
        <time className="notification-card__time" dateTime={notification.created_at}>
          {relativeTime(notification.created_at)}
        </time>
      </div>
      <h3 className="notification-card__title">{notification.title}</h3>
      {notification.body && <p className="notification-card__body">{notification.body}</p>}
      <Link
        to={href}
        className="notification-card__cta"
        onClick={() => onOpen?.(notification.id)}
      >
        {t('notifications.open')}
      </Link>
    </article>
  );
}