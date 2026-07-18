import { Bold, Italic, MessageCircle } from 'lucide-react';

interface NarrativeFloatToolbarProps {
  rect: DOMRect;
  onBold: () => void;
  onItalic: () => void;
  onComment: () => void;
  /** @deprecated Generative AI disabled in MVP1 — optional no-op kept for API stability. */
  onAskAi?: () => void;
}

/** Selection float toolbar — no generative AI in MVP1. */
export function NarrativeFloatToolbar({
  rect,
  onBold,
  onItalic,
  onComment,
}: NarrativeFloatToolbarProps) {
  const left = rect.left + rect.width / 2 - 60;
  const top = rect.top - 46 + window.scrollY;

  return (
    <div
      className="narrative-os__float-tb"
      style={{ left, top }}
      role="toolbar"
      aria-label="Selection formatting"
    >
      <button type="button" title="Bold" onClick={onBold}><Bold size={14} /></button>
      <button type="button" title="Italic" onClick={onItalic}><Italic size={14} /></button>
      <button type="button" title="Comment" onClick={onComment}><MessageCircle size={14} /></button>
    </div>
  );
}
