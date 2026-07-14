import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Cloud, CloudOff, Eye, GitBranch, Loader2, PenLine, Plus, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BranchingReaderPreview } from '../../components/editors/BranchingReaderPreview';
import { BranchGraphMap } from '../../components/editors/BranchGraphMap';
import { BranchGraphCanvas } from '../../components/editors/BranchGraphCanvas';
import { BranchGraphValidation } from '../../components/editors/BranchGraphValidation';
import { validateBranchGraph } from '../../lib/branchingGraph';
import { normalizeBranchNodes } from '../../lib/branchingGraph';
import { useLocale } from '../../context/LocaleContext';
import { StudioGlyph } from '../../components/studio/StudioGlyph';
import type { BranchNode } from '../../lib/alternateEditorCache';
import { saveBranchingDraft } from '../../lib/alternateEditorCache';
import { loadBranchingMerged, saveBranchingCloud } from '../../lib/alternateEditorSync';
import '../../styles/editor-prototype.css';

const LOCAL_AUTOSAVE_MS = 800;
const CLOUD_AUTOSAVE_MS = 2500;

const DEFAULT_NODES: BranchNode[] = [
  {
    id: 'node-1',
    title: 'Opening fork',
    body: 'The letter arrives at dawn. Two paths unfold from the courtyard gate.',
    choiceA: 'Follow the messenger into the old fort',
    choiceB: 'Stay and confront the village elder',
    choiceATarget: 'node-2',
    choiceBTarget: 'node-3',
  },
  {
    id: 'node-2',
    title: 'The old fort',
    body: 'Torchlight flickers on stone walls older than the village itself.',
    choiceA: '',
    choiceB: '',
    choiceATarget: null,
    choiceBTarget: null,
  },
  {
    id: 'node-3',
    title: 'The elder\'s courtyard',
    body: 'The elder waits with tea and a question you are not ready to answer.',
    choiceA: '',
    choiceB: '',
    choiceATarget: null,
    choiceBTarget: null,
  },
];

type CloudSyncState = 'idle' | 'syncing' | 'synced' | 'local' | 'error';

function createNode(index: number): BranchNode {
  return {
    id: `node-${Date.now()}-${index}`,
    title: `Scene ${index}`,
    body: '',
    choiceA: '',
    choiceB: '',
    choiceATarget: null,
    choiceBTarget: null,
  };
}

/**
 * Branching editor — choice-node shell with local + cloud draft persistence.
 * Route: /stories/:storyId/branching/:chapterNum
 */
export function BranchingEditor() {
  const { storyId, chapterNum } = useParams<{ storyId: string; chapterNum: string }>();
  const navigate = useNavigate();
  const { t } = useLocale();
  const chapter = Number(chapterNum) || 1;
  const storyKey = storyId ?? '';

  const [chapterTitle, setChapterTitle] = useState(`Chapter ${chapter}`);
  const [nodes, setNodes] = useState<BranchNode[]>(DEFAULT_NODES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [cloudSync, setCloudSync] = useState<CloudSyncState>('idle');
  const [previewMode, setPreviewMode] = useState(false);
  const localTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cloudTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cloudInFlight = useRef(false);

  useEffect(() => {
    if (!storyKey) return;
    let cancelled = false;
    setLoading(true);
    loadBranchingMerged(storyKey, chapter, `Chapter ${chapter}`, DEFAULT_NODES)
      .then((merged) => {
        if (cancelled) return;
        setChapterTitle(merged.title);
        setNodes(normalizeBranchNodes(merged.data));
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
  }, [storyKey, chapter]);

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
    setNodes((prev) => [...prev, createNode(prev.length + 1)]);
  }, []);

  const updateNode = useCallback((id: string, patch: Partial<BranchNode>) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }, []);

  const savedTimeLabel = lastSaved
    ? lastSaved.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
    : null;

  const graphIssues = validateBranchGraph(nodes);

  const syncLabel = (() => {
    if (cloudSync === 'syncing') return t('branchingEditor.cloudSyncing');
    if (cloudSync === 'synced') return t('branchingEditor.cloudSynced');
    if (cloudSync === 'local') return t('branchingEditor.cloudPending');
    if (cloudSync === 'error') return t('branchingEditor.cloudError');
    return null;
  })();

  if (loading) {
    return (
      <div className="katha-proto-layout katha-proto-layout--premium katha-proto-layout--calm26 branching-editor branching-editor--premium wc-page-enter" data-katha-mode="creation">
        <p className="cms-loading cms-loading--inline">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className={`katha-proto-layout katha-proto-layout--premium katha-proto-layout--calm26 branching-editor branching-editor--premium branching-editor--split${previewMode ? ' branching-editor--preview-focus' : ''} wc-page-enter`} data-katha-mode="creation">
      <header className="katha-editor-chrome branching-editor__chrome">
        <div className="katha-editor-chrome__row katha-editor-chrome__row--primary">
          <div className="katha-editor-chrome__leading">
            <button
              type="button"
              className="katha-icon-btn"
              onClick={() => navigate(`/stories/${storyId}`)}
              aria-label={t('branchingEditor.back')}
            >
              <ArrowLeft size={18} aria-hidden />
            </button>
            <span className="branching-editor__badge">
              <GitBranch size={14} aria-hidden />
              {t('branchingEditor.badge')}
            </span>
          </div>
          <div className="katha-editor-doc-actions">
            <button type="button" className="katha-btn katha-btn--ghost" onClick={addNode}>
              <Plus size={16} aria-hidden />
              {t('branchingEditor.addNode')}
            </button>
            <Link
              to={`/stories/${storyId}/read/branching/${chapter}`}
              className="katha-btn katha-btn--ghost"
              target="_blank"
              rel="noopener noreferrer"
            >
              <BookOpen size={16} aria-hidden />
              {t('branchingEditor.openReader')}
            </Link>
            <button
              type="button"
              className="katha-btn katha-btn--ghost branching-editor__mode-toggle"
              onClick={() => setPreviewMode((v) => !v)}
              aria-pressed={previewMode}
            >
              {previewMode ? <PenLine size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
              {previewMode ? t('branchingEditor.editMode') : t('branchingEditor.previewMode')}
            </button>
            <button
              type="button"
              className="katha-btn katha-btn--ghost"
              disabled={saving || cloudSync === 'syncing'}
              onClick={handleSaveDraft}
            >
              {saving || cloudSync === 'syncing'
                ? <Loader2 size={16} className="cms-loading__spin" aria-hidden />
                : <Save size={16} aria-hidden />}
              {saving || cloudSync === 'syncing' ? t('branchingEditor.saving') : t('branchingEditor.saveDraft')}
            </button>
          </div>
        </div>
        <div className="katha-editor-chrome__row katha-editor-chrome__row--meta">
          <input
            className="katha-inline-title-input branching-editor__title"
            value={chapterTitle}
            onChange={(e) => setChapterTitle(e.target.value)}
            aria-label={t('branchingEditor.chapterTitle')}
          />
          <span className="katha-editor-doc-meta__sep" aria-hidden>·</span>
          <span className="input-hint">{nodes.length} {t('branchingEditor.nodeCount')}</span>
          {savedTimeLabel && (
            <>
              <span className="katha-editor-doc-meta__sep" aria-hidden>·</span>
              <span className="alternate-editor__autosave">
                {t('branchingEditor.savedPrefix')} {savedTimeLabel}
              </span>
            </>
          )}
          {syncLabel && (
            <>
              <span className="katha-editor-doc-meta__sep" aria-hidden>·</span>
              <span className={`alternate-editor__sync alternate-editor__sync--${cloudSync}`}>
                {cloudSync === 'syncing' && <Loader2 size={12} className="cms-loading__spin" aria-hidden />}
                {cloudSync === 'synced' && <Cloud size={12} aria-hidden />}
                {(cloudSync === 'local' || cloudSync === 'error') && <CloudOff size={12} aria-hidden />}
                {syncLabel}
              </span>
            </>
          )}
        </div>
      </header>

      <div className="branching-editor__split">
      <main className="branching-editor__canvas">
        <p className="branching-editor__flow-label katha-token-eyebrow">
          <StudioGlyph id="sparkles" variant="soft" size={16} />
          {t('branchingEditor.flowLabel')}
        </p>
        <BranchGraphCanvas nodes={nodes} issues={graphIssues} />
        <BranchGraphValidation nodes={nodes} />
        <BranchGraphMap nodes={nodes} />
        <div className="branching-editor__flow wc-stagger-children">
          {nodes.map((node, index) => (
            <article key={node.id} className="branching-node">
              <header className="branching-node__head">
                <span className="branching-node__index" aria-hidden>{index + 1}</span>
                <input
                  className="branching-node__title"
                  value={node.title}
                  onChange={(e) => updateNode(node.id, { title: e.target.value })}
                  aria-label={t('branchingEditor.nodeTitle')}
                />
              </header>
              <textarea
                className="branching-node__body"
                value={node.body}
                onChange={(e) => updateNode(node.id, { body: e.target.value })}
                placeholder={t('branchingEditor.nodeBodyPlaceholder')}
                rows={3}
              />
              <div className="branching-node__choices">
                <label className="branching-choice">
                  <span className="branching-choice__label">{t('branchingEditor.choiceA')}</span>
                  <input
                    className="branching-choice__input"
                    value={node.choiceA}
                    onChange={(e) => updateNode(node.id, { choiceA: e.target.value })}
                  />
                </label>
                <label className="branching-choice">
                  <span className="branching-choice__label">{t('branchingEditor.choiceB')}</span>
                  <input
                    className="branching-choice__input"
                    value={node.choiceB}
                    onChange={(e) => updateNode(node.id, { choiceB: e.target.value })}
                  />
                </label>
              </div>
              <div className="branching-node__target-row">
                <label className="branching-node__target">
                  <span className="branching-node__target-label">{t('branchingEditor.targetA')}</span>
                  <select
                    className="branching-node__target-select"
                    value={node.choiceATarget ?? ''}
                    onChange={(e) => updateNode(node.id, { choiceATarget: e.target.value || null })}
                    aria-label={t('branchingEditor.targetA')}
                  >
                    <option value="">{t('branchingEditor.targetEnd')}</option>
                    {nodes.filter((n) => n.id !== node.id).map((n) => (
                      <option key={n.id} value={n.id}>{n.title || n.id}</option>
                    ))}
                  </select>
                </label>
                <label className="branching-node__target">
                  <span className="branching-node__target-label">{t('branchingEditor.targetB')}</span>
                  <select
                    className="branching-node__target-select"
                    value={node.choiceBTarget ?? ''}
                    onChange={(e) => updateNode(node.id, { choiceBTarget: e.target.value || null })}
                    aria-label={t('branchingEditor.targetB')}
                  >
                    <option value="">{t('branchingEditor.targetEnd')}</option>
                    {nodes.filter((n) => n.id !== node.id).map((n) => (
                      <option key={n.id} value={n.id}>{n.title || n.id}</option>
                    ))}
                  </select>
                </label>
              </div>
            </article>
          ))}
        </div>
        <p className="branching-editor__hint input-hint" role="note">{t('branchingEditor.persistHint')}</p>
      </main>
      <BranchingReaderPreview chapterTitle={chapterTitle} nodes={nodes} />
      </div>
    </div>
  );
}