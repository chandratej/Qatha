import { Plus, Sparkles, Users } from 'lucide-react';
import type { StoryCharacter } from '../../../../packages/shared/storyBible';

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
  if (loading) {
    return (
      <div className="scene-character-panel scene-character-panel--loading">
        <Users size={14} aria-hidden />
        <span className="input-hint">Loading cast…</span>
      </div>
    );
  }

  const hasCast = characters.length > 0;
  const hasSuggestions = suggestedNames.length > 0 && onAddCharacter;

  if (!hasCast && !hasSuggestions) {
    return (
      <div className="scene-character-panel scene-character-panel--empty">
        <Users size={14} aria-hidden />
        <span className="input-hint">Write dialogue — we'll suggest character names from your draft.</span>
      </div>
    );
  }

  return (
    <div className="scene-character-panel" role="group" aria-label="Characters in this scene">
      {hasCast && (
        <>
          <span className="scene-character-panel__label">
            <Users size={14} aria-hidden />
            In scene
          </span>
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

      {hasSuggestions && (
        <div className="scene-character-panel__suggestions">
          <span className="scene-character-panel__label scene-character-panel__label--suggest">
            <Sparkles size={13} aria-hidden />
            From your draft
          </span>
          <div className="scene-character-panel__chips">
            {suggestedNames.map((name) => (
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
    </div>
  );
}