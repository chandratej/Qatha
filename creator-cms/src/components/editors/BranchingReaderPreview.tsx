import { useCallback, useEffect, useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { StudioIllustration } from '../studio/StudioIllustration';
import type { BranchNode } from '../../lib/alternateEditorCache';
import {
  getStartNodeId,
  findNode,
  resolveChoiceTarget,
  isTerminalNode,
  normalizeBranchNodes,
  type BranchChoice,
} from '../../lib/branchingGraph';

interface PathStep {
  nodeId: string;
  choice: 'start' | BranchChoice;
  choiceLabel?: string;
}

interface Props {
  chapterTitle: string;
  nodes: BranchNode[];
  variant?: 'panel' | 'fullscreen';
  activeNodeId?: string | null;
}

export function BranchingReaderPreview({
  chapterTitle,
  nodes,
  variant = 'panel',
  activeNodeId,
}: Props) {
  const { t } = useLocale();
  const normalized = useMemo(() => normalizeBranchNodes(nodes), [nodes]);
  const visible = useMemo(
    () => normalized.filter((n) => n.body.trim() || n.choiceA.trim() || n.choiceB.trim()),
    [normalized],
  );
  const nodeKey = visible.map((n) => `${n.id}:${n.body}:${n.choiceA}:${n.choiceB}:${n.choiceATarget}:${n.choiceBTarget}`).join('|');
  const startId = getStartNodeId(visible);

  const [currentId, setCurrentId] = useState<string | null>(startId);
  const [path, setPath] = useState<PathStep[]>(() => (startId ? [{ nodeId: startId, choice: 'start' }] : []));
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const id = getStartNodeId(visible);
    setCurrentId(id);
    setPath(id ? [{ nodeId: id, choice: 'start' }] : []);
    setEnded(false);
  }, [nodeKey, visible]);

  const active = currentId ? findNode(visible, currentId) : undefined;
  const atEnd = ended || (currentId ? isTerminalNode(visible, currentId) : true);

  const choose = useCallback((choice: BranchChoice) => {
    if (!currentId) return;
    const nextId = resolveChoiceTarget(visible, currentId, choice);
    const node = findNode(visible, currentId);
    const label = choice === 'A' ? node?.choiceA : node?.choiceB;
    if (!nextId) {
      setPath((prev) => [...prev, { nodeId: currentId, choice, choiceLabel: label?.trim() }]);
      setEnded(true);
      return;
    }
    setEnded(false);
    setCurrentId(nextId);
    setPath((prev) => [...prev, { nodeId: nextId, choice, choiceLabel: label?.trim() }]);
  }, [currentId, visible]);

  const reset = useCallback(() => {
    const id = getStartNodeId(visible);
    setCurrentId(id);
    setPath(id ? [{ nodeId: id, choice: 'start' }] : []);
    setEnded(false);
  }, [visible]);

  const rootClass = [
    'alternate-reader-preview',
    'branching-reader-preview',
    'branching-reader-preview--interactive',
    'branching-reader-preview--graph',
    variant === 'fullscreen' ? 'branching-reader-preview--fullscreen' : '',
  ].filter(Boolean).join(' ');

  return (
    <aside className={rootClass} aria-label={t('branchingEditor.previewLabel')}>
      {variant === 'panel' && (
        <header className="alternate-reader-preview__head">
          <StudioIllustration id="story-fork" tone="gold" size={48} />
          <div>
            <span className="katha-token-eyebrow">{t('branchingEditor.previewLabel')}</span>
            <h2 className="alternate-reader-preview__title">{chapterTitle}</h2>
          </div>
          <button type="button" className="alternate-reader-preview__reset" onClick={reset} aria-label={t('branchingEditor.previewReset')}>
            <RotateCcw size={14} aria-hidden />
          </button>
        </header>
      )}

      {visible.length === 0 ? (
        <p className="alternate-reader-preview__empty">{t('branchingEditor.previewEmpty')}</p>
      ) : (
        <>
          <nav className="branching-reader-preview__path" aria-label={t('branchingEditor.previewPath')}>
            {path.map((step, i) => {
              const node = findNode(visible, step.nodeId);
              const label = step.choice === 'start'
                ? node?.title || t('branchingEditor.nodeTitle')
                : (step.choiceLabel || step.choice);
              const isActive = step.nodeId === (activeNodeId ?? currentId) && i === path.length - 1;
              return (
                <span key={`${step.nodeId}-${i}`} className="branching-reader-preview__crumb">
                  {i > 0 && <span className="branching-reader-preview__crumb-sep" aria-hidden>›</span>}
                  <span className={`branching-reader-preview__crumb-pill${isActive ? ' branching-reader-preview__crumb-pill--active' : ''}`}>
                    {label}
                  </span>
                </span>
              );
            })}
          </nav>

          {active && (
            <div className="branching-reader-preview__scene branching-reader-preview__scene--live">
              <h3 className="branching-reader-preview__scene-title">{active.title || t('branchingEditor.nodeTitle')}</h3>
              <p className="branching-reader-preview__body">{active.body || t('branchingEditor.previewEmpty')}</p>
              <div className="branching-reader-preview__choices">
                {active.choiceA.trim() && (
                  <button
                    type="button"
                    className="branching-reader-choice branching-reader-choice--btn"
                    onClick={() => choose('A')}
                    disabled={ended || (atEnd && !resolveChoiceTarget(visible, active.id, 'A'))}
                  >
                    {active.choiceA}
                  </button>
                )}
                {active.choiceB.trim() && (
                  <button
                    type="button"
                    className="branching-reader-choice branching-reader-choice--btn branching-reader-choice--alt"
                    onClick={() => choose('B')}
                    disabled={ended || (atEnd && !resolveChoiceTarget(visible, active.id, 'B'))}
                  >
                    {active.choiceB}
                  </button>
                )}
              </div>
              {atEnd && (
                <p className="branching-reader-preview__end input-hint">{t('branchingEditor.previewEnd')}</p>
              )}
            </div>
          )}
        </>
      )}

      {variant === 'panel' && (
        <p className="alternate-reader-preview__footnote input-hint">{t('branchingEditor.previewFootnote')}</p>
      )}
      {variant === 'fullscreen' && (
        <div className="alternate-reader-preview__controls">
          <button type="button" className="katha-btn katha-btn--ghost katha-btn--sm" onClick={reset}>
            {t('branchingEditor.previewReset')}
          </button>
        </div>
      )}
    </aside>
  );
}