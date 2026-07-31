import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import type { BranchNode } from '../../lib/alternateEditorCache';
import {
  getStartNodeId,
  findNode,
  normalizeBranchNodes,
  type BranchChoice,
} from '../../lib/branchingGraph';

interface JourneyBeat {
  kind: 'scene' | 'choice' | 'ending';
  nodeId: string;
  title: string;
  body?: string;
  choiceKey?: BranchChoice;
  leadsTo?: string;
}

interface Props {
  chapterTitle: string;
  nodes: BranchNode[];
  focusNodeId?: string | null;
  focusNonce?: number;
  variant?: 'panel' | 'fullscreen';
}

function resolveNext(node: BranchNode, choice: BranchChoice, graph: BranchNode[]): string | null {
  const raw = choice === 'A' ? node.choiceATarget : node.choiceBTarget;
  if (raw == null || String(raw).trim() === '') return null;
  return findNode(graph, String(raw))?.id ?? null;
}

function sceneTitle(node: BranchNode, isTe: boolean): string {
  return node.title?.trim() || (isTe ? 'సీన్' : 'Scene');
}

function sceneBody(node: BranchNode, isTe: boolean): string {
  return node.body?.trim()
    || (isTe ? 'ఈ సీన్‌లో ఇంకా కథ రాయలేదు.' : 'No scene text yet — write it in the editor.');
}

function sceneBeat(node: BranchNode, isTe: boolean): JourneyBeat {
  return {
    kind: 'scene',
    nodeId: node.id,
    title: sceneTitle(node, isTe),
    body: sceneBody(node, isTe),
  };
}

function destinationLabel(id: string | null, graph: BranchNode[], isTe: boolean): string {
  if (!id) return isTe ? 'ముగింపు' : 'Ending';
  return findNode(graph, id)?.title?.trim() || (isTe ? 'తర్వాతి సీన్' : 'Next scene');
}

/**
 * Live branching playthrough.
 * A/B live OUTSIDE the scroll area so they are always on screen.
 * Tapping A/B follows choiceATarget / choiceBTarget.
 */
export function BranchingReaderPreview({
  chapterTitle,
  nodes,
  focusNodeId = null,
  focusNonce = 0,
  variant = 'panel',
}: Props) {
  const { t, locale } = useLocale();
  const isTe = locale === 'te';
  const threadRef = useRef<HTMLDivElement>(null);
  const busyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const graph = useMemo(() => normalizeBranchNodes(nodes ?? []), [nodes]);

  // Reset playthrough only when graph links / node set change — not on every choice-text keystroke
  const structureKey = useMemo(
    () => graph.map((n) => `${n.id}|${n.choiceATarget ?? ''}|${n.choiceBTarget ?? ''}`).join('||'),
    [graph],
  );

  const initialId = useMemo(() => {
    if (focusNodeId && findNode(graph, focusNodeId)) return focusNodeId;
    return getStartNodeId(graph);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- mount only

  const [currentId, setCurrentId] = useState<string | null>(initialId);
  const [beats, setBeats] = useState<JourneyBeat[]>(() => {
    const id = initialId;
    const n = id ? findNode(graph, id) : undefined;
    return n ? [sceneBeat(n, isTe)] : [];
  });
  const [ended, setEnded] = useState(false);
  const [busy, setBusy] = useState(false);

  const clearBusyTimer = useCallback(() => {
    if (busyTimer.current != null) {
      clearTimeout(busyTimer.current);
      busyTimer.current = null;
    }
  }, []);

  const beginAt = useCallback((id: string | null) => {
    clearBusyTimer();
    const node = id ? findNode(graph, id) : undefined;
    if (!node) {
      setCurrentId(null);
      setBeats([]);
      setEnded(false);
      setBusy(false);
      return;
    }
    setCurrentId(node.id);
    setEnded(false);
    setBusy(false);
    setBeats([sceneBeat(node, isTe)]);
  }, [graph, isTe, clearBusyTimer]);

  // Keep playthrough aligned with graph + author focus
  useEffect(() => {
    const preferred = (focusNodeId && findNode(graph, focusNodeId))
      ? focusNodeId
      : (currentId && findNode(graph, currentId) ? currentId : getStartNodeId(graph));
    beginAt(preferred);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structureKey]);

  useEffect(() => {
    if (!focusNodeId || !findNode(graph, focusNodeId)) return;
    beginAt(focusNodeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusNodeId, focusNonce]);

  useEffect(() => () => clearBusyTimer(), [clearBusyTimer]);

  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [beats.length, ended, currentId]);

  // Prefer live graph node so A/B text/targets update as author types
  const active = currentId ? findNode(graph, currentId) : undefined;
  const labelA = (active?.choiceA ?? '').trim();
  const labelB = (active?.choiceB ?? '').trim();
  const nextA = active ? resolveNext(active, 'A', graph) : null;
  const nextB = active ? resolveNext(active, 'B', graph) : null;

  // Always show A and B for the current scene (fallback copy if blank)
  const displayA = labelA || (isTe ? 'ఎంపిక A' : 'Choice A');
  const displayB = labelB || (isTe ? 'ఎంపిక B' : 'Choice B');
  const canPickA = Boolean(active) && !ended && !busy;
  const canPickB = Boolean(active) && !ended && !busy;
  const showChoices = Boolean(active) && !ended;

  const choose = useCallback((choice: BranchChoice) => {
    if (!currentId || ended || busy) return;
    const node = findNode(graph, currentId);
    if (!node) return;

    const written = (choice === 'A' ? node.choiceA : node.choiceB).trim()
      || (choice === 'A' ? (isTe ? 'ఎంపిక A' : 'Choice A') : (isTe ? 'ఎంపిక B' : 'Choice B'));
    const nextId = resolveNext(node, choice, graph);
    const leadsTo = destinationLabel(nextId, graph, isTe);

    setBusy(true);
    setBeats((prev) => [
      ...prev,
      {
        kind: 'choice',
        nodeId: currentId,
        title: written,
        choiceKey: choice,
        leadsTo,
      },
    ]);

    clearBusyTimer();
    busyTimer.current = setTimeout(() => {
      busyTimer.current = null;

      if (!nextId) {
        setBeats((prev) => [
          ...prev,
          {
            kind: 'ending',
            nodeId: currentId,
            title: isTe ? 'ముగింపు' : 'The end',
            body: isTe
              ? `“${written}” — ఈ ఎంపికతో కథ ఇక్కడ ఆగుతుంది. ఎడిటర్‌లో గమ్య సీన్ సెట్ చేయండి.`
              : `“${written}” — path ends here. Set a target scene in the editor for this choice.`,
          },
        ]);
        setEnded(true);
        setBusy(false);
        return;
      }

      const next = findNode(graph, nextId);
      if (!next) {
        setBeats((prev) => [
          ...prev,
          {
            kind: 'ending',
            nodeId: currentId,
            title: isTe ? 'ముగింపు' : 'The end',
            body: isTe
              ? 'గమ్య సీన్ దొరకలేదు — టార్గెట్ IDని తనిఖీ చేయండి.'
              : 'Target scene not found — check the A/B link in the editor.',
          },
        ]);
        setEnded(true);
        setBusy(false);
        return;
      }

      setCurrentId(nextId);
      setBeats((prev) => [...prev, sceneBeat(next, isTe)]);
      setEnded(false);
      setBusy(false);
    }, 220);
  }, [currentId, ended, busy, graph, isTe, clearBusyTimer]);

  const reset = useCallback(() => {
    beginAt(getStartNodeId(graph));
  }, [beginAt, graph]);

  if (graph.length === 0) {
    return (
      <aside className="br-play" aria-label={t('branchingEditor.previewLabel')}>
        <p className="br-play__empty">{t('branchingEditor.previewEmpty')}</p>
      </aside>
    );
  }

  return (
    <aside
      className={[
        'br-play',
        variant === 'fullscreen' ? 'br-play--fullscreen' : '',
      ].filter(Boolean).join(' ')}
      aria-label={t('branchingEditor.previewLabel')}
      lang={isTe ? 'te' : 'en'}
    >
      <header className="br-play__head">
        <div className="br-play__head-text">
          <span className="br-play__eyebrow">{t('branchingEditor.previewLabel')}</span>
          <h2 className="br-play__title">
            {chapterTitle || (isTe ? 'అధ్యాయం' : 'Chapter')}
          </h2>
        </div>
        <button
          type="button"
          className="br-play__reset"
          onClick={reset}
          aria-label={t('branchingEditor.previewReset')}
          title={t('branchingEditor.previewReset')}
        >
          <RotateCcw size={14} aria-hidden />
        </button>
      </header>

      {/* Scrollable story only */}
      <div ref={threadRef} className="br-play__thread" aria-live="polite">
        {beats.map((beat, i) => {
          if (beat.kind === 'choice') {
            return (
              <div key={`c-${i}`} className="br-play__you-chose">
                <span className="br-play__you-key">{beat.choiceKey}</span>
                <div>
                  <strong>{isTe ? 'మీరు ఎంచుకున్నారు' : 'You chose'}</strong>
                  <p>{beat.title}</p>
                  <em>→ {beat.leadsTo}</em>
                </div>
              </div>
            );
          }
          if (beat.kind === 'ending') {
            return (
              <article key={`e-${i}`} className="br-play__card br-play__card--end">
                <span className="br-play__badge">{isTe ? 'ముగింపు' : 'The end'}</span>
                <h3>{beat.title}</h3>
                <p>{beat.body}</p>
              </article>
            );
          }
          const isLatest = i === beats.length - 1 && !ended;
          return (
            <article
              key={`s-${beat.nodeId}-${i}`}
              className={`br-play__card${isLatest ? ' is-now' : ' is-past'}`}
            >
              <span className="br-play__badge">{beat.title}</span>
              <p className="br-play__body">{beat.body}</p>
            </article>
          );
        })}
        {busy && (
          <p className="br-play__loading">{isTe ? 'తర్వాతి సీన్…' : 'Opening next scene…'}</p>
        )}
      </div>

      {/* A/B always pinned below the thread — never clipped by phone scroll */}
      {showChoices && active && (
        <div className="br-play__choices" role="group" aria-label={isTe ? 'ఎంపికలు' : 'Choices'}>
          <p className="br-play__choices-label">
            {isTe ? 'తర్వాత ఏం జరుగుతుంది?' : 'What happens next?'}
          </p>
          <button
            type="button"
            className="br-play__btn br-play__btn--a"
            disabled={!canPickA}
            onClick={() => choose('A')}
          >
            <span className="br-play__btn-key">A</span>
            <span className="br-play__btn-copy">
              <span className="br-play__btn-main">{displayA}</span>
              <span className="br-play__btn-dest">→ {destinationLabel(nextA, graph, isTe)}</span>
            </span>
          </button>
          <button
            type="button"
            className="br-play__btn br-play__btn--b"
            disabled={!canPickB}
            onClick={() => choose('B')}
          >
            <span className="br-play__btn-key">B</span>
            <span className="br-play__btn-copy">
              <span className="br-play__btn-main">{displayB}</span>
              <span className="br-play__btn-dest">→ {destinationLabel(nextB, graph, isTe)}</span>
            </span>
          </button>
        </div>
      )}

      {ended && (
        <div className="br-play__end-bar">
          <button type="button" className="br-play__restart" onClick={reset}>
            <RotateCcw size={14} aria-hidden />
            {isTe ? 'మళ్లీ ప్రారంభం' : 'Restart'}
          </button>
        </div>
      )}

      {!showChoices && !ended && active && (
        <div className="br-play__end-bar">
          <p className="br-play__hint">
            {isTe ? 'ఈ సీన్‌కు ఎంపికలు లేవు.' : 'No choices on this scene.'}
          </p>
          <button type="button" className="br-play__restart" onClick={reset}>
            <RotateCcw size={14} aria-hidden />
            {isTe ? 'మళ్లీ ప్రారంభం' : 'Restart'}
          </button>
        </div>
      )}
    </aside>
  );
}
