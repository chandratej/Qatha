import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { SceneSidebar } from '../components/Editor/SceneSidebar';
import type { SceneBlock } from '../components/Editor/SceneSidebar';
import { EditorWorkspace } from '../components/Editor/EditorWorkspace';
import { PreviewPane } from '../components/Editor/PreviewPane';
import { EditorNavbar } from '../components/Editor/EditorNavbar';
import { VersionHistoryModal } from '../components/Editor/VersionHistoryModal';
import {
  getChapterTitle,
  getOrInitDemoData,
  saveChapterScenes,
  updateChapterStats,
} from '../lib/demoStorage';
import { api } from '../lib/api';
import { aggregateScenesToHtml, scenesFromChapterPayload, scenesToContentDelta } from '../lib/sceneUtils';
import { useAutosave } from '../hooks/useAutosave';
import { useVersionHistory } from '../hooks/useVersionHistory';
import {
  loadEditorPrefs,
  saveEditorPrefs,
  type PreviewDevice,
  type PreviewTheme,
} from '../lib/editorPrefs';
import '../styles/editor-prototype.css';

function getWordCountFromScenes(scenes: SceneBlock[]): number {
  return scenes.reduce((total, scene) => {
    if (!scene.content) return total;
    const temp = document.createElement('div');
    temp.innerHTML = scene.content;
    const text = temp.textContent || '';
    return total + text.trim().split(/\s+/).filter(w => w.length > 0).length;
  }, 0);
}

const PROTOTYPE_CH1_SCENES: SceneBlock[] = [
  {
    id: 'scene-1',
    title: 'The Oppressed Village',
    content: '<p>ఒక చిన్న గిరిజన గ్రామం. అక్కడ ప్రజలు బ్రిటిష్ వారి అత్యాచారాలకు బలి అవుతున్నారు. అడవిలో నివసించే బీమ్ తన తల్లి మరియు సోదరి కోసం పోరాడుతున్నాడు.</p>',
  },
  {
    id: 'scene-2',
    title: 'The Spark of Revolt',
    content: '<p>అదే గ్రామంలో రామారాజు తన సైన్యంతో కలిసి బ్రిటిష్ వారికి వ్యతిరేకంగా పోరాటం ప్రారంభిస్తాడు. ప్రజల హృదయాల్లో విప్లవ మంట మొలకెత్తుతుంది.</p>',
  },
];

function createDefaultScene(): SceneBlock {
  return { id: `scene-${Date.now()}`, title: 'Opening Scene', content: '<p>Start writing…</p>' };
}

export function ChapterEditor() {
  const { storyId = 'demo-rrr', seasonId, chapterNum } = useParams();

  const isDemo = storyId === 'demo-rrr';
  const chapterNumber = Number(chapterNum) || 1;
  const chapterKey = `${storyId}-${chapterNumber}`;

  const prefs = loadEditorPrefs(storyId, chapterNumber);
  const [chapterTitle, setChapterTitle] = useState('Untitled Chapter');
  const [storyLabel, setStoryLabel] = useState('Story');
  const [scenes, setScenes] = useState<SceneBlock[]>([]);
  const [activeSceneId, setActiveSceneId] = useState<string>('');
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>(prefs.previewDevice);
  const [previewTheme, setPreviewTheme] = useState<PreviewTheme>(prefs.previewTheme);
  const [sceneSidebarCollapsed, setSceneSidebarCollapsed] = useState(false);
  const [phoneticLive, setPhoneticLive] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loading, setLoading] = useState(!isDemo);
  const [publishing, setPublishing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [moderationStatus, setModerationStatus] = useState<string | null>(null);
  const [moderationNotes, setModerationNotes] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [appealNote, setAppealNote] = useState('');

  const previewScrollRef = useRef<HTMLDivElement>(null);
  const editorScrollRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const scenesRef = useRef(scenes);
  const chapterTitleRef = useRef(chapterTitle);

  useEffect(() => { scenesRef.current = scenes; }, [scenes]);
  useEffect(() => { chapterTitleRef.current = chapterTitle; }, [chapterTitle]);

  const persistDraft = useCallback(() => {
    if (!storyId || !isDemo) return;
    saveChapterScenes(storyId, chapterNumber, scenes);
    updateChapterStats(storyId, chapterNumber, {
      title: chapterTitle,
      wordCount: getWordCountFromScenes(scenes),
      sceneCount: scenes.length,
    });
  }, [storyId, chapterNumber, scenes, chapterTitle, isDemo]);

  const cloudSaveDraft = useCallback(async () => {
    if (!storyId || isDemo) return;
    const currentScenes = scenesRef.current;
    const content = aggregateScenesToHtml(currentScenes);
    await api.saveDraft(storyId, {
      chapter_number: chapterNumber,
      title: chapterTitleRef.current,
      content,
      content_delta: scenesToContentDelta(currentScenes),
    });
  }, [storyId, chapterNumber, isDemo]);

  const charCount = scenes.reduce((sum, s) => sum + (s.content?.length || 0), 0);
  const { saving, lastSaved, setLastSaved } = useAutosave({
    charCount,
    triggerLocalSave: persistDraft,
    triggerCloudSave: isDemo ? undefined : cloudSaveDraft,
  });
  const { versions, saveSceneVersion } = useVersionHistory(chapterKey);

  useEffect(() => {
    let cancelled = false;

    async function loadChapter() {
      if (isDemo) {
        const demoData = getOrInitDemoData(storyId);
        let chapterScenes = demoData.chapterScenes?.[chapterNumber] || [];
        if (chapterScenes.length === 0 && chapterNumber === 1) {
          chapterScenes = PROTOTYPE_CH1_SCENES;
          saveChapterScenes(storyId, chapterNumber, chapterScenes);
        } else if (chapterScenes.length === 0) {
          chapterScenes = [createDefaultScene()];
        }
        if (!cancelled) {
          setScenes(chapterScenes);
          setActiveSceneId(chapterScenes[0].id);
          setChapterTitle(getChapterTitle(storyId, chapterNumber) || 'The Call of the Jungle');
          setStoryLabel('RRR - రాజమౌళి');
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const [{ chapter }, storyMeta] = await Promise.all([
          api.getChapter(storyId, chapterNumber),
          api.getStoryChapters(storyId).catch(() => ({ chapters: [], story: undefined })),
        ]);
        if (cancelled) return;

        const loadedScenes = scenesFromChapterPayload(chapter);
        setScenes(loadedScenes);
        setActiveSceneId(loadedScenes[0]?.id || '');
        setChapterTitle(chapter.title || `Chapter ${chapterNumber}`);
        if (storyMeta.story?.title) setStoryLabel(storyMeta.story.title);
        setModerationStatus(chapter.moderation_status || chapter.status || null);
        setModerationNotes(chapter.moderation_notes || null);
      } catch (err) {
        if (!cancelled) {
          const fallback = [createDefaultScene()];
          setScenes(fallback);
          setActiveSceneId(fallback[0].id);
          setChapterTitle(`Chapter ${chapterNumber}`);
          console.warn('Chapter load failed, starting fresh:', err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadChapter();
    return () => { cancelled = true; };
  }, [storyId, chapterNumber, isDemo]);

  const activeScene = scenes.find(s => s.id === activeSceneId);
  const activeSceneIndex = scenes.findIndex(s => s.id === activeSceneId);
  const wordCount = getWordCountFromScenes(scenes);
  const seasonLabel = isDemo
    ? (seasonId ? `Season ${seasonId.replace(/^s/, '')}` : 'Season 1')
    : 'Chapters';

  const updateSceneTitle = (id: string, newTitle: string) => {
    setScenes(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
  };

  const updateSceneContent = (id: string, html: string) => {
    setScenes(prev => {
      const next = prev.map(s => s.id === id ? { ...s, content: html } : s);
      const scene = next.find(s => s.id === id);
      if (scene) saveSceneVersion(id, scene.title, html);
      return next;
    });
  };

  const handleAddScene = () => {
    const newId = `scene-${Date.now()}`;
    setScenes(prev => [...prev, { id: newId, title: 'New Scene', content: '' }]);
    setActiveSceneId(newId);
  };

  const handleDeleteScene = (id: string) => {
    setScenes(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (activeSceneId === id && filtered.length > 0) setActiveSceneId(filtered[0].id);
      return filtered.length ? filtered : prev;
    });
  };

  const handleDuplicateScene = (id: string) => {
    const sceneToDup = scenes.find(s => s.id === id);
    if (!sceneToDup) return;
    const newId = `scene-${Date.now()}`;
    const newScene = { ...sceneToDup, id: newId, title: `${sceneToDup.title} (Copy)` };
    const idx = scenes.findIndex(s => s.id === id);
    setScenes(prev => { const next = [...prev]; next.splice(idx + 1, 0, newScene); return next; });
    setActiveSceneId(newId);
  };

  const handleRestoreVersion = (sceneId: string, content: string) => {
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, content } : s));
  };

  const needsResubmit = moderationStatus === 'needs_revision' || moderationStatus === 'rejected';

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    setPublishError(null);
    setPublishSuccess(null);
    try {
      if (isDemo) {
        persistDraft();
      } else {
        await cloudSaveDraft();
      }
      setLastSaved(new Date());
      setPublishSuccess('Draft saved');
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSavingDraft(false);
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveDraft();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSaveDraft]);

  const handlePublish = async () => {
    setPublishing(true);
    setPublishError(null);
    setPublishSuccess(null);
    try {
      const content = aggregateScenesToHtml(scenes);
      if (!content.trim()) {
        throw new Error('Add some content before publishing');
      }
      if (content.length > 50000) {
        throw new Error('Chapter exceeds 50,000 character limit');
      }

      if (!isDemo) {
        await cloudSaveDraft();
        const result = await api.publishChapter(storyId, {
          chapter_number: chapterNumber,
          title: chapterTitle,
          content,
          appeal_note: needsResubmit && appealNote.trim() ? appealNote.trim() : undefined,
        }) as { moderation?: { status?: string; note?: string } };
        setModerationStatus(result.moderation?.status || 'pending_review');
        setPublishSuccess('Submitted for moderation — typically reviewed within 1–2 hours.');
      } else {
        persistDraft();
        setPublishSuccess('Demo draft saved locally');
      }
      setLastSaved(new Date());
      if (activeScene) saveSceneVersion(activeScene.id, activeScene.title, activeScene.content);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--ink-muted)' }}>Loading chapter…</span>
      </div>
    );
  }

  return (
    <div className={`katha-proto-layout${focusMode ? ' focus-mode' : ''}`}>
      {!focusMode && (
        <EditorNavbar
          storyLabel={storyLabel}
          seasonLabel={seasonLabel}
          chapterLabel={chapterTitle || `Chapter ${chapterNumber}`}
          backTo={`/stories/${storyId}`}
          saving={saving || publishing || savingDraft}
          onHistory={() => setHistoryOpen(true)}
          onFocus={() => setFocusMode(true)}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
          publishLabel={needsResubmit ? 'Resubmit' : 'Publish'}
        />
      )}

      {!focusMode && (moderationStatus || publishSuccess) && (
        <div className="cms-callout" style={{ margin: 0, borderRadius: 0, borderLeft: 'none', borderBottom: '1px solid var(--border)' }}>
          {moderationStatus === 'pending_review' && (
            <p className="cms-callout__body"><strong>Pending review</strong> — your chapter is in the moderation queue.</p>
          )}
          {needsResubmit && (
            <>
              <p className="cms-callout__body">
                <strong>Edits requested.</strong> {moderationNotes || 'Review moderator notes, update your chapter, and resubmit.'}
              </p>
              <textarea
                className="cms-input"
                rows={2}
                placeholder="Optional note to moderator (what you changed)"
                value={appealNote}
                onChange={(e) => setAppealNote(e.target.value)}
                style={{ width: '100%', marginTop: 8, resize: 'vertical' }}
              />
            </>
          )}
          {moderationStatus === 'published' && (
            <p className="cms-callout__body"><strong>Published</strong> — this chapter is live for readers.</p>
          )}
          {publishSuccess && <p className="cms-callout__body" style={{ color: 'var(--accent-sage)' }}>{publishSuccess}</p>}
        </div>
      )}

      {publishError && !focusMode && (
        <div style={{
          padding: '8px 16px',
          background: 'var(--paper-warm)',
          borderBottom: '1px solid var(--border)',
          color: 'var(--gold-dark)',
          fontSize: '0.875rem',
        }}>
          {publishError}
        </div>
      )}

      <div className="katha-proto-workspace">
        {!focusMode && (
          <SceneSidebar
            scenes={scenes}
            activeSceneId={activeSceneId}
            onSwitchScene={setActiveSceneId}
            onAddScene={handleAddScene}
            onReorderScenes={setScenes}
            onDeleteScene={handleDeleteScene}
            onDuplicateScene={handleDuplicateScene}
            collapsed={sceneSidebarCollapsed}
            onToggleCollapse={() => setSceneSidebarCollapsed(!sceneSidebarCollapsed)}
          />
        )}

        <EditorWorkspace
          activeScene={activeScene}
          activeSceneIndex={activeSceneIndex}
          chapterNum={chapterNumber}
          chapterTitle={chapterTitle}
          onChapterTitleChange={setChapterTitle}
          chapterWordCount={wordCount}
          updateSceneTitle={updateSceneTitle}
          updateSceneContent={updateSceneContent}
          containerRef={editorContainerRef}
          scrollRef={editorScrollRef}
          phoneticLive={phoneticLive}
          onTogglePhonetic={() => setPhoneticLive(p => !p)}
          saving={saving}
          lastSaved={lastSaved}
        />

        {!focusMode && (
          <PreviewPane
            chapterTitle={chapterTitle}
            chapterNum={chapterNumber}
            scenes={scenes}
            device={previewDevice}
            theme={previewTheme}
            onThemeChange={t => { setPreviewTheme(t); saveEditorPrefs(storyId, chapterNumber, { previewTheme: t }); }}
            onDeviceChange={d => { setPreviewDevice(d); saveEditorPrefs(storyId, chapterNumber, { previewDevice: d }); }}
            scrollRef={previewScrollRef}
            editorScrollRef={editorScrollRef}
            syncScroll={prefs.syncScroll}
            totalWords={wordCount}
          />
        )}
      </div>

      {focusMode && (
        <button
          type="button"
          onClick={() => setFocusMode(false)}
          style={{
            position: 'fixed', top: 16, right: 16, zIndex: 10001,
            padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <X size={16} /> Exit Focus
        </button>
      )}

      <VersionHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        scenes={scenes}
        activeSceneId={activeSceneId}
        versions={versions}
        onRestore={handleRestoreVersion}
      />
    </div>
  );
}