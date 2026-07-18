import { useCallback, useEffect, useState } from 'react';
import { Lightbulb, Pencil, Plus, Trash2 } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';

export interface ThinkIdea {
  id: string;
  body: string;
  created_at: string;
  updated_at: string;
}

function storageKey(storyId: string, chapterNum: number) {
  return `katha_think_ideas:${storyId}:${chapterNum}`;
}

function loadIdeas(storyId: string, chapterNum: number): ThinkIdea[] {
  try {
    const raw = localStorage.getItem(storageKey(storyId, chapterNum));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ThinkIdea[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveIdeas(storyId: string, chapterNum: number, ideas: ThinkIdea[]) {
  localStorage.setItem(storageKey(storyId, chapterNum), JSON.stringify(ideas));
}

interface ThinkIdeasPanelProps {
  storyId: string;
  chapterNum: number;
  selectionHint?: string | null;
  onRequestSelection?: () => string | null;
}

/**
 * Local idea pad for the Think (ఆలోచన) phase — add / edit / delete.
 * Persists per story+chapter in localStorage (MVP1; cloud later).
 */
export function ThinkIdeasPanel({
  storyId,
  chapterNum,
  selectionHint,
  onRequestSelection,
}: ThinkIdeasPanelProps) {
  const { locale } = useLocale();
  const te = locale === 'te';
  const [ideas, setIdeas] = useState<ThinkIdea[]>(() => loadIdeas(storyId, chapterNum));
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');

  useEffect(() => {
    setIdeas(loadIdeas(storyId, chapterNum));
    setDraft('');
    setEditingId(null);
  }, [storyId, chapterNum]);

  const persist = useCallback((next: ThinkIdea[]) => {
    setIdeas(next);
    saveIdeas(storyId, chapterNum, next);
  }, [storyId, chapterNum]);

  const addIdea = () => {
    const body = draft.trim();
    if (!body) return;
    const now = new Date().toISOString();
    persist([
      {
        id: `idea-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        body,
        created_at: now,
        updated_at: now,
      },
      ...ideas,
    ]);
    setDraft('');
  };

  const useSelection = () => {
    const text = onRequestSelection?.() || selectionHint;
    if (text?.trim()) {
      setDraft((prev) => (prev ? `${prev}\n\n${text.trim()}` : text.trim()));
    }
  };

  const commitEdit = () => {
    if (!editingId) return;
    const body = editBody.trim();
    if (!body) {
      setEditingId(null);
      return;
    }
    persist(
      ideas.map((i) =>
        i.id === editingId ? { ...i, body, updated_at: new Date().toISOString() } : i,
      ),
    );
    setEditingId(null);
  };

  return (
    <div className="think-ideas-panel">
      <header className="think-ideas-panel__head">
        <Lightbulb size={16} aria-hidden />
        <div>
          <h3 className="think-ideas-panel__title">
            {te ? 'ఆలోచనలు & ఆలోచన ప్యాడ్' : 'Ideas pad'}
          </h3>
          <p className="think-ideas-panel__hint">
            {te
              ? 'ఇక్కడ ఆలోచనలు రాసి తర్వాత తిరిగి చూడవచ్చు. ఎడిటర్‌లో టెక్స్ట్ సెలెక్ట్ చేసి “సెలెక్షన్ జోడించు” నొక్కండి.'
              : 'Capture ideas here and return later. Select text in the manuscript, then “Add selection”.'}
          </p>
        </div>
      </header>

      <div className="think-ideas-panel__composer">
        <textarea
          className="cms-input think-ideas-panel__input"
          rows={3}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={te ? 'ఒక ఆలోచన రాయండి…' : 'Write an idea…'}
          lang="te"
        />
        <div className="think-ideas-panel__actions">
          <button type="button" className="katha-cta katha-cta--soft" onClick={useSelection}>
            {te ? 'సెలెక్షన్ జోడించు' : 'Add selection'}
          </button>
          <button
            type="button"
            className="katha-cta katha-cta--maroon"
            disabled={!draft.trim()}
            onClick={addIdea}
          >
            <Plus size={14} aria-hidden />
            {te ? 'ఆలోచన జోడించు' : 'Add idea'}
          </button>
        </div>
      </div>

      {ideas.length === 0 ? (
        <p className="nos-empty-hint">
          {te ? 'ఇంకా ఆలోచనలు లేవు — మొదటిది రాయండి.' : 'No ideas yet — add your first.'}
        </p>
      ) : (
        <ul className="think-ideas-panel__list">
          {ideas.map((idea) => (
            <li key={idea.id} className="think-ideas-panel__item">
              {editingId === idea.id ? (
                <>
                  <textarea
                    className="cms-input"
                    rows={3}
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    lang="te"
                  />
                  <div className="think-ideas-panel__item-actions">
                    <button type="button" className="katha-cta katha-cta--maroon" onClick={commitEdit}>
                      {te ? 'సేవ్' : 'Save'}
                    </button>
                    <button type="button" className="katha-cta katha-cta--soft" onClick={() => setEditingId(null)}>
                      {te ? 'రద్దు' : 'Cancel'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="think-ideas-panel__body" lang="te">{idea.body}</p>
                  <div className="think-ideas-panel__item-actions">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      aria-label={te ? 'సవరించు' : 'Edit'}
                      onClick={() => {
                        setEditingId(idea.id);
                        setEditBody(idea.body);
                      }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      aria-label={te ? 'తొలగించు' : 'Delete'}
                      onClick={() => persist(ideas.filter((i) => i.id !== idea.id))}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
