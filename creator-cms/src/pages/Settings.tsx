import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Database, LogOut, Smartphone, Coffee, Settings2, FlaskConical, IndianRupee, Download,
} from 'lucide-react';
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
import { api, useSupabaseDirect } from '../lib/api';
import { sbListUserDevices, sbRemoveUserDevice } from '../services';
import { getDeviceId } from '../lib/device';
import type { UserDevice } from '../types/database';
import { isStudioLabsEnabled, setStudioLabsEnabled } from '../lib/featureFlags';
import { trackCreatorEvent } from '../lib/analyticsEvents';
import { NotificationPreferencesPanel } from '../components/settings/NotificationPreferencesPanel';
import { useLocale } from '../context/LocaleContext';

export function Settings() {
  const { t } = useLocale();
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
  const [labsOn, setLabsOn] = useState(() => isStudioLabsEnabled());
  const [payoutUpi, setPayoutUpi] = useState('');
  const [legalName, setLegalName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [payoutMsg, setPayoutMsg] = useState<string | null>(null);
  const [payoutSaving, setPayoutSaving] = useState(false);

  const updateComfort = (patch: Parameters<typeof saveComfortPrefs>[0]) => {
    setComfort(saveComfortPrefs(patch));
  };

  useEffect(() => {
    if (!supabaseDirect || isMockMode) return;
    sbListUserDevices()
      .then(setDevices)
      .catch((e) => setDevicesError(e instanceof Error ? e.message : 'Could not load devices'));
  }, [supabaseDirect, isMockMode]);

  useEffect(() => {
    api.getPayoutProfile()
      .then((p) => {
        setPayoutUpi(p.payout_upi || '');
        setLegalName(p.legal_name || '');
        setTaxId(p.tax_id || '');
      })
      .catch(() => {});
  }, []);

  const handleSavePayout = async () => {
    setPayoutSaving(true);
    setPayoutMsg(null);
    try {
      await api.updatePayoutProfile({
        payout_upi: payoutUpi.trim() || null,
        legal_name: legalName.trim() || null,
        tax_id: taxId.trim() || null,
      });
      trackCreatorEvent('payout_profile_saved');
      setPayoutMsg('Payout details saved. Quarterly reviews verify UPI before transfer.');
    } catch (e) {
      setPayoutMsg(e instanceof Error ? e.message : 'Could not save payout details');
    } finally {
      setPayoutSaving(false);
    }
  };

  const handleExportEarnings = async () => {
    try {
      const d = await api.getDashboard();
      const rows = [
        ['Story ID', 'Title', 'Readers', 'Subscribers', 'Earnings this month (INR)'],
        ...(d.earnings_by_story || []).map((r) => [
          r.story_id,
          r.title,
          r.total_readers,
          r.subscribers,
          r.earnings_this_month,
        ]),
        [],
        ['Total earnings this month', d.earnings_this_month],
        ['Total earnings all time', d.total_earnings],
        ['Next payout date', d.expected_payout_date],
        ['Schedule', d.payout_schedule || 'quarterly'],
      ];
      const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `katha-earnings-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      trackCreatorEvent('earnings_csv_export');
    } catch (e) {
      setPayoutMsg(e instanceof Error ? e.message : 'Export failed');
    }
  };

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
        eyebrow={t('settings.eyebrow')}
        eyebrowIcon={Settings2}
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
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
              Story Trust share: {BRAND.creatorSharePct}% base (up to 60% at Apex) · Quarterly payouts
            </p>
          </div>
        </section>

        <section className="cms-panel studio-settings-section" aria-labelledby="payout-settings-title">
          <div className="studio-settings-section__head">
            <IndianRupee size={18} aria-hidden />
            <h3 id="payout-settings-title">Payout readiness</h3>
          </div>
          <div className="studio-settings-section__body">
            <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginBottom: 16, lineHeight: 1.55 }}>
              Quarterly Story Trust payouts require a verified UPI ID and legal name matching your tax records.
              No coins, no tips — literary earnings only.
            </p>
            <div style={{ display: 'grid', gap: 12 }}>
              <label className="studio-settings-field">
                <span>Legal name (as on UPI / PAN)</span>
                <input
                  className="cms-input"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="Full legal name"
                  autoComplete="name"
                />
              </label>
              <label className="studio-settings-field">
                <span>UPI ID</span>
                <input
                  className="cms-input"
                  value={payoutUpi}
                  onChange={(e) => setPayoutUpi(e.target.value)}
                  placeholder="name@upi"
                  autoComplete="off"
                />
              </label>
              <label className="studio-settings-field">
                <span>PAN / tax ID (optional until first payout)</span>
                <input
                  className="cms-input"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  maxLength={12}
                  autoComplete="off"
                />
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="katha-cta"
                  onClick={() => { void handleSavePayout(); }}
                  disabled={payoutSaving}
                >
                  {payoutSaving ? 'Saving…' : 'Save payout details'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { void handleExportEarnings(); }}>
                  <Download size={16} aria-hidden /> Export earnings CSV
                </button>
              </div>
              {payoutMsg && (
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--ink-soft)' }}>{payoutMsg}</p>
              )}
            </div>
          </div>
        </section>

        <section className="cms-panel studio-settings-section">
          <div className="studio-settings-section__head">
            <FlaskConical size={18} aria-hidden />
            <h3>Studio Labs</h3>
          </div>
          <div className="studio-settings-section__body">
            <p style={{ margin: '0 0 12px', fontSize: '0.875rem', color: 'var(--ink-muted)', lineHeight: 1.55 }}>
              Tags admin and the platform map stay off by default (DEC-007). Literary Council reviews
              and Events are always in core nav — trust and contests are not experiments.
            </p>
            <label className="studio-settings-row" style={{ cursor: 'pointer' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>Enable Labs surfaces</span>
              <input
                type="checkbox"
                checked={labsOn}
                onChange={(e) => {
                  const next = e.target.checked;
                  setStudioLabsEnabled(next);
                  setLabsOn(next);
                }}
                aria-label="Enable Studio Labs"
              />
            </label>
            {labsOn && (
              <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                Tags and Platform map are now available in Community and command palette.
              </p>
            )}
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
              Drafts autosave to IndexedDB offline (72-hour local history) and cloud version snapshots when connected
              (Cycle 7). Publish status changes appear in the notification bell after moderation.
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

        <NotificationPreferencesPanel />
      </div>

      <button type="button" className="btn btn-ghost" onClick={handleLogout} style={{ color: 'var(--ember)', marginTop: 8 }}>
        <LogOut size={16} />
        Sign out
      </button>
    </div>
  );
}