import { memo } from 'react';
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
  onSceneBreak: () => void;
  onLink: () => void;
  hideHistory?: boolean;
}

export const FormatToolbar = memo(function FormatToolbar({
  phoneticLive,
  onTogglePhonetic,
  onConvertAll,
  onBold,
  onItalic,
  onUnderline,
  onAlign,
  onUndo,
  onRedo,
  onSceneBreak,
  onLink,
  hideHistory = false,
}: FormatToolbarProps) {
  return (
    <div className="katha-proto-format-toolbar katha-proto-format-toolbar--compact" role="toolbar" aria-label="Formatting">
      <div className="katha-proto-fmt-group" aria-label="Telugu tools">
        <button
          type="button"
          className={`katha-proto-fmt-btn${phoneticLive ? ' active' : ''}`}
          onClick={onTogglePhonetic}
          title="Phonetic live typing"
        >
          <Keyboard size={15} />
        </button>
        <button type="button" className="katha-proto-fmt-btn" onClick={onConvertAll} title="Convert all roman to Telugu">
          <Wand2 size={15} />
        </button>
      </div>

      <div className="katha-proto-fmt-divider" aria-hidden />

      <div className="katha-proto-fmt-group" aria-label="Text formatting">
        <button type="button" className="katha-proto-fmt-btn icon-only" onClick={onBold} title="Bold">
          <Bold size={15} />
        </button>
        <button type="button" className="katha-proto-fmt-btn icon-only" onClick={onItalic} title="Italic">
          <Italic size={15} />
        </button>
        <button type="button" className="katha-proto-fmt-btn icon-only" onClick={onUnderline} title="Underline">
          <Underline size={15} />
        </button>
      </div>

      <div className="katha-proto-fmt-divider" aria-hidden />

      <div className="katha-proto-fmt-group" aria-label="Paragraph alignment">
        <button type="button" className="katha-proto-fmt-btn icon-only" onClick={() => onAlign('left')} title="Align left">
          <AlignLeft size={15} />
        </button>
        <button type="button" className="katha-proto-fmt-btn icon-only" onClick={() => onAlign('center')} title="Align center">
          <AlignCenter size={15} />
        </button>
        <button type="button" className="katha-proto-fmt-btn icon-only" onClick={() => onAlign('right')} title="Align right">
          <AlignRight size={15} />
        </button>
      </div>

      <div className="katha-proto-fmt-divider" aria-hidden />

      <div className="katha-proto-fmt-group" aria-label="Insert">
        <button type="button" className="katha-proto-fmt-btn icon-only" onClick={onLink} title="Insert link">
          <Link size={15} />
        </button>
        <button type="button" className="katha-proto-fmt-btn" onClick={onSceneBreak} title="Insert scene break">
          ***
        </button>
      </div>

      {!hideHistory && (
        <>
          <div className="katha-proto-fmt-divider" aria-hidden />
          <div className="katha-proto-fmt-group" aria-label="Undo and redo">
            <button type="button" className="katha-proto-fmt-btn icon-only" onClick={onUndo} title="Undo">
              <Undo2 size={15} />
            </button>
            <button type="button" className="katha-proto-fmt-btn icon-only" onClick={onRedo} title="Redo">
              <Redo2 size={15} />
            </button>
          </div>
        </>
      )}
    </div>
  );
});