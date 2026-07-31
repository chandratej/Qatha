import type { CSSProperties } from 'react';
import { setPersonalCorrection, type Suggestion } from '../../lib/phonetic';

interface PhoneticSuggestionsMenuProps {
  suggestions: Suggestion[];
  selectedIndex: number;
  trailingWord: string;
  onSelect: (suggestion: Suggestion) => void;
  className?: string;
  style?: CSSProperties;
}

export function PhoneticSuggestionsMenu({
  suggestions,
  selectedIndex,
  trailingWord,
  onSelect,
  className = 'katha-proto-phonetic-menu',
  style,
}: PhoneticSuggestionsMenuProps) {
  return (
    <div className={className} style={style} role="listbox" aria-label="Phonetic suggestions">
      {suggestions.map((sug, idx) => {
        const active = idx === selectedIndex;
        return (
          <div
            key={`${sug.value}-${idx}`}
            role="option"
            aria-selected={active}
            className={`katha-proto-phonetic-item${active ? ' katha-proto-phonetic-item--active' : ''}`}
          >
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelect(sug)}
              className="katha-proto-phonetic-item__main"
            >
              {active && (
                <span className="katha-proto-phonetic-item__caret" aria-hidden>
                  ›
                </span>
              )}
              <span className="katha-proto-phonetic-item__word">{sug.value}</span>
              <span className="katha-proto-phonetic-item__hint">{sug.display.split(' → ')[0]}</span>
            </button>
            <button
              type="button"
              title="Teach this correction"
              className="katha-proto-phonetic-teach"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                const key = window.prompt('Roman spelling to remember', trailingWord);
                if (key) setPersonalCorrection(key, sug.value);
              }}
            >
              Teach
            </button>
          </div>
        );
      })}
      <div className="katha-proto-phonetic-menu__footer">
        Space / Enter / Tab accept · ↑↓ move · Esc close
      </div>
    </div>
  );
}