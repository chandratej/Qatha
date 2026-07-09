import { useState, useRef, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';

const QUICK_ACTIONS = [
  'Rewrite',
  'Continue',
  'Improve',
  'Expand',
  'Translate',
  'Summarize',
] as const;

export function AiAssistantDock() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="katha-ai-dock" ref={panelRef}>
      {open && (
        <div className="katha-ai-dock__panel" role="dialog" aria-label="AI writing assistant">
          <div className="katha-ai-dock__panel-header">
            <span>AI Assistant</span>
            <button
              type="button"
              className="katha-ai-dock__close"
              onClick={() => setOpen(false)}
              aria-label="Close AI assistant"
            >
              <X size={16} />
            </button>
          </div>
          <div className="katha-ai-dock__actions">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                type="button"
                className="katha-ai-dock__action"
                onClick={() => setOpen(false)}
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        className="katha-ai-dock__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="AI writing assistant"
      >
        <Sparkles size={18} />
        <span>AI Assistant</span>
      </button>
    </div>
  );
}