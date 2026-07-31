import { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import type { StoryCharacter } from '../../../../packages/shared/storyBible';
import { FEATURE_FLAGS } from '../../config/feature_flags';

interface SceneCharacterPanelProps {
  characters: StoryCharacter[];
  linkedIds: Set<string>;
  onToggle: (characterId: string) => void;
  suggestedNames?: string[];
  onAddCharacter?: (name: string) => void;
  loading?: boolean;
  disabled?: boolean;
  addingName?: string | null;
}

/**
 * §3.1 Craft Moat — People cast is structured story entities (name + story linkage),
 * never freeform-only paragraphs. Quick-add always available when craftEntities is on.
 */
export function SceneCharacterPanel({
  characters,
  linkedIds,
  onToggle,
  suggestedNames = [],
  onAddCharacter,
  loading = false,
  disabled = false,
  addingName = null,
}: SceneCharacterPanelProps) {
  const [nameDraft, setNameDraft] = useState('');

  if (!FEATURE_FLAGS.craftEntities) {
    return (
      <p className="input-hint">
        Craft entities are off for this build.
      </p>
    );
  }

  if (loading) {
    return (
      <div className="scene-character-panel scene-character-panel--loading">
        <Users size={14} aria-hidden />
        <span className="input-hint">Loading cast…</span>
      </div>
    );
  }

  const hasCast = characters.length > 0;
  const draftSuggestions = suggestedNames.filter(
    (n) => !characters.some((c) => c.name.toLowerCase() === n.toLowerCase()),
  );

  const submitAdd = () => {
    const name = nameDraft.trim();
    if (!name || !onAddCharacter || disabled) return;
    onAddCharacter(name);
    setNameDraft('');
  };

  return (
    <div className="scene-character-panel" role="group" aria-label="Characters in this scene">
      {/* Always-complete structured add — §3.4 tab integrity */}
      {onAddCharacter && (
        <div className="scene-character-panel__add">
          <label className="scene-character-panel__label" htmlFor="scene-char-add-name">
            <Users size={14} aria-hidden />
            Add character
          </label>
          <div className="scene-character-panel__add-row">
            <input
              id="scene-char-add-name"
              type="text"
              className="scene-character-panel__input"
              value={nameDraft}
              disabled={disabled}
              placeholder="Name (Telugu or roman)"
              maxLength={80}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submitAdd();
                }
              }}
            />
            <button
              type="button"
              className="scene-character-chip scene-character-chip--suggest"
              disabled={disabled || !nameDraft.trim() || Boolean(addingName)}
              onClick={submitAdd}
            >
              <Plus size={12} aria-hidden />
              {addingName && addingName === nameDraft.trim() ? 'Adding…' : 'Add'}
            </button>
          </div>
          <p className="input-hint scene-character-panel__hint">
            Saved to this story’s cast — reusable across every chapter.
          </p>
        </div>
      )}

      {hasCast && (
        <>
          <span className="scene-character-panel__label">In scene</span>
          <div className="scene-character-panel__chips">
            {characters.map((c) => {
              const active = linkedIds.has(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`scene-character-chip${active ? ' is-active' : ''}`}
                  disabled={disabled}
                  aria-pressed={active}
                  onClick={() => onToggle(c.id)}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </>
      )}

      {draftSuggestions.length > 0 && onAddCharacter && (
        <div className="scene-character-panel__suggestions">
          <span className="scene-character-panel__label scene-character-panel__label--suggest">
            Detected in your draft
          </span>
          <div className="scene-character-panel__chips">
            {draftSuggestions.map((name) => (
              <button
                key={name}
                type="button"
                className="scene-character-chip scene-character-chip--suggest"
                disabled={disabled || addingName === name}
                onClick={() => onAddCharacter(name)}
              >
                <Plus size={12} aria-hidden />
                {addingName === name ? 'Adding…' : name}
              </button>
            ))}
          </div>
        </div>
      )}

      {!hasCast && !onAddCharacter && (
        <p className="input-hint">No characters linked to this scene yet.</p>
      )}
    </div>
  );
}
