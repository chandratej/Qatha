import { ChapterFindBar } from '../Editor/ChapterFindBar';
import { useLocale } from '../../context/LocaleContext';

interface NarrativeRefineFindOverlayProps {
  open: boolean;
  query: string;
  replaceText: string;
  showReplace: boolean;
  matchIndex: number;
  matchCount: number;
  activeSceneId: string;
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

export function NarrativeRefineFindOverlay(props: NarrativeRefineFindOverlayProps) {
  const { t } = useLocale();
  if (!props.open) return null;

  return (
    <div className="nos-refine-find-overlay" role="search">
      <p className="nos-refine-find-overlay__hint">{t('narrativeOs.refineFindHint')}</p>
      <ChapterFindBar
        open
        query={props.query}
        replaceText={props.replaceText}
        showReplace={props.showReplace}
        matchIndex={props.matchIndex}
        matchCount={props.matchCount}
        focusRestoreKey={`${props.query}|${props.matchIndex}|${props.activeSceneId}`}
        onQueryChange={props.onQueryChange}
        onReplaceTextChange={props.onReplaceTextChange}
        onToggleReplace={props.onToggleReplace}
        onClose={props.onClose}
        onNext={props.onNext}
        onPrev={props.onPrev}
        onReplace={props.onReplace}
        onReplaceNext={props.onReplaceNext}
        onReplaceAll={props.onReplaceAll}
      />
    </div>
  );
}