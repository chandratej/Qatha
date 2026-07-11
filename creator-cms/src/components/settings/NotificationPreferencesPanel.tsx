import { useCallback, useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { platformApi } from '../../lib/platformApi';
import { useAuth } from '../../context/AuthContext';
import {
  CREATOR_NOTIFICATION_DOMAIN_LABELS,
  domainKeys,
  type CreatorNotificationDomainPrefs,
} from '../../lib/creatorNotificationPrefsLocal';
import { CRITICAL_NOTIFICATION_DOMAINS } from '../../../../packages/shared/creatorNotificationPrefs';
import type { NotificationDomain } from '../../../../packages/shared/notifications';

export function NotificationPreferencesPanel() {
  const { user } = useAuth();
  const userId = user?.id || 'anonymous-creator';
  const [prefs, setPrefs] = useState<CreatorNotificationDomainPrefs | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const reload = useCallback(() => {
    platformApi.getNotificationPreferences(userId)
      .then((r) => setPrefs(r.preferences))
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load preferences'));
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const toggle = async (domain: NotificationDomain) => {
    if (!prefs) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    const next = { ...prefs, [domain]: !prefs[domain] };
    try {
      const result = await platformApi.updateNotificationPreferences(userId, next);
      setPrefs(result.preferences);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="cms-panel studio-settings-section">
      <div className="studio-settings-section__head">
        <Bell size={18} aria-hidden />
        <h3>In-app notifications</h3>
      </div>
      <div className="studio-settings-section__body">
        <p className="input-hint" style={{ marginTop: 0 }}>
          Choose which alert domains appear in your bell and notification feed. Email delivery is coming soon.
        </p>
        {error && <p className="cms-error-text" role="alert">{error}</p>}
        {saved && <p className="input-hint" role="status">Preferences saved.</p>}
        {!prefs ? (
          <p className="input-hint">Loading preferences…</p>
        ) : (
          <ul className="notification-prefs-list">
            {domainKeys().map((domain) => {
              const critical = CRITICAL_NOTIFICATION_DOMAINS.includes(domain);
              return (
                <li key={domain} className="notification-prefs-list__item">
                  <label className="notification-prefs-list__label">
                    <input
                      type="checkbox"
                      checked={prefs[domain]}
                      disabled={busy}
                      onChange={() => { void toggle(domain); }}
                    />
                    <span>{CREATOR_NOTIFICATION_DOMAIN_LABELS[domain]}</span>
                  </label>
                  {critical && (
                    <span className="input-hint">Recommended on for account safety</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}