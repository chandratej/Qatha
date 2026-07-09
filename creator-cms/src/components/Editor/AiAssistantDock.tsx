import { useState, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';
import { EDITOR_ICON_STROKE } from '../../lib/editorIcons';

const COMPANION_ACTIONS = [
  'Continue Writing',
  'Improve Telugu',
  'Rewrite Paragraph',
  'Expand Dialogue',
  'Check Consistency',
  'Generate Scene Ideas',
] as const;

interface AiAssistantDockProps {
  integrated?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AiAssistantDock({
  integrated = false,
  open: controlledOpen,
  onOpenChange,
}: AiAssistantDockProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  return (
    <div className={`katha-ai-companion${integrated ? ' katha-ai-companion--integrated' : ''}`}>
      {open && (
        <div className="katha-ai-companion__panel" role="dialog" aria-label="AI writing companion">
          <div className="katha-ai-companion__panel-header">
            <div>
              <strong>Writing companion</strong>
              <p>Quick assists for your current scene</p>
            </div>
            <button
              type="button"
              className="katha-ai-companion__close"
              onClick={() => setOpen(false)}
              aria-label="Close AI companion"
            >
              <X size={16} strokeWidth={EDITOR_ICON_STROKE} />
            </button>
          </div>
          <div className="katha-ai-companion__actions">
            {COMPANION_ACTIONS.map((action) => (
              <button
                key={action}
                type="button"
                className="katha-ai-companion__action"
                onClick={() => setOpen(false)}
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}
      {!integrated && (
        <button
          type="button"
          className="katha-ai-companion__trigger"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="AI writing companion"
        >
          <Sparkles size={16} strokeWidth={EDITOR_ICON_STROKE} />
          <span>Companion</span>
        </button>
      )}
    </div>
  );
}