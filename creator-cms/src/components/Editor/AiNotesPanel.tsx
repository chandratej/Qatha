import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

const PREFIX = 'katha-ai-notes-';

const PLANNING_PROMPTS = [
  'Plot beat for the next scene…',
  'Character motivation to explore…',
  'Conflict or tension to raise…',
  'Dialogue idea or key line…',
  'Chapter arc connection…',
  'Scene transition note…',
] as const;

function storageKey(storyId: string, chapterNum: number) {
  return `${PREFIX}${storyId}-${chapterNum}`;
}

interface AiNotesPanelProps {
  storyId: string;
  chapterNum: number;
}

export function AiNotesPanel({ storyId, chapterNum }: AiNotesPanelProps) {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    try {
      setNotes(localStorage.getItem(storageKey(storyId, chapterNum)) || '');
    } catch {
      setNotes('');
    }
  }, [storyId, chapterNum]);

  const persist = (value: string) => {
    setNotes(value);
    try {
      localStorage.setItem(storageKey(storyId, chapterNum), value);
    } catch {
      /* ignore */
    }
  };

  const appendPrompt = (prompt: string) => {
    const trimmed = notes.trim();
    const next = trimmed ? `${trimmed}\n\n${prompt}` : prompt;
    persist(next);
  };

  return (
    <aside className="katha-ai-notes-panel" aria-label="AI planning notes">
      <div className="katha-ai-notes-panel__header">
        <Sparkles size={15} aria-hidden />
        <span>AI Notes</span>
      </div>

      {!notes.trim() && (
        <div className="katha-ai-notes-panel__suggestions" aria-label="Planning prompts">
          <p className="katha-ai-notes-panel__suggestions-lead">Start with a planning prompt:</p>
          <div className="katha-ai-notes-panel__chips">
            {PLANNING_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="katha-ai-notes-panel__chip"
                onClick={() => appendPrompt(prompt)}
              >
                {prompt.replace(/…$/, '')}
              </button>
            ))}
          </div>
        </div>
      )}

      <textarea
        className="katha-ai-notes-panel__input"
        value={notes}
        onChange={(e) => persist(e.target.value)}
        placeholder="Plot beats, character arcs, scene ideas…"
        rows={12}
      />
      <p className="katha-ai-notes-panel__hint">Saved locally for this chapter.</p>
    </aside>
  );
}