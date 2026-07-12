import { useState } from 'react';
import type { CommentKind, CommentPriority, ReviewCategoryId } from '../../../types/reviewWorkspace';
import { categoryLabel } from '../../../lib/reviewCategories';
import { useReviewLanguage } from './ReviewLanguageBar';
import { useLocale } from '../../../context/LocaleContext';

const PRIMARY_IDS = [
  { id: 'comment', labelKey: 'reviewWorkspace.toolbarComment' as const, kind: 'comment' as const, category: 'plot' as ReviewCategoryId, priority: 'medium' as const },
  { id: 'suggest', labelKey: 'reviewWorkspace.toolbarSuggest' as const, kind: 'suggestion' as const, category: 'plot' as ReviewCategoryId, priority: 'medium' as const },
  { id: 'critical', labelKey: 'reviewWorkspace.toolbarCritical' as const, kind: 'comment' as const, category: 'plot' as ReviewCategoryId, priority: 'critical' as const },
  { id: 'dialogue', category: 'dialogue' as ReviewCategoryId, kind: 'comment' as const, priority: 'medium' as const },
  { id: 'pacing', category: 'pacing' as ReviewCategoryId, kind: 'comment' as const, priority: 'medium' as const },
];

const MORE_CATEGORIES: ReviewCategoryId[] = [
  'character', 'emotion', 'logic', 'grammar', 'world_building', 'readability',
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
  onClose?: () => void;
}

export function FloatingReviewToolbar({ position, selectedText, onAction }: Props) {
  const { t } = useLocale();
  const { language } = useReviewLanguage();
  const [expanded, setExpanded] = useState(false);

  const primaryLabel = (action: typeof PRIMARY_IDS[number]) => {
    if ('labelKey' in action && action.labelKey) return t(action.labelKey);
    return categoryLabel(action.category, language);
  };

  return (
    <div
      className="rw-floating-toolbar rw-floating-toolbar--calm"
      style={{ top: position.top, left: position.left }}
      role="toolbar"
      aria-label={t('reviewWorkspace.toolbarAria')}
    >
      <p className="rw-floating-toolbar__selection">
        “{selectedText.slice(0, 56)}{selectedText.length > 56 ? '…' : ''}”
      </p>
      <div className="rw-floating-toolbar__actions">
        {PRIMARY_IDS.map((action) => (
          <button
            key={action.id}
            type="button"
            className="rw-floating-toolbar__btn"
            onClick={() => onAction({
              kind: action.kind,
              category: action.category,
              priority: action.priority,
              label: primaryLabel(action),
            })}
          >
            {primaryLabel(action)}
          </button>
        ))}
        <button
          type="button"
          className="rw-floating-toolbar__btn rw-floating-toolbar__btn--more"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? t('reviewWorkspace.toolbarLess') : t('reviewWorkspace.toolbarMore')}
        </button>
      </div>
      {expanded && (
        <div className="rw-floating-toolbar__more">
          {MORE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className="rw-floating-toolbar__btn"
              onClick={() => onAction({
                kind: 'comment',
                category: cat,
                priority: 'medium',
                label: categoryLabel(cat, language),
              })}
            >
              {categoryLabel(cat, language)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}