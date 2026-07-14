import { PenLine } from 'lucide-react';
import type { CompanionSuggestion } from '../../lib/narrativeOsTypes';
import { useLocale } from '../../context/LocaleContext';

interface NarrativeCompanionProps {
  suggestion: CompanionSuggestion | null;
  noteOpen: boolean;
  onToggleNote: () => void;
  onDismiss: () => void;
  onPrimaryAction?: () => void;
}

export function NarrativeCompanion({
  suggestion,
  noteOpen,
  onToggleNote,
  onDismiss,
  onPrimaryAction,
}: NarrativeCompanionProps) {
  const { t } = useLocale();

  return (
    <div className="narrative-os__companion-host">
      <button
        type="button"
        className="narrative-os__companion"
        onClick={onToggleNote}
        aria-expanded={noteOpen}
        aria-label="Writing companion"
        title="Your writing companion"
      >
        <PenLine size={16} />
      </button>
      {suggestion && (
        <div
          className={`narrative-os__companion-note${noteOpen ? ' narrative-os__companion-note--open' : ''}`}
          role="dialog"
          aria-label="Companion suggestion"
        >
          <div className="narrative-os__companion-note-title">
            {suggestion.title || t('narrativeOs.companionTitle')}
          </div>
          {suggestion.body}
          <div className="narrative-os__companion-actions">
            <button
              type="button"
              className="primary"
              onClick={() => { onPrimaryAction?.(); onDismiss(); }}
            >
              {t('narrativeOs.companionShow')}
            </button>
            <button type="button" onClick={onDismiss}>
              {t('narrativeOs.companionDismiss')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}