import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Database, LogOut, Smartphone, Coffee, Settings2, FlaskConical, IndianRupee, Download, ClipboardList,
} from 'lucide-react';
import {
  loadComfortPrefs,
  saveComfortPrefs,
  fontScaleLabel,
  lineHeightLabel,
  breakReminderLabel,
  editorFontSizePx,
  uiScaleLabel,
  type FontScale,
  type LineHeightScale,
  type BreakReminderMinutes,
  type UiScale,
} from '../lib/comfortPrefs';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import type { CmsThemePref } from '../lib/themePrefs';
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
import { PhoneticDictionaryPanel } from '../components/settings/PhoneticDictionaryPanel';
import { useLocale } from '../context/LocaleContext';

/** Extra Settings strings (keeps studioLocale churn small; te-first for senior creators). */
const SX = {
  en: {
    storyTrustLine: (pct: number) =>
      `Story Trust share: ${pct}% base (up to 60% at Apex) · Quarterly payouts`,
    noCoinsNote: 'No coins, no tips — literary earnings only.',
    legalNamePh: 'Full legal name',
    exportCsv: 'Export earnings CSV',
    releaseTitle: 'Release checklist',
    releaseLead: 'After each deploy: smoke + sanity board. Mark pass/fail before shipping.',
    releaseOpen: 'Open release checklist',
    labsLead:
      'Tags admin and the platform map stay off by default. Literary Council reviews and Events stay in core nav.',
    enableLabs: 'Enable Labs surfaces',
    labsOnHint: 'Tags and Platform map are now available in Community and the command palette.',
    theme: 'Theme',
    themeSystem: 'Match system — follows your device day/night schedule',
    themeLight: 'Paper (soft daylight) — best for daytime writing',
    themeDark: 'Night (low glare) — best for evenings',
    themeHint:
      'Paper mode uses low-glare warm ivory with deep ink. Night mode is a warm low-blue dark for evenings.',
    uiSize: 'Interface text size',
    scaleCompact: 'Compact',
    scaleDefault: 'Default',
    scaleComfort: 'Comfort — recommended for long sessions',
    scaleLarge: 'Large',
    calmMotion: 'Calm motion — reduce animation across the studio',
    highContrast: 'High contrast — stronger text and panel borders (glare / tired eyes)',
    writingDefaults:
      'Defaults favour longer sessions: larger type and spacious line height. Adjust anytime — preferences stay on this device.',
    writingLead:
      'Tune the chapter editor for long sessions. Text size matches the reader app scale. Break reminders appear only while you are editing with this tab open.',
  },
  te: {
    storyTrustLine: (pct: number) =>
      `Story Trust షేర్: ${pct}% బేస్ (Apex వద్ద 60% వరకు) · త్రైమాసిక చెల్లింపులు`,
    noCoinsNote: 'కాయిన్లు లేవు, టిప్స్ లేవు — సాహిత్య ఆదాయం మాత్రమే.',
    legalNamePh: 'పూర్తి చట్టపరమైన పేరు',
    exportCsv: 'ఆదాయాల CSV ఎగుమతి',
    releaseTitle: 'రిలీజ్ చెక్‌లిస్ట్',
    releaseLead: 'ప్రతి డిప్లాయ్ తర్వాత: స్మోక్ + శానిటీ బోర్డ్. షిప్ చేయడానికి ముందు pass/fail గుర్తు పెట్టండి.',
    releaseOpen: 'రిలీజ్ చెక్‌లిస్ట్ తెరవండి',
    labsLead:
      'Tags అడ్మిన్ మరియు ప్లాట్‌ఫామ్ మ్యాప్ డిఫాల్ట్‌గా ఆఫ్. Literary Council రివ్యూలు మరియు ఈవెంట్‌లు కోర్ నావ్‌లో ఉంటాయి.',
    enableLabs: 'Labs ఉపరితలాలను ఆన్ చేయండి',
    labsOnHint: 'Tags మరియు Platform map ఇప్పుడు Community మరియు కమాండ్ పాలెట్‌లో అందుబాటులో ఉన్నాయి.',
    theme: 'థీమ్',
    themeSystem: 'సిస్టమ్‌తో సరిపోల్చండి — పరికర పగలు/రాత్రి షెడ్యూల్',
    themeLight: 'పేపర్ (సాఫ్ట్ డేలైట్) — పగటి రచనకు మంచిది',
    themeDark: 'నైట్ (తక్కువ గ్లేర్) — సాయంత్రాలకు మంచిది',
    themeHint:
      'పేపర్ మోడ్ వెచ్చని ఐవరీ + లోతైన ఇంక్. నైట్ మోడ్ వెచ్చని లో-బ్లూ డార్క్.',
    uiSize: 'ఇంటర్‌ఫేస్ టెక్స్ట్ సైజు',
    scaleCompact: 'కాంపాక్ట్',
    scaleDefault: 'డిఫాల్ట్',
    scaleComfort: 'కంఫర్ట్ — దీర్ఘ సెషన్లకు సిఫార్సు',
    scaleLarge: 'పెద్దది',
    calmMotion: 'కామ్ మోషన్ — స్టూడియో అంతటా యానిమేషన్ తగ్గించండి',
    highContrast: 'హై కాంట్రాస్ట్ — బలమైన టెక్స్ట్ మరియు ప్యానెల్ బార్డర్లు',
    writingDefaults:
      'డిఫాల్ట్‌లు దీర్ఘ సెషన్లకు: పెద్ద టైప్ + విశాల లైన్ ఎత్తు. ఎప్పుడైనా మార్చండి — ఈ పరికరంపైనే సేవ్.',
    writingLead:
      'చాప్టర్ ఎడిటర్‌ను దీర్ఘ సెషన్లకు అమర్చండి. టెక్స్ట్ సైజు రీడర్ యాప్ స్కేల్‌తో సరిపోతుంది. బ్రేక్ రిమైండర్లు ఎడిట్ చేస్తున్నప్పుడు మాత్రమే.',
  },
} as const;

function sx(locale: string, key: keyof typeof SX.en, pct?: number): string {
  const pack = locale === 'te' ? SX.te : SX.en;
  const v = pack[key];
  return typeof v === 'function' ? v(pct ?? 40) : v;
}

export function Settings() {
  const { t, locale } = useLocale();
  const { user, logout, isMockMode } = useAuth();
  const { themePref, setTheme } = useTheme();
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
  const [payoutMsgTone, setPayoutMsgTone] = useState<'success' | 'error' | null>(null);
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
    setPayoutMsgTone(null);
    try {
      await api.updatePayoutProfile({
        payout_upi: payoutUpi.trim() || null,
        legal_name: legalName.trim() || null,
        tax_id: taxId.trim() || null,
      });
      trackCreatorEvent('payout_profile_saved');
      setPayoutMsgTone('success');
      setPayoutMsg('Payout details saved. Quarterly reviews verify UPI before transfer.');
    } catch (e) {
      setPayoutMsgTone('error');
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
      setPayoutMsgTone('error');
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
    <div className="cms-page studio-page settings-studio--premium wc-page-enter">
      <StudioPageHeader
        variant="hero"
        eyebrow={t('settings.eyebrow')}
        eyebrowIcon={Settings2}
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
      />

      <div className="studio-settings-grid wc-stagger-children">
        <PhoneticDictionaryPanel />

        <section className="cms-panel studio-settings-section">
          <div className="studio-settings-section__head">
            <User size={18} aria-hidden />
            <h3>{t('settings.profile')}</h3>
          </div>
          <div className="studio-settings-section__body">
            <p style={{ margin: '0 0 8px', color: 'var(--ink)' }}>
              <strong>{user?.display_name || t('settings.profile')}</strong>
            </p>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ink-muted)' }}>{user?.phone || '—'}</p>
            <p style={{ margin: '12px 0 0', fontSize: '0.8125rem', color: 'var(--ink-soft)' }}>
              {sx(locale, 'storyTrustLine', BRAND.creatorSharePct)}
            </p>
          </div>
        </section>

        <section className="cms-panel studio-settings-section" aria-labelledby="payout-settings-title">
          <div className="studio-settings-section__head">
            <IndianRupee size={18} aria-hidden />
            <h3 id="payout-settings-title">{t('settings.payout')}</h3>
          </div>
          <div className="studio-settings-section__body">
            <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginBottom: 16, lineHeight: 1.55 }}>
              {t('settings.payoutLead')}{' '}
              {sx(locale, 'noCoinsNote')}
            </p>
            <div style={{ display: 'grid', gap: 12 }}>
              <label className="studio-settings-field">
                <span>{t('settings.legalName')}</span>
                <input
                  className="cms-input"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder={sx(locale, 'legalNamePh')}
                  autoComplete="name"
                />
              </label>
              <label className="studio-settings-field">
                <span>{t('settings.upi')}</span>
                <input
                  className="cms-input"
                  value={payoutUpi}
                  onChange={(e) => setPayoutUpi(e.target.value)}
                  placeholder="name@upi"
                  autoComplete="off"
                />
              </label>
              <label className="studio-settings-field">
                <span>{t('settings.taxId')}</span>
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
                  {payoutSaving ? t('settings.saving') : t('settings.savePayout')}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { void handleExportEarnings(); }}>
                  <Download size={16} aria-hidden /> {sx(locale, 'exportCsv')}
                </button>
              </div>
              {payoutMsg && (
                <p
                  role={payoutMsgTone === 'error' ? 'alert' : 'status'}
                  style={{
                    margin: 0,
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    color: payoutMsgTone === 'error'
                      ? 'var(--katha-ember, #8B3A62)'
                      : 'var(--accent-sage, #5f7a5a)',
                  }}
                >
                  {payoutMsg}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="cms-panel studio-settings-section">
          <div className="studio-settings-section__head">
            <ClipboardList size={18} aria-hidden />
            <h3>{sx(locale, 'releaseTitle')}</h3>
          </div>
          <div className="studio-settings-section__body">
            <p style={{ margin: '0 0 12px', fontSize: '0.875rem', color: 'var(--ink-muted)', lineHeight: 1.55 }}>
              {sx(locale, 'releaseLead')}
            </p>
            <Link to="/release-checklist" className="katha-cta katha-cta--soft">
              <ClipboardList size={16} aria-hidden /> {sx(locale, 'releaseOpen')}
            </Link>
          </div>
        </section>

        <section className="cms-panel studio-settings-section">
          <div className="studio-settings-section__head">
            <FlaskConical size={18} aria-hidden />
            <h3>{t('settings.labs')}</h3>
          </div>
          <div className="studio-settings-section__body">
            <p style={{ margin: '0 0 12px', fontSize: '0.875rem', color: 'var(--ink-muted)', lineHeight: 1.55 }}>
              {sx(locale, 'labsLead')}
            </p>
            <label className="studio-settings-row" style={{ cursor: 'pointer' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>{sx(locale, 'enableLabs')}</span>
              <input
                type="checkbox"
                checked={labsOn}
                onChange={(e) => {
                  const next = e.target.checked;
                  setStudioLabsEnabled(next);
                  setLabsOn(next);
                }}
                aria-label={sx(locale, 'enableLabs')}
              />
            </label>
            {labsOn && (
              <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                {sx(locale, 'labsOnHint')}
              </p>
            )}
          </div>
        </section>

        <section className="cms-panel studio-settings-section">
          <div className="studio-settings-section__head">
            <h3>{t('settings.appearance')}</h3>
          </div>
          <div className="studio-settings-section__body">
            <div style={{ display: 'grid', gap: 16 }}>
              <label className="studio-settings-field">
                <span>{sx(locale, 'theme')}</span>
                <select
                  className="cms-input"
                  value={themePref}
                  onChange={(e) => setTheme(e.target.value as CmsThemePref)}
                  aria-label={sx(locale, 'theme')}
                >
                  <option value="system">{sx(locale, 'themeSystem')}</option>
                  <option value="light">{sx(locale, 'themeLight')}</option>
                  <option value="dark">{sx(locale, 'themeDark')}</option>
                </select>
              </label>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--ink-muted)', lineHeight: 1.45 }}>
                {sx(locale, 'themeHint')}
              </p>
              <label className="studio-settings-field">
                <span>{sx(locale, 'uiSize')} — {uiScaleLabel(comfort.uiScale)}</span>
                <select
                  className="cms-input"
                  value={comfort.uiScale}
                  onChange={(e) => updateComfort({ uiScale: Number(e.target.value) as UiScale })}
                  aria-label={sx(locale, 'uiSize')}
                >
                  <option value={1}>{sx(locale, 'scaleCompact')}</option>
                  <option value={2}>{sx(locale, 'scaleDefault')}</option>
                  <option value={3}>{sx(locale, 'scaleComfort')}</option>
                  <option value={4}>{sx(locale, 'scaleLarge')}</option>
                </select>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={comfort.calmMotion}
                  onChange={(e) => updateComfort({ calmMotion: e.target.checked })}
                />
                <span>{sx(locale, 'calmMotion')}</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={comfort.highContrast}
                  onChange={(e) => updateComfort({ highContrast: e.target.checked })}
                />
                <span>{sx(locale, 'highContrast')}</span>
              </label>
            </div>
          </div>
        </section>

        <section className="cms-panel studio-settings-section">
          <div className="studio-settings-section__head">
            <Coffee size={18} aria-hidden />
            <h3>{t('settings.comfort')}</h3>
            <p style={{ margin: '0 0 12px', fontSize: '0.8125rem', color: 'var(--ink-muted)', lineHeight: 1.45 }}>
              {sx(locale, 'writingDefaults')}
            </p>
          </div>
          <div className="studio-settings-section__body">
            <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginBottom: 16, lineHeight: 1.55 }}>
              {sx(locale, 'writingLead')}
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