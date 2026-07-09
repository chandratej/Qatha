import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

const PREFIX = 'katha-ai-notes-';

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

  return (
    <aside className="katha-ai-notes-panel" aria-label="AI planning notes">
      <div className="katha-ai-notes-panel__header">
        <Sparkles size={15} aria-hidden />
        <span>AI Notes</span>
      </div>
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