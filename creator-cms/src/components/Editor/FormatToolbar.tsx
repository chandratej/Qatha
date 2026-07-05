import {
  Keyboard, Wand2, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, Link,
  Undo2, Redo2,
} from 'lucide-react';

interface FormatToolbarProps {
  phoneticLive: boolean;
  onTogglePhonetic: () => void;
  onConvertAll: () => void;
  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
  onAlign: (align: 'left' | 'center' | 'right') => void;
  onUndo: () => void;
  onRedo: () => void;
}

export function FormatToolbar({
  phoneticLive,
  onTogglePhonetic,
  onConvertAll,
  onBold,
  onItalic,
  onUnderline,
  onAlign,
  onUndo,
  onRedo,
}: FormatToolbarProps) {
  return (
    <div className="katha-proto-format-toolbar">
      <button
        type="button"
        className={`katha-proto-fmt-btn${phoneticLive ? ' active' : ''}`}
        onClick={onTogglePhonetic}
      >
        <Keyboard size={14} /> Phonetic live
      </button>
      <button type="button" className="katha-proto-fmt-btn" onClick={onConvertAll}>
        <Wand2 size={14} /> Convert all
      </button>

      <div className="katha-proto-fmt-divider" />

      <button type="button" className="katha-proto-fmt-btn icon-only" onClick={onBold} title="Bold">
        <Bold size={14} />
      </button>
      <button type="button" className="katha-proto-fmt-btn icon-only" onClick={onItalic} title="Italic">
        <Italic size={14} />
      </button>
      <button type="button" className="katha-proto-fmt-btn icon-only" onClick={onUnderline} title="Underline">
        <Underline size={14} />
      </button>

      <div className="katha-proto-fmt-divider" />

      <button type="button" className="katha-proto-fmt-btn icon-only" onClick={() => onAlign('left')} title="Align left">
        <AlignLeft size={14} />
      </button>
      <button type="button" className="katha-proto-fmt-btn icon-only" onClick={() => onAlign('center')} title="Align center">
        <AlignCenter size={14} />
      </button>
      <button type="button" className="katha-proto-fmt-btn icon-only" onClick={() => onAlign('right')} title="Align right">
        <AlignRight size={14} />
      </button>
      <button type="button" className="katha-proto-fmt-btn icon-only" title="Link">
        <Link size={14} />
      </button>

      <div className="katha-proto-fmt-divider" />

      <button type="button" className="katha-proto-fmt-btn icon-only" onClick={onUndo} title="Undo">
        <Undo2 size={14} />
      </button>
      <button type="button" className="katha-proto-fmt-btn icon-only" onClick={onRedo} title="Redo">
        <Redo2 size={14} />
      </button>
    </div>
  );
}