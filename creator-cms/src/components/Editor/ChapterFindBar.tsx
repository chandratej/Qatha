import { useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { EDITOR_ICON_STROKE } from '../../lib/editorIcons';

interface ChapterFindBarProps {
  open: boolean;
  query: string;
  replaceText: string;
  showReplace: boolean;
  matchIndex: number;
  matchCount: number;
  /** Changes when find results update; used to reclaim focus if the editor stole it. */
  focusRestoreKey?: string;
  onQueryChange: (value: string) => void;
  onReplaceTextChange: (value: string) => void;
  onToggleReplace: () => void;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onReplace: () => void;
  onReplaceNext: () => void;
  onReplaceAll: () => void;
}

export function ChapterFindBar({
  open,
  query,
  replaceText,
  showReplace,
  matchIndex,
  matchCount,
  focusRestoreKey,
  onQueryChange,
  onReplaceTextChange,
  onToggleReplace,
  onClose,
  onNext,
  onPrev,
  onReplace,
  onReplaceNext,
  onReplaceAll,
}: ChapterFindBarProps) {
  const findRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      const input = findRef.current;
      if (!input) return;
      input.focus({ preventScroll: true });
      const end = input.value.length;
      input.setSelectionRange(end, end);
    });
  }, [open]);

  useEffect(() => {
    if (!open || !focusRestoreKey) return;
    const id = requestAnimationFrame(() => {
      const input = findRef.current;
      if (!input) return;
      const active = document.activeElement;
      const findBar = input.closest('.katha-chapter-find');
      if (active && findBar?.contains(active)) return;
      if (
        active?.closest('.ql-editor')
        || active?.classList.contains('katha-proto-scene-title-input')
      ) {
        input.focus({ preventScroll: true });
        const end = input.value.length;
        input.setSelectionRange(end, end);
      }
    });
    return () => cancelAnimationFrame(id);
  }, [open, focusRestoreKey]);

  if (!open) return null;

  const matchLabel = matchCount === 0
    ? 'No matches'
    : `${matchIndex + 1} of ${matchCount}`;

  return (
    <div className="katha-chapter-find" role="search" aria-label="Find in chapter">
      <div className="katha-chapter-find__row">
        <label className="katha-chapter-find__field">
          <span className="katha-chapter-find__label">Find</span>
          <input
            ref={findRef}
            type="search"
            className="katha-chapter-find__input"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Telugu or English phonetics…"
            aria-label="Find in chapter"
            lang="te"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (e.shiftKey) onPrev();
                else onNext();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
              }
            }}
          />
        </label>

        <span className="katha-chapter-find__count" aria-live="polite">
          {matchLabel}
        </span>

        <div className="katha-chapter-find__nav">
          <button
            type="button"
            className="katha-chapter-find__btn"
            onClick={onPrev}
            disabled={matchCount === 0}
            title="Previous match (Shift+Enter)"
            aria-label="Previous match"
          >
            <ChevronUp size={15} strokeWidth={EDITOR_ICON_STROKE} />
          </button>
          <button
            type="button"
            className="katha-chapter-find__btn"
            onClick={onNext}
            disabled={matchCount === 0}
            title="Next match (Enter)"
            aria-label="Next match"
          >
            <ChevronDown size={15} strokeWidth={EDITOR_ICON_STROKE} />
          </button>
        </div>

        <button
          type="button"
          className={`katha-chapter-find__toggle${showReplace ? ' katha-chapter-find__toggle--active' : ''}`}
          onClick={onToggleReplace}
          aria-pressed={showReplace}
        >
          Replace
        </button>

        <button
          type="button"
          className="katha-chapter-find__btn katha-chapter-find__btn--close"
          onClick={onClose}
          title="Close (Esc)"
          aria-label="Close find bar"
        >
          <X size={15} strokeWidth={EDITOR_ICON_STROKE} />
        </button>
      </div>

      {showReplace && (
        <div className="katha-chapter-find__row katha-chapter-find__row--replace">
          <label className="katha-chapter-find__field">
            <span className="katha-chapter-find__label">Replace</span>
            <input
              type="text"
              className="katha-chapter-find__input"
              value={replaceText}
              onChange={(e) => onReplaceTextChange(e.target.value)}
              placeholder="Replacement text"
              aria-label="Replace with"
              lang="te"
            />
          </label>
          <div className="katha-chapter-find__replace-actions">
            <button
              type="button"
              className="katha-chapter-find__action"
              onClick={onReplace}
              disabled={matchCount === 0}
            >
              Replace
            </button>
            <button
              type="button"
              className="katha-chapter-find__action"
              onClick={onReplaceNext}
              disabled={matchCount === 0}
              title="Replace current match and go to next"
            >
              Replace next
            </button>
            <button
              type="button"
              className="katha-chapter-find__action katha-chapter-find__action--primary"
              onClick={onReplaceAll}
              disabled={matchCount === 0 || !query.trim()}
            >
              Replace all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}