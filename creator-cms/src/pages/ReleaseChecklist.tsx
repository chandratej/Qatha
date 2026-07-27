import { useMemo, useState } from 'react';
import { CheckCircle2, Circle, ClipboardList, Download, RotateCcw, SkipForward, XCircle } from 'lucide-react';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import { useLocale } from '../context/LocaleContext';
import {
  RELEASE_CHECKLIST_ITEMS,
  createEmptyChecklistState,
  formatChecklistReport,
  getLatestReleaseId,
  listChecklistSections,
  loadChecklistState,
  saveChecklistState,
  summarizeChecklist,
  type ChecklistItemStatus,
  type ChecklistState,
} from '../lib/releaseChecklist';

function todayReleaseId(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function statusIcon(status: ChecklistItemStatus) {
  if (status === 'pass') return <CheckCircle2 size={18} aria-hidden className="rcl-icon rcl-icon--pass" />;
  if (status === 'fail') return <XCircle size={18} aria-hidden className="rcl-icon rcl-icon--fail" />;
  if (status === 'skip') return <SkipForward size={18} aria-hidden className="rcl-icon rcl-icon--skip" />;
  return <Circle size={18} aria-hidden className="rcl-icon rcl-icon--pending" />;
}

export function ReleaseChecklist() {
  const { locale } = useLocale();
  const te = locale === 'te';

  const [releaseId, setReleaseId] = useState(() => getLatestReleaseId() || todayReleaseId());
  const [releaseLabel, setReleaseLabel] = useState(() => {
    const id = getLatestReleaseId() || todayReleaseId();
    return loadChecklistState(id)?.releaseLabel || `Release ${id}`;
  });
  const [state, setState] = useState<ChecklistState>(() => {
    const id = getLatestReleaseId() || todayReleaseId();
    return loadChecklistState(id) || createEmptyChecklistState(id, `Release ${id}`);
  });
  const [copied, setCopied] = useState(false);

  const sections = useMemo(() => listChecklistSections(), []);
  const summary = useMemo(() => summarizeChecklist(state), [state]);

  const persist = (next: ChecklistState) => {
    saveChecklistState(next);
    setState(next);
  };

  const startOrLoad = () => {
    const id = releaseId.trim() || todayReleaseId();
    const label = releaseLabel.trim() || `Release ${id}`;
    const existing = loadChecklistState(id);
    if (existing) {
      setReleaseId(id);
      setReleaseLabel(existing.releaseLabel || label);
      setState(existing);
      return;
    }
    const fresh = createEmptyChecklistState(id, label);
    setReleaseId(id);
    setReleaseLabel(label);
    persist(fresh);
  };

  const resetBoard = () => {
    if (!window.confirm(te ? 'ఈ రిలీజ్ చెక్‌లిస్ట్‌ను రీసెట్ చేయాలా?' : 'Reset this release checklist?')) return;
    const fresh = createEmptyChecklistState(releaseId, releaseLabel || `Release ${releaseId}`);
    persist(fresh);
  };

  const setItemStatus = (id: string, status: ChecklistItemStatus) => {
    persist({
      ...state,
      items: { ...state.items, [id]: status },
    });
  };

  const setItemNote = (id: string, note: string) => {
    persist({
      ...state,
      itemNotes: { ...state.itemNotes, [id]: note },
    });
  };

  const setNotes = (notes: string) => {
    persist({ ...state, notes });
  };

  const downloadReport = () => {
    const report = formatChecklistReport(state);
    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `katha-release-checklist-${state.releaseId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(formatChecklistReport(state));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const gateLabel = summary.readyToShip
    ? (te ? 'షిప్ చేయవచ్చు' : 'Ready to ship')
    : summary.blocked
      ? (te ? 'బ్లాక్ అయింది' : 'Blocked')
      : (te ? 'పరీక్షలో ఉంది' : 'In progress');

  return (
    <div className="cms-page studio-page release-checklist wc-page-enter">
      <StudioPageHeader
        variant="hero"
        eyebrow={te ? 'రిలీజ్ QA' : 'Release QA'}
        eyebrowIcon={ClipboardList}
        title={te ? 'పోస్ట్-రిలీజ్ చెక్‌లిస్ట్' : 'Post-release checklist'}
        subtitle={
          te
            ? 'ప్రతి డిప్లాయ్ తర్వాత smoke + sanity. క్రిటికల్ ఐటమ్స్ పాస్ అయితేనే ship.'
            : 'Smoke + sanity after every deploy. Ship only when critical items pass.'
        }
      />

      <div className="rcl-toolbar cms-panel">
        <label className="input-group">
          <span>{te ? 'రిలీజ్ ID' : 'Release id'}</span>
          <input
            className="cms-input"
            value={releaseId}
            onChange={(e) => setReleaseId(e.target.value)}
            placeholder="2026-07-27"
          />
        </label>
        <label className="input-group">
          <span>{te ? 'లేబుల్' : 'Label'}</span>
          <input
            className="cms-input"
            value={releaseLabel}
            onChange={(e) => setReleaseLabel(e.target.value)}
            placeholder="MVP CMS typography + create-story fix"
          />
        </label>
        <div className="rcl-toolbar__actions">
          <button type="button" className="katha-cta katha-cta--soft" onClick={startOrLoad}>
            {te ? 'లోడ్ / ప్రారంభం' : 'Load / start'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={resetBoard}>
            <RotateCcw size={16} aria-hidden /> {te ? 'రీసెట్' : 'Reset'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={downloadReport}>
            <Download size={16} aria-hidden /> {te ? 'రిపోర్ట్' : 'Report'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => void copyReport()}>
            {copied ? (te ? 'కాపీ అయింది' : 'Copied') : (te ? 'కాపీ' : 'Copy')}
          </button>
        </div>
      </div>

      <div className={`rcl-summary cms-panel rcl-summary--${summary.readyToShip ? 'ready' : summary.blocked ? 'blocked' : 'progress'}`}>
        <div>
          <p className="rcl-summary__gate">{gateLabel}</p>
          <p className="rcl-summary__meta">
            {summary.pass} pass · {summary.fail} fail · {summary.skip} skip · {summary.pending} pending
            {' · '}
            {summary.completionPct}%
          </p>
          {(summary.criticalFail > 0 || summary.criticalPending > 0) && (
            <p className="rcl-summary__critical">
              {te
                ? `క్రిటికల్: ${summary.criticalFail} fail, ${summary.criticalPending} pending`
                : `Critical: ${summary.criticalFail} fail, ${summary.criticalPending} pending`}
            </p>
          )}
        </div>
        <div className="rcl-summary__bar" aria-hidden>
          <span style={{ width: `${summary.completionPct}%` }} />
        </div>
      </div>

      <label className="input-group cms-panel rcl-notes">
        <span>{te ? 'రిలీజ్ నోట్స్' : 'Release notes / environment'}</span>
        <textarea
          className="cms-input cms-textarea"
          rows={3}
          value={state.notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={
            te
              ? 'ఉదా: production CMS + Render API · migration 045 applied · tester: Father'
              : 'e.g. production CMS + Render API · migration 045 applied · tester: Father'
          }
        />
      </label>

      {sections.map((section) => (
        <section key={section} className="cms-panel rcl-section">
          <h2 className="cms-panel__title">{section}</h2>
          <ul className="rcl-list">
            {RELEASE_CHECKLIST_ITEMS.filter((i) => i.section === section).map((item) => {
              const status = state.items[item.id] ?? 'pending';
              const label = te && item.labelTe ? item.labelTe : item.label;
              return (
                <li key={item.id} className={`rcl-item rcl-item--${status}`}>
                  <div className="rcl-item__head">
                    {statusIcon(status)}
                    <div className="rcl-item__text">
                      <p className="rcl-item__label">
                        {label}
                        {item.critical && (
                          <span className="rcl-critical-badge">{te ? 'క్రిటికల్' : 'Critical'}</span>
                        )}
                      </p>
                      {item.hint && <p className="rcl-item__hint">{item.hint}</p>}
                    </div>
                  </div>
                  <div className="rcl-item__actions" role="group" aria-label={label}>
                    <button
                      type="button"
                      className={`rcl-status-btn${status === 'pass' ? ' is-active' : ''}`}
                      onClick={() => setItemStatus(item.id, 'pass')}
                    >
                      Pass
                    </button>
                    <button
                      type="button"
                      className={`rcl-status-btn rcl-status-btn--fail${status === 'fail' ? ' is-active' : ''}`}
                      onClick={() => setItemStatus(item.id, 'fail')}
                    >
                      Fail
                    </button>
                    <button
                      type="button"
                      className={`rcl-status-btn${status === 'skip' ? ' is-active' : ''}`}
                      onClick={() => setItemStatus(item.id, 'skip')}
                    >
                      Skip
                    </button>
                    <button
                      type="button"
                      className={`rcl-status-btn${status === 'pending' ? ' is-active' : ''}`}
                      onClick={() => setItemStatus(item.id, 'pending')}
                    >
                      Reset
                    </button>
                  </div>
                  <input
                    className="cms-input rcl-item__note"
                    value={state.itemNotes[item.id] || ''}
                    onChange={(e) => setItemNote(item.id, e.target.value)}
                    placeholder={te ? 'నోట్ (ఐచ్ఛికం)' : 'Note (optional)'}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
