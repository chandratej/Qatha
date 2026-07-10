import { useEffect, useState } from 'react';
import { Type } from 'lucide-react';
import {
  editorFontSizePx,
  editorLineHeight,
  fontScaleLabel,
  lineHeightLabel,
  loadComfortPrefs,
  saveComfortPrefs,
  type FontScale,
  type LineHeightScale,
} from '../../../lib/comfortPrefs';

export function ReviewComfortBar() {
  const [fontScale, setFontScale] = useState<FontScale>(() => loadComfortPrefs().fontScale);
  const [lineHeightScale, setLineHeightScale] = useState<LineHeightScale>(
    () => loadComfortPrefs().lineHeightScale,
  );

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--rw-reading-size', `${editorFontSizePx(fontScale)}px`);
    root.style.setProperty('--rw-reading-leading', String(editorLineHeight(lineHeightScale)));
  }, [fontScale, lineHeightScale]);

  useEffect(() => {
    const onUpdate = () => {
      const p = loadComfortPrefs();
      setFontScale(p.fontScale);
      setLineHeightScale(p.lineHeightScale);
    };
    window.addEventListener('katha-comfort-prefs-updated', onUpdate);
    return () => window.removeEventListener('katha-comfort-prefs-updated', onUpdate);
  }, []);

  return (
    <div className="rw-comfort" role="group" aria-label="Reading comfort">
      <Type size={14} aria-hidden className="rw-comfort__icon" />
      <label className="rw-comfort__control">
        <span>Text</span>
        <select
          className="rw-comfort__select"
          value={fontScale}
          onChange={(e) => {
            const next = Number(e.target.value) as FontScale;
            setFontScale(next);
            saveComfortPrefs({ fontScale: next });
          }}
          aria-label="Reading text size"
        >
          {([1, 2, 3, 4, 5] as FontScale[]).map((s) => (
            <option key={s} value={s}>{fontScaleLabel(s)}</option>
          ))}
        </select>
      </label>
      <label className="rw-comfort__control">
        <span>Spacing</span>
        <select
          className="rw-comfort__select"
          value={lineHeightScale}
          onChange={(e) => {
            const next = Number(e.target.value) as LineHeightScale;
            setLineHeightScale(next);
            saveComfortPrefs({ lineHeightScale: next });
          }}
          aria-label="Line spacing"
        >
          {([1, 2, 3] as LineHeightScale[]).map((s) => (
            <option key={s} value={s}>{lineHeightLabel(s)}</option>
          ))}
        </select>
      </label>
    </div>
  );
}