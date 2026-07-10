import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Database, LogOut, Smartphone, Coffee, Settings2 } from 'lucide-react';
import {
  loadComfortPrefs,
  saveComfortPrefs,
  fontScaleLabel,
  lineHeightLabel,
  breakReminderLabel,
  editorFontSizePx,
  type FontScale,
  type LineHeightScale,
  type BreakReminderMinutes,
} from '../lib/comfortPrefs';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import { clearDraftCache } from '../lib/draftCache';
import { BRAND } from '../lib/constants';
import { useSupabaseDirect } from '../lib/api';
import { sbListUserDevices, sbRemoveUserDevice } from '../services';
import { getDeviceId } from '../lib/device';
import type { UserDevice } from '../types/database';

export function Settings() {
  const { user, logout, isMockMode } = useAuth();
  const navigate = useNavigate();
  const supabaseDirect = useSupabaseDirect();
  const [clearOnLogout, setClearOnLogout] = useState(
    () => localStorage.getItem('katha_clear_cache_on_logout') === 'true',
  );
  const [cacheMsg, setCacheMsg] = useState<string | null>(null);
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [devicesError, setDevicesError] = useState<string | null>(null);
  const currentDeviceId = getDeviceId();
  const [comfort, setComfort] = useState(() => loadComfortPrefs());

  const updateComfort = (patch: Parameters<typeof saveComfortPrefs>[0]) => {
    setComfort(saveComfortPrefs(patch));
  };

  useEffect(() => {
    if (!supabaseDirect || isMockMode) return;
    sbListUserDevices()
      .then(setDevices)
      .catch((e) => setDevicesError(e instanceof Error ? e.message : 'Could not load devices'));
  }, [supabaseDirect, isMockMode]);

  const handleClearCache = async () => {
    await clearDraftCache();
    setCacheMsg('Local version history cleared.');
    setTimeout(() => setCacheMsg(null), 3000);
  };

  const handleLogout = async () => {
    if (clearOnLogout) await clearDraftCache();
    logout();
    navigate('/login');
  };

  const toggleClearOnLogout = () => {
    const next = !clearOnLogout;
    setClearOnLogout(next);
    localStorage.setItem('katha_clear_cache_on_logout', String(next));
  };

  return (
    <div className="cms-page studio-page">
      <StudioPageHeader
        eyebrow="Studio preferences"
        eyebrowIcon={Settings2}
        title="Settings"
        subtitle="Account, appearance, and local data — tuned for long writing sessions."
      />

      <div className="studio-settings-grid">
        <section className="cms-panel studio-settings-section">
          <div className="studio-settings-section__head">
            <User size={18} aria-hidden />
            <h3>Creator profile</h3>
          </div>
          <div className="studio-settings-section__body">
            <p style={{ margin: '0 0 8px', color: 'var(--ink)' }}>
              <strong>{user?.display_name || 'Creator'}</strong>
            </p>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ink-muted)' }}>{user?.phone || '—'}</p>
            <p style={{ margin: '12px 0 0', fontSize: '0.8125rem', color: 'var(--ink-soft)' }}>
              Revenue share: {BRAND.creatorSharePct}% creator / {BRAND.platformSharePct}% platform · Payouts on the 15th
            </p>
          </div>
        </section>

        <section className="cms-panel studio-settings-section">
          <div className="studio-settings-section__head">
            <h3>Appearance</h3>
          </div>
          <div className="studio-settings-section__body">
            <div className="studio-settings-row">
              <span style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>Theme (sepia / night)</span>
              <ThemeToggle compact />
            </div>
          </div>
        </section>

        <section className="cms-panel studio-settings-section">
          <div className="studio-settings-section__head">
            <Coffee size={18} aria-hidden />
            <h3>Writing comfort</h3>
          </div>
          <div className="studio-settings-section__body">
            <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginBottom: 16, lineHeight: 1.55 }}>
              Tune the chapter editor for long sessions. Text size matches the reader app scale. Break reminders
              appear only while you are actively editing with this tab open.
            </p>
            <div style={{ display: 'grid', gap: 16 }}>
              <label className="studio-settings-field">
                <span>Editor text size — {fontScaleLabel(comfort.fontScale)} ({editorFontSizePx(comfort.fontScale)}px)</span>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={comfort.fontScale}
                  onChange={(e) => updateComfort({ fontScale: Number(e.target.value) as FontScale })}
                  aria-label="Editor text size"
                />
              </label>
              <label className="studio-settings-field">
                <span>Line spacing — {lineHeightLabel(comfort.lineHeightScale)}</span>
                <select
                  className="cms-input"
                  value={comfort.lineHeightScale}
                  onChange={(e) =>
                    updateComfort({ lineHeightScale: Number(e.target.value) as LineHeightScale })
                  }
                  aria-label="Editor line spacing"
                >
                  <option value={1}>Compact (1.65)</option>
                  <option value={2}>Comfort (1.88) — recommended</option>
                  <option value={3}>Spacious (1.95)</option>
                </select>
              </label>
              <label className="studio-settings-field">
                <span>Eye-break reminders — {breakReminderLabel(comfort.breakReminderMinutes)}</span>
                <select
                  className="cms-input"
                  value={comfort.breakReminderMinutes}
                  onChange={(e) =>
                    updateComfort({
                      breakReminderMinutes: Number(e.target.value) as BreakReminderMinutes,
                    })
                  }
                  aria-label="Eye-break reminder interval"
                >
                  <option value={0}>Off</option>
                  <option value={90}>Every 90 minutes</option>
                  <option value={120}>Every 120 minutes</option>
                </select>
              </label>
            </div>
          </div>
        </section>

        <section className="cms-panel studio-settings-section">
          <div className="studio-settings-section__head">
            <Database size={18} aria-hidden />
            <h3>Local drafts</h3>
          </div>
          <div className="studio-settings-section__body">
            <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginBottom: 16, lineHeight: 1.55 }}>
              Drafts autosave to IndexedDB offline and sync to Supabase when connected (72-hour version history).
            </p>
            <button type="button" className="btn btn-secondary" onClick={handleClearCache}>
              Clear local version history
            </button>
            {cacheMsg && <p style={{ marginTop: 12, fontSize: '0.8125rem', color: 'var(--accent-sage)' }}>{cacheMsg}</p>}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, fontSize: '0.875rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={clearOnLogout} onChange={toggleClearOnLogout} />
              Clear local version history on sign out
            </label>
          </div>
        </section>

        {supabaseDirect && !isMockMode && (
          <section className="cms-panel studio-settings-section">
            <div className="studio-settings-section__head">
              <Smartphone size={18} aria-hidden />
              <h3>Manage devices</h3>
            </div>
            <div className="studio-settings-section__body">
              <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginBottom: 12, lineHeight: 1.55 }}>
                Up to 2 active devices. Oldest inactive sessions are signed out automatically.
              </p>
              {devicesError && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--gold-dark)' }}>{devicesError}</p>
              )}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {devices.map((d) => (
                  <li
                    key={d.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 0',
                      borderBottom: '1px solid var(--border)',
                      fontSize: '0.875rem',
                    }}
                  >
                    <span>
                      {d.device_label || 'Unknown device'}
                      {d.device_id === currentDeviceId ? ' (this device)' : ''}
                      <br />
                      <span style={{ color: 'var(--ink-muted)', fontSize: '0.75rem' }}>
                        Last active {new Date(d.last_seen).toLocaleString()}
                      </span>
                    </span>
                    {d.device_id !== currentDeviceId && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ fontSize: '0.8125rem' }}
                        onClick={async () => {
                          await sbRemoveUserDevice(d.device_id);
                          setDevices((prev) => prev.filter((x) => x.device_id !== d.device_id));
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {!devices.length && !devicesError && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>No registered devices yet.</p>
              )}
            </div>
          </section>
        )}

        <section className="cms-panel studio-settings-section">
          <div className="studio-settings-section__head">
            <Bell size={18} aria-hidden />
            <h3>Notifications</h3>
          </div>
          <div className="studio-settings-section__body">
            <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', margin: 0 }}>
              In-app alerts for moderation updates and milestones appear in the notification bell. Email notifications coming soon.
            </p>
          </div>
        </section>
      </div>

      <button type="button" className="btn btn-ghost" onClick={handleLogout} style={{ color: 'var(--ember)', marginTop: 8 }}>
        <LogOut size={16} />
        Sign out
      </button>
    </div>
  );
}