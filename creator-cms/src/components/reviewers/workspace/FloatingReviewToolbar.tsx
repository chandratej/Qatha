import { useState } from 'react';
import type { CommentKind, CommentPriority, ReviewCategoryId } from '../../../types/reviewWorkspace';

const PRIMARY_ACTIONS = [
  { id: 'comment', label: 'Comment', kind: 'comment' as const, category: 'plot' as ReviewCategoryId, priority: 'medium' as const },
  { id: 'suggest', label: 'Suggest', kind: 'suggestion' as const, category: 'plot' as ReviewCategoryId, priority: 'medium' as const },
  { id: 'critical', label: 'Critical', kind: 'comment' as const, category: 'plot' as ReviewCategoryId, priority: 'critical' as const },
  { id: 'dialogue', label: 'Dialogue', kind: 'comment' as const, category: 'dialogue' as ReviewCategoryId, priority: 'medium' as const },
  { id: 'pacing', label: 'Pacing', kind: 'comment' as const, category: 'pacing' as ReviewCategoryId, priority: 'medium' as const },
];

const MORE_ACTIONS = [
  { id: 'character', label: 'Character', category: 'character' as ReviewCategoryId },
  { id: 'emotion', label: 'Emotion', category: 'emotion' as ReviewCategoryId },
  { id: 'logic', label: 'Logic', category: 'logic' as ReviewCategoryId },
  { id: 'grammar', label: 'Grammar', category: 'grammar' as ReviewCategoryId },
  { id: 'world', label: 'World', category: 'world_building' as ReviewCategoryId },
  { id: 'readability', label: 'Reading feel', category: 'readability' as ReviewCategoryId },
];

interface Props {
  position: { top: number; left: number };
  selectedText: string;
  onAction: (opts: {
    kind: CommentKind;
    category: ReviewCategoryId;
    priority: CommentPriority;
    label: string;
  }) => void;
  onClose: () => void;
}

export function FloatingReviewToolbar({ position, selectedText, onAction, onClose }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rw-floating-toolbar rw-floating-toolbar--calm"
      style={{ top: position.top, left: position.left }}
      role="toolbar"
      aria-label="Review selected passage"
    >
      <p className="rw-floating-toolbar__selection">
        “{selectedText.slice(0, 56)}{selectedText.length > 56 ? '…' : ''}”
      </p>
      <div className="rw-floating-toolbar__actions">
        {PRIMARY_ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            className="rw-floating-toolbar__btn"
            onClick={() => onAction({
              kind: action.kind,
              category: action.category,
              priority: action.priority,
              label: action.label,
            })}
          >
            {action.label}
          </button>
        ))}
        <button
          type="button"
          className="rw-floating-toolbar__btn rw-floating-toolbar__btn--more"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? 'Less' : 'More…'}
        </button>
      </div>
      {expanded && (
        <div className="rw-floating-toolbar__more">
          {MORE_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              className="rw-floating-toolbar__btn"
              onClick={() => onAction({
                kind: 'comment',
                category: action.category,
                priority: 'medium',
                label: action.label,
              })}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
      <button type="button" className="rw-floating-toolbar__close" onClick={onClose} aria-label="Close">
        ×
      </button>
    </div>
  );
}