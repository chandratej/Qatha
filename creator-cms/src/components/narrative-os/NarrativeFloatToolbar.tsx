import { Bold, Italic, MessageCircle, Sparkles } from 'lucide-react';

interface NarrativeFloatToolbarProps {
  rect: DOMRect;
  onBold: () => void;
  onItalic: () => void;
  onComment: () => void;
  onAskAi: () => void;
}

export function NarrativeFloatToolbar({
  rect,
  onBold,
  onItalic,
  onComment,
  onAskAi,
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
      <button type="button" title="Ask AI" onClick={onAskAi}><Sparkles size={14} /></button>
    </div>
  );
}