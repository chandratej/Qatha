import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Cloud,
  Eye,
  GitBranch,
  Loader2,
  Map,
  PenLine,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { BranchingReaderPreview } from '../../components/editors/BranchingReaderPreview';
import { BranchGraphCanvas } from '../../components/editors/BranchGraphCanvas';
import { BranchGraphValidation } from '../../components/editors/BranchGraphValidation';
import { TeluguTextField } from '../../components/TeluguTextField';
import { useLocale } from '../../context/LocaleContext';
import { validateBranchGraph, normalizeBranchNodes } from '../../lib/branchingGraph';
import type { BranchNode } from '../../lib/alternateEditorCache';
import { saveBranchingDraft } from '../../lib/alternateEditorCache';
import { loadBranchingMerged, saveBranchingCloud } from '../../lib/alternateEditorSync';
import '../../styles/editor-prototype.css';
import '../../styles/branching-studio.css';

const LOCAL_AUTOSAVE_MS = 800;
const CLOUD_AUTOSAVE_MS = 2500;

const DEFAULT_NODES: BranchNode[] = [
  {
    id: 'node-1',
    title: 'తొలి ఎంపిక',
    body: 'ఉదయం లేఖ వచ్చింది. ఆవరణ గేటు దగ్గర నుంచి రెండు దారులు తెరుచుకుంటాయి.',
    choiceA: 'దూతను వెంబడించి కోటలోకి వెళ్లు',
    choiceB: 'ఊరిలోనే ఉండి పెద్దని ఎదుర్కో',
    choiceATarget: 'node-2',
    choiceBTarget: 'node-3',
  },
  {
    id: 'node-2',
    title: 'పాత కోట',
    body: 'గ్రామం కంటే పాత రాతి గోడలపై టార్చ్ వెలుగు వణుకుతోంది.',
    choiceA: '',
    choiceB: '',
    choiceATarget: null,
    choiceBTarget: null,
  },
  {
    id: 'node-3',
    title: 'పెద్ద ఆవరణ',
    body: 'పెద్ద టీతో ఎదురు చూస్తున్నాడు — మీరు ఇంకా సిద్ధం కాని ప్రశ్నతో.',
    choiceA: '',
    choiceB: '',
    choiceATarget: null,
    choiceBTarget: null,
  },
];

type CloudSyncState = 'idle' | 'syncing' | 'synced' | 'local' | 'error';

function createNode(index: number, isTe: boolean): BranchNode {
  return {
    id: `node-${Date.now()}-${index}`,
    title: isTe ? `సీన్ ${index}` : `Scene ${index}`,
    body: '',
    choiceA: '',
    choiceB: '',
    choiceATarget: null,
    choiceBTarget: null,
  };
}

/**
 * Branching interactive fiction studio — focused scene writing + optional graph.
 * Route: /stories/:storyId/branching/:chapterNum
 */
export function BranchingEditor() {
  const { storyId, chapterNum } = useParams<{ storyId: string; chapterNum: string }>();
  const navigate = useNavigate();
  const { t, locale } = useLocale();
  const isTe = locale === 'te';
  const chapter = Number(chapterNum) || 1;
  const storyKey = storyId ?? '';

  const [chapterTitle, setChapterTitle] = useState(
    isTe ? `అధ్యాయం ${chapter}` : `Chapter ${chapter}`,
  );
  const [nodes, setNodes] = useState<BranchNode[]>(DEFAULT_NODES);
  const [activeNodeId, setActiveNodeId] = useState(DEFAULT_NODES[0]!.id);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [, setLastSaved] = useState<Date | null>(null);
  const [cloudSync, setCloudSync] = useState<CloudSyncState>('idle');
  /**
   * Preview open by default — same model as chat fiction side-panel reader.
   * Eye toggles focus; writer can still collapse it.
   */
  const [previewMode, setPreviewMode] = useState(true);
  const [mapOpen, setMapOpen] = useState(false);
  const [railOpen, setRailOpen] = useState(true);
  /** When author picks a scene, the phone reader jumps there and shows that node's A/B. */
  const [previewFocusId, setPreviewFocusId] = useState<string | null>(null);
  const [previewFocusNonce, setPreviewFocusNonce] = useState(0);

  const openPreviewAt = useCallback((nodeId: string) => {
    setPreviewMode(true);
    setPreviewFocusId(nodeId);
    setPreviewFocusNonce((n) => n + 1);
  }, []);
  const localTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cloudTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cloudInFlight = useRef(false);

  useEffect(() => {
    document.body.classList.add('branching-studio-body');
    return () => document.body.classList.remove('branching-studio-body');
  }, []);

  useEffect(() => {
    if (!storyKey) return;
    let cancelled = false;
    setLoading(true);
    const fallbackTitle = isTe ? `అధ్యాయం ${chapter}` : `Chapter ${chapter}`;
    loadBranchingMerged(storyKey, chapter, fallbackTitle, DEFAULT_NODES)
      .then((merged) => {
        if (cancelled) return;
        setChapterTitle(merged.title);
        const next = normalizeBranchNodes(merged.data);
        setNodes(next);
        const firstId = next[0]?.id ?? DEFAULT_NODES[0]!.id;
        setActiveNodeId(firstId);
        setPreviewFocusId(firstId);
        setPreviewMode(true);
        if (merged.updated_at > 0) setLastSaved(new Date(merged.updated_at));
        setCloudSync(merged.source === 'cloud' ? 'synced' : merged.source === 'local' ? 'local' : 'idle');
      })
      .catch(() => {
        if (!cancelled) setCloudSync('error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [storyKey, chapter, isTe]);

  const persistLocal = useCallback((title: string, items: BranchNode[]) => {
    if (!storyKey) return;
    saveBranchingDraft(storyKey, chapter, { title, nodes: items });
    setLastSaved(new Date());
    if (cloudSync === 'synced') setCloudSync('local');
  }, [storyKey, chapter, cloudSync]);

  const persistCloud = useCallback(async (title: string, items: BranchNode[]) => {
    if (!storyKey || cloudInFlight.current) return;
    cloudInFlight.current = true;
    setCloudSync('syncing');
    try {
      const result = await saveBranchingCloud(storyKey, chapter, { title, nodes: items });
      setLastSaved(new Date(result.updated_at));
      setCloudSync('synced');
    } catch {
      setCloudSync('error');
    } finally {
      cloudInFlight.current = false;
    }
  }, [storyKey, chapter]);

  useEffect(() => {
    if (!storyKey || loading) return;
    if (localTimer.current) clearTimeout(localTimer.current);
    localTimer.current = setTimeout(() => {
      persistLocal(chapterTitle, nodes);
    }, LOCAL_AUTOSAVE_MS);
    return () => {
      if (localTimer.current) clearTimeout(localTimer.current);
    };
  }, [chapterTitle, nodes, storyKey, loading, persistLocal]);

  useEffect(() => {
    if (!storyKey || loading) return;
    if (cloudTimer.current) clearTimeout(cloudTimer.current);
    cloudTimer.current = setTimeout(() => {
      void persistCloud(chapterTitle, nodes);
    }, CLOUD_AUTOSAVE_MS);
    return () => {
      if (cloudTimer.current) clearTimeout(cloudTimer.current);
    };
  }, [chapterTitle, nodes, storyKey, loading, persistCloud]);

  const handleSaveDraft = useCallback(() => {
    setSaving(true);
    void persistCloud(chapterTitle, nodes).finally(() => setSaving(false));
  }, [chapterTitle, nodes, persistCloud]);

  const addNode = useCallback(() => {
    setNodes((prev) => {
      const n = createNode(prev.length + 1, isTe);
      setActiveNodeId(n.id);
      return [...prev, n];
    });
  }, [isTe]);

  const updateNode = useCallback((id: string, patch: Partial<BranchNode>) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }, []);

  const removeNode = useCallback((id: string) => {
    setNodes((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((n) => n.id !== id).map((n) => ({
        ...n,
        choiceATarget: n.choiceATarget === id ? null : n.choiceATarget,
        choiceBTarget: n.choiceBTarget === id ? null : n.choiceBTarget,
      }));
      setActiveNodeId((cur) => (cur === id ? next[0]!.id : cur));
      return next;
    });
  }, []);

  const graphIssues = useMemo(() => validateBranchGraph(nodes), [nodes]);
  const activeNode = nodes.find((n) => n.id === activeNodeId) ?? nodes[0];
  const activeIndex = Math.max(0, nodes.findIndex((n) => n.id === activeNode?.id));

  const syncLabel = (() => {
    if (cloudSync === 'syncing') return t('branchingEditor.cloudSyncing');
    if (cloudSync === 'synced') return t('branchingEditor.cloudSynced');
    if (cloudSync === 'local') return t('branchingEditor.cloudPending');
    if (cloudSync === 'error') return t('branchingEditor.cloudError');
    return null;
  })();

  if (loading) {
    return (
      <div className="br-studio" data-katha-mode="creation" lang={isTe ? 'te' : 'en'}>
        <p className="cms-loading cms-loading--inline">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div
      className={[
        'br-studio',
        previewMode ? 'br-studio--preview' : '',
        mapOpen ? 'br-studio--map' : '',
        railOpen ? 'br-studio--rail' : 'br-studio--rail-off',
      ].filter(Boolean).join(' ')}
      data-katha-mode="creation"
      lang={isTe ? 'te' : 'en'}
    >
      <header className="br-studio__bar">
        <div className="br-studio__bar-left">
          <button
            type="button"
            className="br-studio__icon-btn"
            onClick={() => navigate(`/stories/${storyId}`)}
            aria-label={t('branchingEditor.back')}
          >
            <ArrowLeft size={18} />
          </button>
          <button
            type="button"
            className={`br-studio__icon-btn${railOpen ? ' is-on' : ''}`}
            onClick={() => setRailOpen((v) => !v)}
            aria-pressed={railOpen}
            title={t('branchingEditor.flowLabel')}
          >
            <GitBranch size={16} />
          </button>
        </div>

        <TeluguTextField
          className="br-studio__title"
          value={chapterTitle}
          onChange={setChapterTitle}
          phonetic
          lang="te"
          aria-label={t('branchingEditor.chapterTitle')}
        />

        <div className="br-studio__bar-right">
          <button
            type="button"
            className={`br-studio__icon-btn${mapOpen ? ' is-on' : ''}`}
            onClick={() => setMapOpen((v) => !v)}
            aria-pressed={mapOpen}
            title={t('branchingEditor.canvasLabel')}
          >
            <Map size={16} />
          </button>
          <button
            type="button"
            className={`br-studio__icon-btn${previewMode ? ' is-on' : ''}`}
            onClick={() => {
              if (previewMode) {
                setPreviewMode(false);
              } else {
                openPreviewAt(activeNodeId || nodes[0]?.id || '');
              }
            }}
            aria-pressed={previewMode}
            title={previewMode ? t('branchingEditor.editMode') : t('branchingEditor.previewMode')}
          >
            {previewMode ? <PenLine size={16} /> : <Eye size={16} />}
          </button>
          <button
            type="button"
            className="br-studio__icon-btn"
            disabled={saving || cloudSync === 'syncing'}
            onClick={handleSaveDraft}
            title={syncLabel || t('branchingEditor.saveDraft')}
            aria-label={t('branchingEditor.saveDraft')}
          >
            {saving || cloudSync === 'syncing'
              ? <Loader2 size={16} className="cms-loading__spin" />
              : cloudSync === 'synced'
                ? <Cloud size={16} />
                : <Save size={16} />}
          </button>
          <button type="button" className="br-studio__add" onClick={addNode}>
            <Plus size={16} />
          </button>
        </div>
      </header>

      <div className="br-studio__body">
        {/* Scene rail — optional */}
        {railOpen && (
        <aside className="br-studio__rail" aria-label={t('branchingEditor.flowLabel')}>
          <div className="br-studio__rail-head">
            <span>{nodes.length} {t('branchingEditor.nodeCount')}</span>
          </div>
          <ul className="br-studio__rail-list">
            {nodes.map((n, i) => {
              const issue = graphIssues.some((x) => x.nodeId === n.id);
              const aText = n.choiceA.trim();
              const bText = n.choiceB.trim();
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    className={`br-studio__rail-item${n.id === activeNode?.id ? ' is-active' : ''}${issue ? ' has-issue' : ''}`}
                    onClick={() => {
                      setActiveNodeId(n.id);
                      openPreviewAt(n.id);
                    }}
                  >
                    <span className="br-studio__rail-num" aria-hidden>{i + 1}</span>
                    <span className="br-studio__rail-copy">
                      <span className="br-studio__rail-title">{n.title || (isTe ? 'సీన్' : 'Scene')}</span>
                      {(aText || bText) && (
                        <span className="br-studio__rail-forks">
                          {aText && <span className="br-studio__rail-fork br-studio__rail-fork--a">A · {aText}</span>}
                          {bText && <span className="br-studio__rail-fork br-studio__rail-fork--b">B · {bText}</span>}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <button type="button" className="br-studio__rail-add" onClick={addNode}>
            <Plus size={15} />
            {t('branchingEditor.addNode')}
          </button>
        </aside>
        )}

        {/* Focused writing surface */}
        <main className="br-studio__main">
          {mapOpen && (
            <section className="br-studio__map-panel">
              <button
                type="button"
                className="br-studio__map-toggle"
                onClick={() => setMapOpen(false)}
              >
                <ChevronUp size={14} />
                {isTe ? 'మ్యాప్ దాచు' : 'Hide map'}
              </button>
              <BranchGraphCanvas
                nodes={nodes}
                activeNodeId={activeNode?.id}
                issues={graphIssues}
                onSelectNode={(id) => {
                  setActiveNodeId(id);
                  if (previewMode) openPreviewAt(id);
                }}
                compact
              />
              <BranchGraphValidation nodes={nodes} />
            </section>
          )}

          {!mapOpen && graphIssues.length > 0 && (
            <button
              type="button"
              className="br-studio__map-nudge"
              onClick={() => setMapOpen(true)}
            >
              <Map size={14} />
              {isTe ? `${graphIssues.length} సమస్యలు — మ్యాప్ చూడండి` : `${graphIssues.length} issues — open map`}
              <ChevronDown size={14} />
            </button>
          )}

          {activeNode && (
            <article className="br-studio__scene" key={activeNode.id}>
              <header className="br-studio__scene-head">
                <span className="br-studio__scene-index" aria-hidden>{activeIndex + 1}</span>
                <TeluguTextField
                  className="br-studio__scene-title"
                  value={activeNode.title}
                  onChange={(v) => updateNode(activeNode.id, { title: v })}
                  phonetic
                  lang="te"
                  aria-label={t('branchingEditor.nodeTitle')}
                  placeholder={t('branchingEditor.nodeTitle')}
                />
                <button
                  type="button"
                  className="br-studio__scene-del"
                  onClick={() => removeNode(activeNode.id)}
                  disabled={nodes.length <= 1}
                  aria-label={isTe ? 'సీన్ తొలగించు' : 'Remove scene'}
                  title={isTe ? 'సీన్ తొలగించు' : 'Remove scene'}
                >
                  <Trash2 size={15} />
                </button>
              </header>

              <label className="br-studio__field">
                <span className="br-studio__field-label">{isTe ? 'సీన్ కథ' : 'Scene text'}</span>
                <TeluguTextField
                  multiline
                  className="br-studio__body"
                  value={activeNode.body}
                  onChange={(v) => updateNode(activeNode.id, { body: v })}
                  phonetic
                  lang="te"
                  rows={8}
                  placeholder={t('branchingEditor.nodeBodyPlaceholder')}
                />
              </label>

              <div className="br-studio__forks">
                <p className="br-studio__forks-hint">
                  {isTe
                    ? 'పాఠకుడు A/B నొక్కితే కింది సీన్ తెరవబడుతుంది. ప్రతి ఎంపికకు గమ్యం సెట్ చేయండి.'
                    : 'When the reader taps A or B, that linked scene opens next. Set a destination for each choice.'}
                </p>
                <div className="br-studio__fork br-studio__fork--a">
                  <span className="br-studio__fork-badge">A</span>
                  <TeluguTextField
                    className="br-studio__fork-input"
                    value={activeNode.choiceA}
                    onChange={(v) => updateNode(activeNode.id, { choiceA: v })}
                    phonetic
                    lang="te"
                    placeholder={t('branchingEditor.choiceA')}
                    aria-label={t('branchingEditor.choiceA')}
                  />
                  <label className="br-studio__fork-target">
                    <span>{t('branchingEditor.targetA')}</span>
                    <select
                      value={activeNode.choiceATarget ?? ''}
                      onChange={(e) =>
                        updateNode(activeNode.id, { choiceATarget: e.target.value || null })
                      }
                    >
                      <option value="">{t('branchingEditor.targetEnd')}</option>
                      {nodes.filter((n) => n.id !== activeNode.id).map((n) => (
                        <option key={n.id} value={n.id}>{n.title || n.id}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="br-studio__fork br-studio__fork--b">
                  <span className="br-studio__fork-badge">B</span>
                  <TeluguTextField
                    className="br-studio__fork-input"
                    value={activeNode.choiceB}
                    onChange={(v) => updateNode(activeNode.id, { choiceB: v })}
                    phonetic
                    lang="te"
                    placeholder={t('branchingEditor.choiceB')}
                    aria-label={t('branchingEditor.choiceB')}
                  />
                  <label className="br-studio__fork-target">
                    <span>{t('branchingEditor.targetB')}</span>
                    <select
                      value={activeNode.choiceBTarget ?? ''}
                      onChange={(e) =>
                        updateNode(activeNode.id, { choiceBTarget: e.target.value || null })
                      }
                    >
                      <option value="">{t('branchingEditor.targetEnd')}</option>
                      {nodes.filter((n) => n.id !== activeNode.id).map((n) => (
                        <option key={n.id} value={n.id}>{n.title || n.id}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <footer className="br-studio__scene-foot">
                <button
                  type="button"
                  className="br-studio__nav"
                  disabled={activeIndex <= 0}
                  onClick={() => setActiveNodeId(nodes[activeIndex - 1]!.id)}
                >
                  {isTe ? '← మునుపటి' : '← Previous'}
                </button>
                <span className="br-studio__scene-pos">
                  {activeIndex + 1} / {nodes.length}
                </span>
                <button
                  type="button"
                  className="br-studio__nav"
                  disabled={activeIndex >= nodes.length - 1}
                  onClick={() => setActiveNodeId(nodes[activeIndex + 1]!.id)}
                >
                  {isTe ? 'తర్వాత →' : 'Next →'}
                </button>
              </footer>
            </article>
          )}
        </main>

        {previewMode && (
          <aside className="br-studio__preview" aria-label={t('branchingEditor.previewLabel')}>
            <BranchingReaderPreview
              chapterTitle={chapterTitle}
              nodes={nodes}
              focusNodeId={previewFocusId ?? activeNode?.id ?? null}
              focusNonce={previewFocusNonce}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
