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
  const [scenes, setScenes] = useState<SceneBlock[]>([]);
  const [activeSceneId, setActiveSceneId] = useState<string>('');
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>(prefs.previewDevice);
  const [previewTheme, setPreviewTheme] = useState<PreviewTheme>(prefs.previewTheme);
  const [sceneSidebarCollapsed, setSceneSidebarCollapsed] = useState(false);
  const [phoneticLive, setPhoneticLive] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const previewScrollRef = useRef<HTMLDivElement>(null);
  const editorScrollRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const persistDraft = useCallback(() => {
    if (!storyId) return;
    saveChapterScenes(storyId, chapterNumber, scenes);
    updateChapterStats(storyId, chapterNumber, {
      title: chapterTitle,
      wordCount: getWordCountFromScenes(scenes),
      sceneCount: scenes.length,
    });
  }, [storyId, chapterNumber, scenes, chapterTitle]);

  const charCount = scenes.reduce((sum, s) => sum + (s.content?.length || 0), 0);
  const { saving, lastSaved, setLastSaved } = useAutosave({ charCount, triggerLocalSave: persistDraft });
  const { versions, saveSceneVersion } = useVersionHistory(chapterKey);

  useEffect(() => {
    if (isDemo) {
      const demoData = getOrInitDemoData(storyId);
      let chapterScenes = demoData.chapterScenes?.[chapterNumber] || [];
      if (chapterScenes.length === 0 && chapterNumber === 1) {
        chapterScenes = PROTOTYPE_CH1_SCENES;
        saveChapterScenes(storyId, chapterNumber, chapterScenes);
      } else if (chapterScenes.length === 0) {
        chapterScenes = [createDefaultScene()];
      }
      setScenes(chapterScenes);
      setActiveSceneId(chapterScenes[0].id);
      setChapterTitle(getChapterTitle(storyId, chapterNumber) || 'The Call of the Jungle');
    } else {
      const defaultScenes = [createDefaultScene()];
      setScenes(defaultScenes);
      setActiveSceneId(defaultScenes[0].id);
      setChapterTitle(`Chapter ${chapterNumber}`);
    }
  }, [storyId, chapterNumber, isDemo]);

  const activeScene = scenes.find(s => s.id === activeSceneId);
  const activeSceneIndex = scenes.findIndex(s => s.id === activeSceneId);
  const wordCount = getWordCountFromScenes(scenes);
  const seasonLabel = seasonId ? `Season ${seasonId.replace(/^s/, '')}` : 'Season 1';

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

  const handleSave = () => {
    persistDraft();
    setLastSaved(new Date());
    if (activeScene) saveSceneVersion(activeScene.id, activeScene.title, activeScene.content);
  };

  return (
    <div className={`katha-proto-layout${focusMode ? ' focus-mode' : ''}`}>
      {!focusMode && (
        <EditorNavbar
          storyLabel="Story"
          seasonLabel={seasonLabel}
          chapterLabel={`Chapter ${chapterNumber}`}
          saving={saving}
          onHistory={() => setHistoryOpen(true)}
          onFocus={() => setFocusMode(true)}
          onPublish={handleSave}
        />
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