import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { PanelRightOpen, List, X } from 'lucide-react';
import { SceneSidebar } from '../components/Editor/SceneSidebar';
import type { SceneBlock } from '../components/Editor/SceneSidebar';
import { EditorWorkspace } from '../components/Editor/EditorWorkspace';
import { PreviewPane } from '../components/Editor/PreviewPane';
import { EditorNavbar } from '../components/Editor/EditorNavbar';
import { VersionHistoryModal } from '../components/Editor/VersionHistoryModal';
import { EditorStatusStrip } from '../components/Editor/EditorStatusStrip';
import { PublishConfirmModal } from '../components/Editor/PublishConfirmModal';
import { DeleteSceneModal } from '../components/Editor/DeleteSceneModal';
import { EditorLoadingSkeleton } from '../components/Editor/EditorLoadingSkeleton';
import {
  getChapterTitle,
  getOrInitDemoData,
  saveChapterScenes,
  updateChapterStats,
} from '../lib/demoStorage';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { PhoneVerificationModal } from '../components/PhoneVerificationModal';
import { aggregateScenesToHtml, scenesFromChapterPayload, scenesToContentDelta } from '../lib/sceneUtils';
import { saveDraftToCache, loadDraftFromCache } from '../lib/draftCache';
import { useAutosave } from '../hooks/useAutosave';
import { useVersionHistory } from '../hooks/useVersionHistory';
import { useWritingBreakReminder } from '../hooks/useWritingBreakReminder';
import {
  loadEditorPrefs,
  saveEditorPrefs,
  type PreviewDevice,
  type PreviewTheme,
} from '../lib/editorPrefs';
import {
  layoutForWorkspace,
  normalizeAuthoringWorkspace,
  type AuthoringWorkspace,
} from '../lib/authoringWorkspace';
import {
  loadComfortPrefs,
  saveComfortPrefs,
  editorFontSizePx,
  editorLineHeight,
  type FontScale,
  type LineHeightScale,
} from '../lib/comfortPrefs';
import { AiNotesPanel } from '../components/Editor/AiNotesPanel';
import { EditorComfortControls } from '../components/Editor/EditorComfortControls';
import { WritingBreakNotice } from '../components/Editor/WritingBreakNotice';
import '../styles/editor-prototype.css';

const CHAR_LIMIT = 50_000;

function getWordCountFromScenes(scenes: SceneBlock[]): number {
  return scenes.reduce((total, scene) => {
    if (!scene.content) return total;
    const temp = document.createElement('div');
    temp.innerHTML = scene.content;
    const text = temp.textContent || '';
    return total + text.trim().split(/\s+/).filter(w => w.length > 0).length;
  }, 0);
}

function getPlainCharCountFromScenes(scenes: SceneBlock[]): number {
  return scenes.reduce((total, scene) => {
    if (!scene.content) return total;
    const temp = document.createElement('div');
    temp.innerHTML = scene.content;
    return total + (temp.textContent || '').length;
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
  return { id: `scene-${Date.now()}`, title: 'Opening Scene', content: '<p></p>' };
}

function createBlankScene(index: number): SceneBlock {
  return { id: `scene-${Date.now()}-${index}`, title: `Scene ${index}`, content: '' };
}

export function ChapterEditor() {
  const { user, refreshUser } = useAuth();
  const { storyId = 'demo-rrr', chapterNum } = useParams();

  const isDemo = storyId === 'demo-rrr';
  const chapterNumber = Number(chapterNum) || 1;
  const chapterKey = `${storyId}-${chapterNumber}`;

  const prefs = loadEditorPrefs(storyId, chapterNumber);
  const initialWorkspaceLayout = layoutForWorkspace(prefs.authoringWorkspace);
  const initialComfort = loadComfortPrefs();
  const [fontScale, setFontScale] = useState<FontScale>(initialComfort.fontScale);
  const [lineHeightScale, setLineHeightScale] = useState<LineHeightScale>(initialComfort.lineHeightScale);
  const [breakReminderMinutes, setBreakReminderMinutes] = useState(initialComfort.breakReminderMinutes);
  const [breakNoticeOpen, setBreakNoticeOpen] = useState(false);
  const [chapterTitle, setChapterTitle] = useState('Untitled Chapter');

  const [scenes, setScenes] = useState<SceneBlock[]>([]);
  const [activeSceneId, setActiveSceneId] = useState<string>('');
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>(prefs.previewDevice);
  const [previewTheme, setPreviewTheme] = useState<PreviewTheme>(prefs.previewTheme);
  const [authoringWorkspace, setAuthoringWorkspace] = useState<AuthoringWorkspace>(
    () => normalizeAuthoringWorkspace(prefs.authoringWorkspace),
  );
  const [sceneSidebarCollapsed, setSceneSidebarCollapsed] = useState(initialWorkspaceLayout.sceneSidebarCollapsed);
  const [previewCollapsed, setPreviewCollapsed] = useState(initialWorkspaceLayout.previewCollapsed);
  const [canvasMaxWidth, setCanvasMaxWidth] = useState(initialWorkspaceLayout.canvasMaxWidth);
  const [sceneDrawerOpen, setSceneDrawerOpen] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [phoneticLive, setPhoneticLive] = useState(true);
  const [focusMode, setFocusMode] = useState(initialWorkspaceLayout.focusMode);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loading, setLoading] = useState(!isDemo);
  const [publishing, setPublishing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [moderationStatus, setModerationStatus] = useState<string | null>(null);
  const [moderationNotes, setModerationNotes] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [appealNote, setAppealNote] = useState('');
  const [phoneVerifyOpen, setPhoneVerifyOpen] = useState(false);
  const [pendingPublish, setPendingPublish] = useState(false);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [deleteSceneId, setDeleteSceneId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const previewScrollRef = useRef<HTMLDivElement>(null);
  const editorScrollRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorFlushRef = useRef<(() => void) | null>(null);
  const scenesRef = useRef(scenes);
  const chapterTitleRef = useRef(chapterTitle);
  const dirtyBaselineRef = useRef<string>('');

  const flushEditor = useCallback(() => {
    editorFlushRef.current?.();
  }, []);

  const switchScene = useCallback((id: string) => {
    flushEditor();
    setActiveSceneId(id);
  }, [flushEditor]);

  useEffect(() => { scenesRef.current = scenes; }, [scenes]);
  useEffect(() => { chapterTitleRef.current = chapterTitle; }, [chapterTitle]);

  const contentFingerprint = useMemo(
    () => JSON.stringify({ title: chapterTitle, scenes }),
    [chapterTitle, scenes],
  );

  useEffect(() => {
    if (!dirtyBaselineRef.current) return;
    setDirty(contentFingerprint !== dirtyBaselineRef.current);
  }, [contentFingerprint]);

  const markClean = useCallback(() => {
    dirtyBaselineRef.current = contentFingerprint;
    setDirty(false);
  }, [contentFingerprint]);

  const handleFontScaleChange = useCallback((scale: FontScale) => {
    setFontScale(scale);
    saveComfortPrefs({ fontScale: scale });
  }, []);

  const editorComfortStyle = {
    '--editor-font-size': `${editorFontSizePx(fontScale) / 16}rem`,
    '--editor-line-height': String(editorLineHeight(lineHeightScale)),
  } as React.CSSProperties;

  const { resetTimer, snooze } = useWritingBreakReminder({
    intervalMinutes: breakReminderMinutes,
    enabled: breakReminderMinutes > 0,
    onReminder: () => setBreakNoticeOpen(true),
  });

  useEffect(() => {
    const syncComfort = () => {
      const latest = loadComfortPrefs();
      setFontScale(latest.fontScale);
      setLineHeightScale(latest.lineHeightScale);
      setBreakReminderMinutes(latest.breakReminderMinutes);
    };
    window.addEventListener('storage', syncComfort);
    window.addEventListener('katha-comfort-prefs-updated', syncComfort);
    return () => {
      window.removeEventListener('storage', syncComfort);
      window.removeEventListener('katha-comfort-prefs-updated', syncComfort);
    };
  }, []);

  const persistDraft = useCallback(() => {
    if (!storyId) return;
    if (isDemo) {
      saveChapterScenes(storyId, chapterNumber, scenes);
      updateChapterStats(storyId, chapterNumber, {
        title: chapterTitle,
        wordCount: getWordCountFromScenes(scenes),
        sceneCount: scenes.length,
      });
      return;
    }
    saveDraftToCache({
      key: `${storyId}:${chapterNumber}`,
      story_id: storyId,
      chapter_number: chapterNumber,
      title: chapterTitle,
      scenes,
      updated_at: Date.now(),
    }).catch(() => {});
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

  const charCount = useMemo(() => getPlainCharCountFromScenes(scenes), [scenes]);
  const htmlCharCount = scenes.reduce((sum, s) => sum + (s.content?.length || 0), 0);
  const { saving, lastSaved, setLastSaved } = useAutosave({
    charCount: htmlCharCount,
    triggerLocalSave: persistDraft,
    triggerCloudSave: isDemo ? undefined : cloudSaveDraft,
  });
  const { versions, saveSceneVersion } = useVersionHistory(chapterKey);

  // Mark clean after successful autosave
  useEffect(() => {
    if (lastSaved && !saving) {
      dirtyBaselineRef.current = contentFingerprint;
      setDirty(false);
    }
  }, [lastSaved, saving]); // eslint-disable-line react-hooks/exhaustive-deps

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
          const title = getChapterTitle(storyId, chapterNumber) || 'The Call of the Jungle';
          setChapterTitle(title);
          dirtyBaselineRef.current = JSON.stringify({ title, scenes: chapterScenes });
          setDirty(false);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const { chapter } = await api.getChapter(storyId, chapterNumber);
        if (cancelled) return;

        const cached = await loadDraftFromCache(storyId, chapterNumber).catch(() => null);
        const loadedScenes = cached?.scenes?.length
          ? cached.scenes
          : scenesFromChapterPayload(chapter);
        const title = cached?.title || chapter.title || `Chapter ${chapterNumber}`;
        setScenes(loadedScenes);
        setActiveSceneId(loadedScenes[0]?.id || '');
        setChapterTitle(title);
        dirtyBaselineRef.current = JSON.stringify({ title, scenes: loadedScenes });
        setDirty(false);

        setModerationStatus(chapter.moderation_status || chapter.status || null);
        setModerationNotes(chapter.moderation_reason || null);
      } catch (err) {
        if (!cancelled) {
          const fallback = [createDefaultScene()];
          setScenes(fallback);
          setActiveSceneId(fallback[0].id);
          const title = `Chapter ${chapterNumber}`;
          setChapterTitle(title);
          dirtyBaselineRef.current = JSON.stringify({ title, scenes: fallback });
          setDirty(false);
          console.warn('Chapter load failed, starting fresh:', err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadChapter();
    return () => { cancelled = true; };
  }, [storyId, chapterNumber, isDemo]);

  // Warn on unload with unsaved changes
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const activeScene = scenes.find(s => s.id === activeSceneId);
  const activeSceneIndex = scenes.findIndex(s => s.id === activeSceneId);
  const wordCount = getWordCountFromScenes(scenes);
  const readMins = wordCount === 0 ? 0 : Math.max(1, Math.round(wordCount / 200));
  const workspaceLayout = layoutForWorkspace(authoringWorkspace);
  const overLimit = charCount > CHAR_LIMIT;
  const hasContent = wordCount > 0;

  const applyAuthoringWorkspace = useCallback((mode: AuthoringWorkspace) => {
    const layout = layoutForWorkspace(mode);
    setAuthoringWorkspace(mode);
    setSceneSidebarCollapsed(layout.sceneSidebarCollapsed);
    setPreviewCollapsed(layout.previewCollapsed);
    setFocusMode(layout.focusMode);
    setCanvasMaxWidth(layout.canvasMaxWidth);
    if (!isDemo) {
      saveEditorPrefs(storyId, chapterNumber, { authoringWorkspace: mode });
    }
  }, [storyId, chapterNumber, isDemo]);

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
    flushEditor();
    const newScene = createBlankScene(scenes.length + 1);
    setScenes(prev => [...prev, newScene]);
    setActiveSceneId(newScene.id);
  };

  const requestDeleteScene = (id: string) => {
    if (scenes.length <= 1) return;
    setDeleteSceneId(id);
  };

  const confirmDeleteScene = () => {
    if (!deleteSceneId) return;
    flushEditor();
    const id = deleteSceneId;
    setScenes(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (activeSceneId === id && filtered.length > 0) setActiveSceneId(filtered[0].id);
      return filtered.length ? filtered : prev;
    });
    setDeleteSceneId(null);
  };

  const handleDuplicateScene = (id: string) => {
    flushEditor();
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

  const navigateScene = useCallback((direction: -1 | 1) => {
    if (scenes.length < 2) return;
    const idx = scenes.findIndex(s => s.id === activeSceneId);
    if (idx < 0) return;
    const next = scenes[idx + direction];
    if (next) switchScene(next.id);
  }, [scenes, activeSceneId, switchScene]);

  const needsResubmit = moderationStatus === 'needs_revision' || moderationStatus === 'rejected';

  const handleSaveDraft = useCallback(async () => {
    setSavingDraft(true);
    setPublishError(null);
    setPublishSuccess(null);
    try {
      flushEditor();
      if (isDemo) {
        persistDraft();
      } else {
        await cloudSaveDraft();
        persistDraft();
      }
      setLastSaved(new Date());
      markClean();
      setPublishSuccess('Draft saved');
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSavingDraft(false);
    }
  }, [flushEditor, isDemo, persistDraft, cloudSaveDraft, setLastSaved, markClean]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement | null;
      const inField = target?.closest?.('input, textarea, [contenteditable="true"], .ql-editor');

      if (meta && e.key === 's') {
        e.preventDefault();
        handleSaveDraft();
        return;
      }

      if (e.key === 'Escape') {
        if (sceneDrawerOpen) {
          setSceneDrawerOpen(false);
          return;
        }
        if (mobilePreviewOpen) {
          setMobilePreviewOpen(false);
          return;
        }
        if (focusMode) {
          e.preventDefault();
          applyAuthoringWorkspace('writing');
          return;
        }
      }

      if (meta && e.key === '.') {
        e.preventDefault();
        applyAuthoringWorkspace(focusMode ? 'writing' : 'focus');
        return;
      }

      if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        if (inField && !target?.classList?.contains('ql-editor')) return;
        e.preventDefault();
        navigateScene(e.key === 'ArrowUp' ? -1 : 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSaveDraft, focusMode, applyAuthoringWorkspace, navigateScene, sceneDrawerOpen, mobilePreviewOpen]);

  // Auto-dismiss success toasts
  useEffect(() => {
    if (!publishSuccess) return;
    const t = window.setTimeout(() => setPublishSuccess(null), 4000);
    return () => window.clearTimeout(t);
  }, [publishSuccess]);

  const executePublish = async () => {
    setPublishing(true);
    setPublishError(null);
    setPublishSuccess(null);
    try {
      flushEditor();
      const content = aggregateScenesToHtml(scenes);
      if (!content.trim() || wordCount === 0) {
        throw new Error('Add some content before publishing');
      }
      if (charCount > CHAR_LIMIT) {
        throw new Error(`Chapter exceeds ${CHAR_LIMIT.toLocaleString()} character limit`);
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
      markClean();
      if (activeScene) saveSceneVersion(activeScene.id, activeScene.title, activeScene.content);
      setPublishConfirmOpen(false);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Publish failed');
      setPublishConfirmOpen(false);
    } finally {
      setPublishing(false);
      setPendingPublish(false);
    }
  };

  const handlePublish = async () => {
    if (!hasContent) {
      setPublishError('Add some content before publishing');
      return;
    }
    if (overLimit) {
      setPublishError(`Chapter exceeds ${CHAR_LIMIT.toLocaleString()} character limit`);
      return;
    }
    if (!isDemo && !user?.phone_verified) {
      setPendingPublish(true);
      setPhoneVerifyOpen(true);
      return;
    }
    setPublishConfirmOpen(true);
  };

  const handlePhoneVerified = async () => {
    await refreshUser();
    if (pendingPublish) {
      setPendingPublish(false);
      setPublishConfirmOpen(true);
    }
  };

  const deleteTarget = deleteSceneId ? scenes.find(s => s.id === deleteSceneId) : null;

  if (loading) {
    return <EditorLoadingSkeleton />;
  }

  return (
    <div className={`katha-proto-layout${focusMode ? ' focus-mode' : ''}`}>
      {!focusMode && (
        <EditorNavbar
          chapterNum={chapterNumber}
          chapterTitle={chapterTitle}
          onChapterTitleChange={setChapterTitle}
          phoneticLive={phoneticLive}
          wordCount={wordCount}
          readMins={readMins}
          charCount={charCount}
          charLimit={CHAR_LIMIT}
          backTo={`/stories/${storyId}`}
          saving={saving || publishing || savingDraft}
          lastSaved={lastSaved}
          dirty={dirty}
          fontScale={fontScale}
          onFontScaleChange={handleFontScaleChange}
          onHistory={() => setHistoryOpen(true)}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
          publishLabel={needsResubmit ? 'Resubmit' : 'Publish'}
          publishing={publishing}
          publishDisabled={!hasContent || overLimit}
          workspace={authoringWorkspace}
          onWorkspaceChange={applyAuthoringWorkspace}
        />
      )}

      {breakNoticeOpen && (
        <WritingBreakNotice
          minutesElapsed={breakReminderMinutes}
          onDismiss={() => {
            setBreakNoticeOpen(false);
            resetTimer();
          }}
          onSnooze={() => {
            setBreakNoticeOpen(false);
            snooze();
          }}
        />
      )}

      {!focusMode && moderationStatus === 'pending_review' && (
        <EditorStatusStrip
          tone="info"
          title="Pending review"
          message="Your chapter is in the moderation queue."
        />
      )}

      {!focusMode && needsResubmit && (
        <EditorStatusStrip
          tone="warning"
          title="Edits requested"
          message={moderationNotes || 'Review moderator notes, update your chapter, and resubmit.'}
        >
          <textarea
            className="cms-input katha-editor-status__appeal"
            rows={2}
            placeholder="Optional note to moderator (what you changed)"
            value={appealNote}
            onChange={(e) => setAppealNote(e.target.value)}
          />
        </EditorStatusStrip>
      )}

      {!focusMode && moderationStatus === 'published' && !publishSuccess && (
        <EditorStatusStrip
          tone="success"
          title="Published"
          message="This chapter is live for readers."
        />
      )}

      {!focusMode && publishSuccess && (
        <EditorStatusStrip
          tone="success"
          message={publishSuccess}
          onDismiss={() => setPublishSuccess(null)}
        />
      )}

      {!focusMode && publishError && (
        <EditorStatusStrip
          tone="error"
          title="Action needed"
          message={publishError}
          onDismiss={() => setPublishError(null)}
        />
      )}

      <div
        className={[
          'katha-proto-workspace',
          workspaceLayout.workspaceClass,
          previewCollapsed && 'katha-proto-workspace--preview-collapsed',
          sceneSidebarCollapsed && 'katha-proto-workspace--sidebar-collapsed',
          mobilePreviewOpen && 'katha-proto-workspace--mobile-preview-open',
        ].filter(Boolean).join(' ')}
      >
        {workspaceLayout.showSceneSidebar && sceneDrawerOpen && (
          <button
            type="button"
            className="katha-proto-scene-drawer-backdrop"
            aria-label="Close scenes panel"
            onClick={() => setSceneDrawerOpen(false)}
          />
        )}

        {workspaceLayout.showSceneSidebar && (
          <SceneSidebar
            scenes={scenes}
            activeSceneId={activeSceneId}
            onSwitchScene={(id) => { switchScene(id); setSceneDrawerOpen(false); }}
            onAddScene={handleAddScene}
            onReorderScenes={setScenes}
            onDeleteScene={requestDeleteScene}
            onDuplicateScene={handleDuplicateScene}
            collapsed={sceneSidebarCollapsed}
            onToggleCollapse={() => setSceneSidebarCollapsed(!sceneSidebarCollapsed)}
            drawerMode={sceneDrawerOpen}
            onCloseDrawer={() => setSceneDrawerOpen(false)}
            phoneticLive={phoneticLive}
            storyId={storyId}
            chapterNum={chapterNumber}
            sceneSearchInputMode={prefs.sceneSearchInputMode}
          />
        )}

        <EditorWorkspace
          activeScene={activeScene}
          activeSceneIndex={activeSceneIndex}
          sceneCount={scenes.length}
          chapterNum={chapterNumber}
          chapterTitle={chapterTitle}
          updateSceneTitle={updateSceneTitle}
          updateSceneContent={updateSceneContent}
          onPrevScene={() => navigateScene(-1)}
          onNextScene={() => navigateScene(1)}
          containerRef={editorContainerRef}
          scrollRef={editorScrollRef}
          flushRef={editorFlushRef}
          phoneticLive={phoneticLive}
          onTogglePhonetic={() => setPhoneticLive(p => !p)}
          editorComfortStyle={editorComfortStyle}
          focusMode={focusMode}
          canvasMaxWidth={canvasMaxWidth}
          toolbarMinimal={workspaceLayout.toolbarMinimal}
        />

        {!focusMode && !previewCollapsed && (
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
            syncScroll={workspaceLayout.syncScroll || prefs.syncScroll}
            totalWords={wordCount}
            previewComfortStyle={editorComfortStyle}
            onCollapse={() => setPreviewCollapsed(true)}
            mobileOpen={mobilePreviewOpen}
            onCloseMobile={() => setMobilePreviewOpen(false)}
          />
        )}

        {!focusMode && workspaceLayout.showAiNotes && (
          <AiNotesPanel storyId={storyId} chapterNum={chapterNumber} />
        )}
      </div>

      {!focusMode && previewCollapsed && (
        <button
          type="button"
          className="katha-proto-preview-reopen"
          onClick={() => setPreviewCollapsed(false)}
          title="Show preview"
          aria-label="Show preview panel"
        >
          <PanelRightOpen size={18} />
        </button>
      )}

      {!focusMode && (
        <>
          {workspaceLayout.showSceneSidebar && (
            <button
              type="button"
              className="katha-proto-scene-drawer-toggle"
              onClick={() => { setSceneDrawerOpen(true); setMobilePreviewOpen(false); }}
              title="Scenes"
              aria-label="Open scenes"
            >
              <List size={18} />
            </button>
          )}
          <button
            type="button"
            className="katha-proto-preview-drawer-toggle"
            onClick={() => {
              setMobilePreviewOpen(true);
              setPreviewCollapsed(false);
              setSceneDrawerOpen(false);
            }}
            title="Reader preview"
            aria-label="Open reader preview"
          >
            <PanelRightOpen size={18} />
          </button>
        </>
      )}

      {focusMode && (
        <div className="katha-proto-focus-controls">
          <EditorComfortControls fontScale={fontScale} onFontScaleChange={handleFontScaleChange} compact />
          <SaveChip saving={saving || savingDraft} lastSaved={lastSaved} dirty={dirty} />
          <button
            type="button"
            className="katha-proto-focus-controls__exit"
            onClick={() => applyAuthoringWorkspace('writing')}
            title="Exit focus (Esc)"
          >
            <X size={16} /> Exit focus
          </button>
        </div>
      )}

      <PhoneVerificationModal
        open={phoneVerifyOpen}
        onClose={() => { setPhoneVerifyOpen(false); setPendingPublish(false); }}
        onVerified={handlePhoneVerified}
        title="Verify to publish"
        description="Before your chapter goes live, verify your WhatsApp number for payouts and KYC. We send a 6-digit code on WhatsApp."
      />

      <PublishConfirmModal
        open={publishConfirmOpen}
        onClose={() => setPublishConfirmOpen(false)}
        onConfirm={executePublish}
        chapterTitle={chapterTitle}
        chapterNum={chapterNumber}
        wordCount={wordCount}
        sceneCount={scenes.length}
        isResubmit={needsResubmit}
        publishing={publishing}
      />

      <DeleteSceneModal
        open={Boolean(deleteSceneId)}
        sceneTitle={deleteTarget?.title || 'Untitled scene'}
        onClose={() => setDeleteSceneId(null)}
        onConfirm={confirmDeleteScene}
      />

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

function SaveChip({
  saving,
  lastSaved,
  dirty,
}: {
  saving: boolean;
  lastSaved: Date | null;
  dirty: boolean;
}) {
  if (saving) {
    return <span className="katha-proto-focus-save">Saving…</span>;
  }
  if (dirty) {
    return <span className="katha-proto-focus-save katha-proto-focus-save--dirty">Unsaved</span>;
  }
  if (lastSaved) {
    return <span className="katha-proto-focus-save">Saved</span>;
  }
  return null;
}
