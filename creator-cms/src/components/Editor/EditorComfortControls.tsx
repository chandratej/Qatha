import { Minus, Plus } from 'lucide-react';
import type { FontScale } from '../../lib/comfortPrefs';
import { editorFontSizePx, fontScaleLabel } from '../../lib/comfortPrefs';

interface EditorComfortControlsProps {
  fontScale: FontScale;
  onFontScaleChange: (scale: FontScale) => void;
  compact?: boolean;
}

export function EditorComfortControls({
  fontScale,
  onFontScaleChange,
  compact = false,
}: EditorComfortControlsProps) {
  const decrease = () => onFontScaleChange(Math.max(1, fontScale - 1) as FontScale);
  const increase = () => onFontScaleChange(Math.min(5, fontScale + 1) as FontScale);
  const label = fontScaleLabel(fontScale);
  const px = editorFontSizePx(fontScale);

  return (
    <div
      className={`editor-comfort${compact ? ' editor-comfort--compact' : ''}`}
      role="group"
      aria-label="Editor text size"
    >
      <button
        type="button"
        className="editor-comfort__btn"
        onClick={decrease}
        disabled={fontScale <= 1}
        aria-label="Decrease text size"
        title="Smaller text"
      >
        <Minus size={14} />
        <span className="editor-comfort__glyph" aria-hidden>A</span>
      </button>
      <span className="editor-comfort__label" title={`${label} (${px}px)`}>
        {compact ? `${px}px` : label}
      </span>
      <button
        type="button"
        className="editor-comfort__btn"
        onClick={increase}
        disabled={fontScale >= 5}
        aria-label="Increase text size"
        title="Larger text"
      >
        <Plus size={14} />
        <span className="editor-comfort__glyph editor-comfort__glyph--large" aria-hidden>A</span>
      </button>
    </div>
  );
}