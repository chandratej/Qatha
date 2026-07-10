import { memo, useState, useRef, useEffect } from 'react';
import {
  Keyboard, Wand2, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, Link,
  Undo2, Redo2, MoreHorizontal, Sparkles, SeparatorHorizontal,
} from 'lucide-react';
import { EDITOR_ICON_STROKE } from '../../lib/editorIcons';
import { ToolbarTooltip } from './ToolbarTooltip';

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
  minimal?: boolean;
  onOpenAi?: () => void;
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
  minimal = false,
  onOpenAi,
}: FormatToolbarProps) {
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!overflowOpen) return;
    const close = (e: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setOverflowOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [overflowOpen]);

  if (minimal) {
    return (
      <div className="katha-proto-format-toolbar katha-proto-format-toolbar--focus" role="toolbar" aria-label="Focus formatting">
        <button type="button" className="katha-proto-fmt-btn icon-only" onClick={onBold} title="Bold (Ctrl+B)" aria-label="Bold">
          <Bold size={15} strokeWidth={EDITOR_ICON_STROKE} />
        </button>
        <button type="button" className="katha-proto-fmt-btn icon-only" onClick={onItalic} title="Italic (Ctrl+I)" aria-label="Italic">
          <Italic size={15} strokeWidth={EDITOR_ICON_STROKE} />
        </button>
        <div className="katha-proto-fmt-divider" aria-hidden />
        <button type="button" className="katha-proto-fmt-btn icon-only" onClick={onUndo} title="Undo (Ctrl+Z)" aria-label="Undo">
          <Undo2 size={15} strokeWidth={EDITOR_ICON_STROKE} />
        </button>
        <button type="button" className="katha-proto-fmt-btn icon-only" onClick={onRedo} title="Redo (Ctrl+Y)" aria-label="Redo">
          <Redo2 size={15} strokeWidth={EDITOR_ICON_STROKE} />
        </button>
        <div className="katha-proto-fmt-divider" aria-hidden />
        <button
          type="button"
          className={`katha-proto-fmt-btn katha-proto-fmt-btn--telugu-moat${phoneticLive ? ' active' : ''}`}
          onClick={onTogglePhonetic}
          title="Phonetic Telugu typing"
          aria-pressed={phoneticLive}
        >
          <Keyboard size={15} strokeWidth={EDITOR_ICON_STROKE} />
        </button>
        {onOpenAi && (
          <button
            type="button"
            className="katha-proto-fmt-btn katha-proto-fmt-btn--ai"
            onClick={onOpenAi}
            title="AI writing companion"
          >
            <Sparkles size={15} strokeWidth={EDITOR_ICON_STROKE} />
            <span>AI</span>
          </button>
        )}
        <div className="katha-proto-fmt-overflow" ref={overflowRef}>
          <button
            type="button"
            className="katha-proto-fmt-btn icon-only"
            onClick={() => setOverflowOpen((o) => !o)}
            title="More formatting"
            aria-expanded={overflowOpen}
            aria-haspopup="menu"
          >
            <MoreHorizontal size={15} strokeWidth={EDITOR_ICON_STROKE} />
          </button>
          {overflowOpen && (
            <div className="katha-proto-fmt-overflow-menu" role="menu">
              <button type="button" role="menuitem" className="katha-proto-fmt-overflow-item" onClick={() => { onUnderline(); setOverflowOpen(false); }}>Underline</button>
              <button type="button" role="menuitem" className="katha-proto-fmt-overflow-item" onClick={() => { onConvertAll(); setOverflowOpen(false); }}>Convert all to Telugu</button>
              <button type="button" role="menuitem" className="katha-proto-fmt-overflow-item" onClick={() => { onAlign('left'); setOverflowOpen(false); }}>Align left</button>
              <button type="button" role="menuitem" className="katha-proto-fmt-overflow-item" onClick={() => { onAlign('center'); setOverflowOpen(false); }}>Align center</button>
              <button type="button" role="menuitem" className="katha-proto-fmt-overflow-item" onClick={() => { onAlign('right'); setOverflowOpen(false); }}>Align right</button>
              <button type="button" role="menuitem" className="katha-proto-fmt-overflow-item" onClick={() => { onLink(); setOverflowOpen(false); }}>Insert link</button>
              <button type="button" role="menuitem" className="katha-proto-fmt-overflow-item" onClick={() => { onSceneBreak(); setOverflowOpen(false); }}>Scene break</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="katha-proto-format-toolbar katha-proto-format-toolbar--compact" role="toolbar" aria-label="Formatting">
      <div className="katha-proto-fmt-group" aria-label="Telugu tools">
        <button
          type="button"
          className={`katha-proto-fmt-btn katha-proto-fmt-btn--telugu-moat${phoneticLive ? ' active' : ''}`}
          onClick={onTogglePhonetic}
          title={phoneticLive ? 'Phonetic Telugu on — built for Telugu writers' : 'Enable phonetic Telugu typing'}
          aria-pressed={phoneticLive}
          aria-label="Phonetic Telugu typing"
        >
          <Keyboard size={15} strokeWidth={EDITOR_ICON_STROKE} />
          <span className="katha-proto-fmt-btn__text">{phoneticLive ? 'తెలుగు · Phonetic' : 'ABC'}</span>
        </button>
        <button
          type="button"
          className="katha-proto-fmt-btn"
          onClick={onConvertAll}
          title="Convert all roman text to Telugu"
          aria-label="Convert all to Telugu"
        >
          <Wand2 size={15} strokeWidth={EDITOR_ICON_STROKE} />
          <span className="katha-proto-fmt-btn__text">Convert</span>
        </button>
      </div>

      <div className="katha-proto-fmt-divider" aria-hidden />

      <div className="katha-proto-fmt-group" aria-label="Text formatting">
        <ToolbarTooltip label="Bold (Ctrl+B)">
          <button type="button" className="katha-proto-fmt-btn icon-only" onClick={onBold} aria-label="Bold">
            <Bold size={15} strokeWidth={EDITOR_ICON_STROKE} />
          </button>
        </ToolbarTooltip>
        <ToolbarTooltip label="Italic (Ctrl+I)">
          <button type="button" className="katha-proto-fmt-btn icon-only" onClick={onItalic} aria-label="Italic">
            <Italic size={15} strokeWidth={EDITOR_ICON_STROKE} />
          </button>
        </ToolbarTooltip>
        <ToolbarTooltip label="Underline (Ctrl+U)">
          <button type="button" className="katha-proto-fmt-btn icon-only" onClick={onUnderline} aria-label="Underline">
            <Underline size={15} strokeWidth={EDITOR_ICON_STROKE} />
          </button>
        </ToolbarTooltip>
      </div>

      <div className="katha-proto-fmt-divider" aria-hidden />

      <div className="katha-proto-fmt-group" aria-label="Paragraph alignment">
        <ToolbarTooltip label="Align left">
          <button type="button" className="katha-proto-fmt-btn icon-only" onClick={() => onAlign('left')} aria-label="Align left">
            <AlignLeft size={15} strokeWidth={EDITOR_ICON_STROKE} />
          </button>
        </ToolbarTooltip>
        <ToolbarTooltip label="Align center">
          <button type="button" className="katha-proto-fmt-btn icon-only" onClick={() => onAlign('center')} aria-label="Align center">
            <AlignCenter size={15} strokeWidth={EDITOR_ICON_STROKE} />
          </button>
        </ToolbarTooltip>
        <ToolbarTooltip label="Align right">
          <button type="button" className="katha-proto-fmt-btn icon-only" onClick={() => onAlign('right')} aria-label="Align right">
            <AlignRight size={15} strokeWidth={EDITOR_ICON_STROKE} />
          </button>
        </ToolbarTooltip>
      </div>

      <div className="katha-proto-fmt-divider" aria-hidden />

      <div className="katha-proto-fmt-group" aria-label="Insert">
        <ToolbarTooltip label="Insert link">
          <button type="button" className="katha-proto-fmt-btn icon-only" onClick={onLink} aria-label="Insert link">
            <Link size={15} strokeWidth={EDITOR_ICON_STROKE} />
          </button>
        </ToolbarTooltip>
        <ToolbarTooltip label="Scene break — fiction divider">
          <button type="button" className="katha-proto-fmt-btn icon-only" onClick={onSceneBreak} aria-label="Insert scene break">
            <SeparatorHorizontal size={15} strokeWidth={EDITOR_ICON_STROKE} />
          </button>
        </ToolbarTooltip>
      </div>

      <div className="katha-proto-fmt-divider" aria-hidden />

      <div className="katha-proto-fmt-group" aria-label="Undo and redo">
        <ToolbarTooltip label="Undo (Ctrl+Z)">
          <button type="button" className="katha-proto-fmt-btn icon-only" onClick={onUndo} aria-label="Undo">
            <Undo2 size={15} strokeWidth={EDITOR_ICON_STROKE} />
          </button>
        </ToolbarTooltip>
        <ToolbarTooltip label="Redo (Ctrl+Y)">
          <button type="button" className="katha-proto-fmt-btn icon-only" onClick={onRedo} aria-label="Redo">
            <Redo2 size={15} strokeWidth={EDITOR_ICON_STROKE} />
          </button>
        </ToolbarTooltip>
      </div>

      {onOpenAi && (
        <>
          <div className="katha-proto-fmt-divider" aria-hidden />
          <button
            type="button"
            className="katha-proto-fmt-btn katha-proto-fmt-btn--ai"
            onClick={onOpenAi}
            title="AI writing companion"
            aria-label="Open AI writing companion"
          >
            <Sparkles size={15} strokeWidth={EDITOR_ICON_STROKE} />
            <span className="katha-proto-fmt-btn__text">Companion</span>
          </button>
        </>
      )}
    </div>
  );
});
