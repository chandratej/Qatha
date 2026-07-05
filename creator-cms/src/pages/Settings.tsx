import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Database, LogOut, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
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
    <div className="cms-page">
      <header className="cms-page-header">
        <div>
          <h1 className="cms-page-header__title">Settings</h1>
          <p className="cms-page-header__subtitle">Account, appearance, and local data preferences.</p>
        </div>
      </header>

      <div className="cms-panel cms-panel--flat" style={{ marginBottom: 20 }}>
        <div className="cms-panel__head">
          <h3 className="cms-panel__title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={18} />
            Creator profile
          </h3>
        </div>
        <div style={{ padding: '0 4px' }}>
          <p style={{ margin: '0 0 8px', color: 'var(--ink)' }}>
            <strong>{user?.display_name || 'Creator'}</strong>
          </p>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ink-muted)' }}>{user?.phone || '—'}</p>
          <p style={{ margin: '12px 0 0', fontSize: '0.8125rem', color: 'var(--ink-soft)' }}>
            Revenue share: {BRAND.creatorSharePct}% creator / {BRAND.platformSharePct}% platform · Payouts on the 15th
          </p>
        </div>
      </div>

      <div className="cms-panel cms-panel--flat" style={{ marginBottom: 20 }}>
        <div className="cms-panel__head">
          <h3 className="cms-panel__title" style={{ margin: 0 }}>Appearance</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>Theme (sepia / night)</span>
          <ThemeToggle compact />
        </div>
      </div>

      <div className="cms-panel cms-panel--flat" style={{ marginBottom: 20 }}>
        <div className="cms-panel__head">
          <h3 className="cms-panel__title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={18} />
            Local drafts
          </h3>
        </div>
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

      {supabaseDirect && !isMockMode && (
        <div className="cms-panel cms-panel--flat" style={{ marginBottom: 20 }}>
          <div className="cms-panel__head">
            <h3 className="cms-panel__title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Smartphone size={18} />
              Manage devices
            </h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginBottom: 12, lineHeight: 1.55 }}>
            Up to 2 active devices. Oldest inactive sessions are signed out automatically (§6 staleness policy).
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
      )}

      <div className="cms-panel cms-panel--flat" style={{ marginBottom: 20 }}>
        <div className="cms-panel__head">
          <h3 className="cms-panel__title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={18} />
            Notifications
          </h3>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', margin: 0 }}>
          In-app alerts for moderation updates and milestones appear in the sidebar bell. Email notifications coming soon.
        </p>
      </div>

      <button type="button" className="btn btn-ghost" onClick={handleLogout} style={{ color: 'var(--ember)' }}>
        <LogOut size={16} />
        Sign out
      </button>
    </div>
  );
}