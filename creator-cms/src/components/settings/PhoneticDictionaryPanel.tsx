import { useEffect, useMemo, useState } from 'react';
import { BookType, Download, Plus, Trash2 } from 'lucide-react';
import {
  deletePersonalCorrection,
  exportPersonalCorrectionsJson,
  getPersonalCorrections,
  importPersonalCorrections,
  setPersonalCorrection,
  syncPhoneticCorrectionsFromCloud,
} from '../../lib/phonetic';
import { useLocale } from '../../context/LocaleContext';
import { trackCreatorEvent } from '../../lib/analyticsEvents';

/**
 * Personal phonetic dictionary — primary switching-cost moat.
 * Visible, exportable, cloud-synced corrections (names, places, dialect).
 */
export function PhoneticDictionaryPanel() {
  const { locale } = useLocale();
  const te = locale === 'te';
  const [tick, setTick] = useState(0);
  const [keyIn, setKeyIn] = useState('');
  const [valIn, setValIn] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void syncPhoneticCorrectionsFromCloud().then(() => setTick((n) => n + 1));
  }, []);

  const entries = useMemo(() => {
    void tick;
    return Object.entries(getPersonalCorrections()).sort(([a], [b]) => a.localeCompare(b));
  }, [tick]);

  const refresh = () => setTick((n) => n + 1);

  const handleAdd = () => {
    if (!keyIn.trim() || !valIn.trim()) return;
    setPersonalCorrection(keyIn, valIn);
    setKeyIn('');
    setValIn('');
    refresh();
    trackCreatorEvent('phonetic_dict_add');
    setMsg(te ? 'సేవ్ అయింది — అన్ని పరికరాలకు సింక్' : 'Saved — syncs across your devices');
  };

  const handleExport = () => {
    const blob = new Blob([exportPersonalCorrectionsJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `katha-phonetic-dictionary-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    trackCreatorEvent('phonetic_dict_export', { count: entries.length });
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      let map: Record<string, string> = {};
      if (parsed && typeof parsed === 'object') {
        const obj = parsed as Record<string, unknown>;
        if (obj.corrections && typeof obj.corrections === 'object') {
          map = obj.corrections as Record<string, string>;
        } else {
          map = obj as Record<string, string>;
        }
      }
      const n = importPersonalCorrections(map);
      refresh();
      setMsg(te ? `${n} ఎంట్రీలు దిగుమతి` : `Imported ${n} entries`);
      trackCreatorEvent('phonetic_dict_import', { count: n });
    } catch {
      setMsg(te ? 'దిగుమతి విఫలం' : 'Import failed');
    }
  };

  return (
    <section className="cms-panel settings-phonetic-dict" aria-labelledby="phonetic-dict-title">
      <h3 id="phonetic-dict-title" className="cms-panel__title">
        <BookType size={18} aria-hidden />
        {te ? 'వ్యక్తిగత ఫొనెటిక్ నిఘంటువు' : 'Personal phonetic dictionary'}
      </h3>
      <p className="input-hint" style={{ marginTop: 0 }}>
        {te
          ? 'పాత్రల పేర్లు, స్థలాలు, మాండలికాలు — మీరు పిన్ చేసిన ప్రతి సవరణ రాబోయే అధ్యాయాలను వేగవంతం చేస్తుంది. ఇది మీ స్వంత ఆస్తి; వేరే ఎడిటర్‌లో మళ్ళీ నేర్చుకోవాల్సి వస్తుంది.'
          : 'Character names, places, dialect spellings — every pinned correction makes the next chapter faster. This is your asset; leaving means training another editor from zero.'}
      </p>

      <div className="settings-phonetic-dict__add">
        <input
          type="text"
          value={keyIn}
          onChange={(e) => setKeyIn(e.target.value)}
          placeholder={te ? 'రోమన్ (e.g. vaikuntapuram)' : 'Roman (e.g. vaikuntapuram)'}
          aria-label={te ? 'ఫొనెటిక్ ఇన్‌పుట్' : 'Phonetic input'}
        />
        <input
          type="text"
          value={valIn}
          onChange={(e) => setValIn(e.target.value)}
          placeholder={te ? 'తెలుగు (e.g. వైకుంఠపురం)' : 'Telugu (e.g. వైకుంఠపురం)'}
          lang="te"
          aria-label={te ? 'తెలుగు సవరణ' : 'Telugu correction'}
        />
        <button type="button" className="btn btn-primary" onClick={handleAdd}>
          <Plus size={14} aria-hidden /> {te ? 'జోడించు' : 'Add'}
        </button>
      </div>

      <div className="settings-phonetic-dict__toolbar">
        <button type="button" className="btn btn-secondary" onClick={handleExport} disabled={!entries.length}>
          <Download size={14} aria-hidden /> {te ? 'JSON ఎగుమతి' : 'Export JSON'}
        </button>
        <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
          {te ? 'JSON దిగుమతి' : 'Import JSON'}
          <input
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleImportFile(f);
              e.target.value = '';
            }}
          />
        </label>
        <span className="input-hint">
          {entries.length} {te ? 'ఎంట్రీలు' : 'entries'}
        </span>
      </div>

      {msg && <p className="input-hint" role="status">{msg}</p>}

      {entries.length === 0 ? (
        <p className="settings-phonetic-dict__empty">
          {te
            ? 'ఇంకా ఎంట్రీలు లేవు. ఎడిటర్‌లో సూచనలను అంగీకరించండి లేదా ఇక్కడ జోడించండి.'
            : 'No entries yet. Accept suggestions in the editor or add names here.'}
        </p>
      ) : (
        <ul className="settings-phonetic-dict__list">
          {entries.map(([k, v]) => (
            <li key={k}>
              <code>{k}</code>
              <span aria-hidden>→</span>
              <strong lang="te">{v}</strong>
              <button
                type="button"
                className="btn btn-ghost"
                aria-label={te ? `${k} తొలగించు` : `Delete ${k}`}
                onClick={() => {
                  deletePersonalCorrection(k);
                  refresh();
                }}
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
