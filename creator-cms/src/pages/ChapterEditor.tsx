/* @refresh reset */
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PanelRightOpen, List, X } from 'lucide-react';
import { SceneSidebar } from '../components/Editor/SceneSidebar';
import type { SceneBlock } from '../components/Editor/SceneSidebar';
import { EditorWorkspace } from '../components/Editor/EditorWorkspace';
import { PreviewPane } from '../components/Editor/PreviewPane';
import { EditorNavbar } from '../components/Editor/EditorNavbar';
import { VersionHistoryPanel } from '../versioning/components/VersionHistoryPanel';
import { buildChapterContent, createVersion } from '../versioning/versionClient';
import type { VersionContent } from '../versioning/types';
import { EditorStatusStrip } from '../components/Editor/EditorStatusStrip';
import { PublishConfirmModal } from '../components/Editor/PublishConfirmModal';
import {
  WordBandBlockModal,
  showWordBandBlockedAlert,
  type WordBandBlockReason,
} from '../components/Editor/WordBandBlockModal';
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
import {
  fingerprintDraft,
  resolveDraftConflict,
  sceneContentEmpty,
  type DraftConflictChoice,
} from '../lib/draftConflict';
import { DraftConflictModal } from '../components/Editor/DraftConflictModal';
import { ShareModal } from '../components/studio/ShareModal';
import type { StoryData, ChapterListItem } from '../types/database';
import { buildChapterShareUrl, resolveStorySlug } from '../lib/shareLinks';
import { buildShareMessage, shareViaWhatsApp } from '../lib/socialShare';
import { enqueuePublishJob, isLikelyOfflineError } from '../lib/publishQueue';
import { backupSceneVersionCloud } from '../lib/cloudVersions';
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
  expandPreviewPanels,
  expandSceneSidebarPanels,
  layoutForWorkspace,
  normalizeAuthoringWorkspace,
  reconcileSidePanels,
  toggleSceneSidebarPanels,
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
import { manuscriptScriptFromLocale } from '../lib/manuscriptTypography';
import { AiNotesPanel } from '../components/Editor/AiNotesPanel';
import { ChapterFindBar } from '../components/Editor/ChapterFindBar';
import { EditorCommandPalette, buildEditorCommands } from '../components/Editor/EditorCommandPalette';
import {
  findInChapter,
  replaceAllInChapter,
  replaceInSceneContent,
  replaceInSceneTitle,
  type ChapterFindMatch,
} from '../lib/chapterFind';
import { EditorComfortControls } from '../components/Editor/EditorComfortControls';
import { WritingBreakNotice } from '../components/Editor/WritingBreakNotice';
import { SceneCharacterPanel } from '../components/Editor/SceneCharacterPanel';
import { suggestNewCharacters } from '../lib/characterDetection';
import { AuthorNotesPanel } from '../components/Editor/AuthorNotesPanel';
import type { StoryCharacter, SceneCharacterLink } from '../../../packages/shared/storyBible';
import type { StoryAuthorComment } from '../../../packages/shared/collaboration';
import type { EditorSelectionAnchor } from '../lib/editorAnchor';
import { InkProgress } from '../components/studio/InkProgress';
import { useLocale } from '../context/LocaleContext';
import { NarrativeChapterWorkspace } from '../components/narrative-os/NarrativeChapterWorkspace';
import type { ArrivalMomentum, NarrativeFormat } from '../lib/narrativeOsTypes';
import '../styles/narrative-os.css';
import { countWordsInScenes } from '../lib/wordCount';

import { FEATURE_FLAGS } from '../config/feature_flags';
import { UI_CONFIG } from '../config/ui_config';
import {
  looksLikeBranchingJson,
  looksLikeEpistolaryJson,
  narrativeFormatFromContentType,
  resolveChapterEditorPath,
} from '../lib/storyContentFormat';
import { stripHtml } from '../lib/chapterFind';
import { softWordTargetForContentType } from '../../../packages/shared/content-types';

const NARRATIVE_OS_ENABLED = FEATURE_FLAGS.narrativeOs;

/**
 * Soft reference upper band for Serialized Story (1,500–2,500 soft · 3,000 hard).
 * InkProgress uses soft max as the visual goal.
 */
const CHAPTER_WORD_GOAL = UI_CONFIG.editor.chapterWordGoal;

/** Character ceiling removed — use serialized word band only. */
const CHAR_LIMIT = Number.MAX_SAFE_INTEGER;

function getWordCountFromScenes(scenes: SceneBlock[], locale = 'en'): number {
  return countWordsInScenes(scenes, locale);
}

function getPlainCharCountFromScenes(scenes: SceneBlock[]): number {
  return scenes.reduce((total, scene) => {
    if (!scene.content) return total;
    const temp = document.createElement('div');
    temp.innerHTML = scene.content;
    return total + (temp.textContent || '').length;
  }, 0);
}

/** Original demo fiction only — no real film/character IP */
const PROTOTYPE_CH1_SCENES: SceneBlock[] = [
  {
    id: 'scene-1',
    title: 'Drums Beyond the Ridge',
    content: '<p>గ్రామం మేఘాలతో గాయపడిన ఆకాశం కింద నిద్రపోయింది. కొండ వెనుక ఎక్కడో డ్రమ్ములు మోగాయి — ఉత్సవం కాదు, హెచ్చరిక. ఆమె తలుపు చట్రంపై చేతులు అదిమి, పాత టేకు మొక్క యొక్క గీతలను అనుభవించింది.</p>',
  },
  {
    id: 'scene-2',
    title: 'The Unspoken Past',
    content: '<p>"నన్ను మరచిపోమని అడగవద్దు," అతను గొంతు పెంచకుండా అన్నాడు. "జ్ఞాపకం మాకు ఇచ్చిన ఏకైక ఆయుధం." లేఖ ముద్ర లేకుండా వచ్చింది — రాసినవారు విస్మరించబడటం కంటే గుర్తించబడటానికి భయపడ్డారు.</p>',
  },
];

function createDefaultScene(): SceneBlock {
  return { id: `scene-${Date.now()}`, title: 'Opening Scene', content: '<p></p>' };
}

function createBlankScene(index: number): SceneBlock {
  return { id: `scene-${Date.now()}-${index}`, title: `Scene ${index}`, content: '' };
}

export function ChapterEditor() {
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { storyId = 'demo-valley-te', chapterNum } = useParams();

  const isDemo = storyId === 'demo-valley-te' || storyId === 'demo-valley-en';
  const chapterNumber = Number(chapterNum) || 1;
  const chapterKey = `${storyId}-${chapterNumber}`;

  const prefs = loadEditorPrefs(storyId, chapterNumber);
  const initialWorkspaceLayout = layoutForWorkspace(prefs.authoringWorkspace);
  const initialSidePanels = reconcileSidePanels(
    {
      sceneSidebarCollapsed: initialWorkspaceLayout.sceneSidebarCollapsed,
      previewCollapsed: initialWorkspaceLayout.previewCollapsed,
    },
    initialWorkspaceLayout.showSceneSidebar,
    initialWorkspaceLayout.showPreview,
  );
  const initialComfort = loadComfortPrefs();
  const [fontScale, setFontScale] = useState<FontScale>(initialComfort.fontScale);
  const [lineHeightScale, setLineHeightScale] = useState<LineHeightScale>(initialComfort.lineHeightScale);
  const [breakReminderMinutes, setBreakReminderMinutes] = useState(initialComfort.breakReminderMinutes);
  const [breakNoticeOpen, setBreakNoticeOpen] = useState(false);
  const [chapterTitle, setChapterTitle] = useState('Untitled Chapter');
  const [storyDisplayTitle, setStoryDisplayTitle] = useState('Your Story');

  const [scenes, setScenes] = useState<SceneBlock[]>([]);
  const [activeSceneId, setActiveSceneId] = useState<string>('');
  const [storyCharacters, setStoryCharacters] = useState<StoryCharacter[]>([]);
  const [sceneCharacterLinks, setSceneCharacterLinks] = useState<SceneCharacterLink[]>([]);
  const [sceneCharactersLoading, setSceneCharactersLoading] = useState(false);
  const [sceneCharacterBusy, setSceneCharacterBusy] = useState(false);
  const [addingCharacterName, setAddingCharacterName] = useState<string | null>(null);
  const [authorComments, setAuthorComments] = useState<StoryAuthorComment[]>([]);
  const [activeAuthorCommentId, setActiveAuthorCommentId] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>(prefs.previewDevice);
  const [previewTheme, setPreviewTheme] = useState<PreviewTheme>(prefs.previewTheme);
  const [authoringWorkspace, setAuthoringWorkspace] = useState<AuthoringWorkspace>(
    () => normalizeAuthoringWorkspace(prefs.authoringWorkspace),
  );
  const [sceneSidebarCollapsed, setSceneSidebarCollapsed] = useState(initialSidePanels.sceneSidebarCollapsed);
  const [previewCollapsed, setPreviewCollapsed] = useState(initialSidePanels.previewCollapsed);
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
  const [chapterStatus, setChapterStatus] = useState<string | null>(null);
  const isChapterImmutable = chapterStatus === 'published';
  const [chapterNarrativeFormat, setChapterNarrativeFormat] = useState<NarrativeFormat>('novel');
  const [moderationStatus, setModerationStatus] = useState<string | null>(null);
  const [moderationNotes, setModerationNotes] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [appealNote, setAppealNote] = useState('');
  const [phoneVerifyOpen, setPhoneVerifyOpen] = useState(false);
  const [pendingPublish, setPendingPublish] = useState(false);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [wordBandBlockOpen, setWordBandBlockOpen] = useState(false);
  const [wordBandBlockReason, setWordBandBlockReason] = useState<WordBandBlockReason>('below_min');
  const [scheduling, setScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);
  const [chapterOptions, setChapterOptions] = useState<Array<{ chapterNumber: number; title: string }>>([]);
  const [storyContentType, setStoryContentType] = useState<string | null>(null);
  const [storyLanguage, setStoryLanguage] = useState<string | null>(null);
  const [deleteSceneId, setDeleteSceneId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [findReplace, setFindReplace] = useState('');
  const [findShowReplace, setFindShowReplace] = useState(false);
  const [findMatchIndex, setFindMatchIndex] = useState(0);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [aiCompanionOpen, setAiCompanionOpen] = useState(false);
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const [slashCmdOpen, setSlashCmdOpen] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const [cmdAnchor, setCmdAnchor] = useState<{ top: number; left: number } | null>(null);

  const formatActionRef = useRef<{
    bold: () => void;
    italic: () => void;
    insertDialogue: () => void;
    insertNote: () => void;
    insertSceneBreak: () => void;
    clearSlashTrigger: () => void;
  } | null>(null);
  const [draftConflictOpen, setDraftConflictOpen] = useState(false);
  const [draftConflictPrefer, setDraftConflictPrefer] = useState<DraftConflictChoice>('local');
  const [shareOpen, setShareOpen] = useState(false);
  const [shareStory, setShareStory] = useState<StoryData | null>(null);
  const [shareChapters, setShareChapters] = useState<ChapterListItem[]>([]);
  const [pendingLocalDraft, setPendingLocalDraft] = useState<{
    title: string;
    scenes: SceneBlock[];
    updatedAt: number;
  } | null>(null);
  const [pendingCloudDraft, setPendingCloudDraft] = useState<{
    title: string;
    scenes: SceneBlock[];
    updatedAt: number | null;
  } | null>(null);

  const previewScrollRef = useRef<HTMLDivElement>(null);
  const editorScrollRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorFlushRef = useRef<(() => void) | null>(null);
  const editorSelectionCaptureRef = useRef<(() => EditorSelectionAnchor | null) | null>(null);
  const highlightAuthorNoteRef = useRef<((comment: StoryAuthorComment) => void) | null>(null);
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
    '--editor-line-height': String(
      editorLineHeight(lineHeightScale, manuscriptScriptFromLocale(locale)),
    ),
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
    if (!storyId || isChapterImmutable) return;
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
  }, [storyId, chapterNumber, scenes, chapterTitle, isDemo, isChapterImmutable]);

  const cloudSaveDraft = useCallback(async () => {
    if (!storyId || isDemo || isChapterImmutable) return;
    const currentScenes = scenesRef.current;
    const content = aggregateScenesToHtml(currentScenes);
    await api.saveDraft(storyId, {
      chapter_number: chapterNumber,
      title: chapterTitleRef.current,
      content,
      content_delta: scenesToContentDelta(currentScenes),
    });
  }, [storyId, chapterNumber, isDemo, isChapterImmutable]);

  const charCount = useMemo(() => getPlainCharCountFromScenes(scenes), [scenes]);
  const htmlCharCount = scenes.reduce((sum, s) => sum + (s.content?.length || 0), 0);
  const { saving, lastSaved, setLastSaved } = useAutosave({
    charCount: htmlCharCount,
    triggerLocalSave: persistDraft,
    triggerCloudSave: isDemo ? undefined : cloudSaveDraft,
    enabled: !isChapterImmutable,
  });
  const { saveSceneVersion } = useVersionHistory(chapterKey);

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
        setStoryDisplayTitle(
          storyId === 'demo-valley-en'
            ? 'Before the Monsoon'
            : (storyId === 'demo-valley-te')
              ? 'వర్షం వచ్చే ముందు'
              : 'Your Story',
        );
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
          try {
            const demo = getOrInitDemoData(storyId);
            const opts: Array<{ chapterNumber: number; title: string }> = [];
            for (const season of demo.seasons ?? []) {
              for (const num of season.chapterNums ?? []) {
                opts.push({
                  chapterNumber: num,
                  title: getChapterTitle(storyId, num) || `Chapter ${num}`,
                });
              }
            }
            if (opts.length === 0) {
              opts.push({ chapterNumber, title });
            }
            setChapterOptions(opts);
          } catch {
            setChapterOptions([{ chapterNumber, title }]);
          }
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const [{ chapter }, chaptersMeta, storiesRes] = await Promise.all([
          api.getChapter(storyId, chapterNumber),
          api.getStoryChapters(storyId).catch(() => ({ story: undefined as { title?: string } | undefined, chapters: [] as Array<{ chapter_number: number; title?: string }> })),
          api.getCreatorStories().catch(() => ({ stories: [] as Array<{ id: string; content_type?: string; language?: string; title?: string }> })),
        ]);
        if (chaptersMeta.story?.title) setStoryDisplayTitle(chaptersMeta.story.title);
        const storyRow = (storiesRes.stories ?? []).find((s) => s.id === storyId);
        const contentType = storyRow?.content_type || null;
        const language = storyRow?.language || null;
        if (storyRow?.title && !chaptersMeta.story?.title) setStoryDisplayTitle(storyRow.title);
        setStoryContentType(contentType);
        setStoryLanguage(language);

        // MVP1: specialized formats open in dedicated editors — never show raw JSON in prose canvas
        if (contentType === 'interactive_branching' || contentType === 'epistolary_chat') {
          const target = resolveChapterEditorPath(storyId, chapterNumber, { contentType, language });
          if (!cancelled) navigate(target, { replace: true });
          return;
        }

        // Also redirect if chapter payload is clearly branching/epistolary JSON
        const probe = chapter.content || chapter.content_delta?.scenes?.[0]?.content || '';
        const plainProbe = stripHtml(probe).trim();
        if (looksLikeBranchingJson(plainProbe) || looksLikeBranchingJson(probe)) {
          if (!cancelled) navigate(resolveChapterEditorPath(storyId, chapterNumber, { contentType: 'interactive_branching' }), { replace: true });
          return;
        }
        if (looksLikeEpistolaryJson(plainProbe) || looksLikeEpistolaryJson(probe)) {
          if (!cancelled) navigate(resolveChapterEditorPath(storyId, chapterNumber, { contentType: 'epistolary_chat' }), { replace: true });
          return;
        }

        // Lock chapter canvas to story content format
        setChapterNarrativeFormat(narrativeFormatFromContentType(contentType));

        const chList = (chaptersMeta.chapters ?? []).map((ch) => ({
          chapterNumber: ch.chapter_number,
          title: ch.title || `Chapter ${ch.chapter_number}`,
        }));
        if (chList.length > 0) setChapterOptions(chList);
        else setChapterOptions([{ chapterNumber, title: chapter.title || `Chapter ${chapterNumber}` }]);
        if (cancelled) return;

        const cached = await loadDraftFromCache(storyId, chapterNumber).catch(() => null);
        const cloudScenes = scenesFromChapterPayload(chapter).map((s) => ({
          ...s,
          narrativeFormat: narrativeFormatFromContentType(contentType),
        }));
        const cloudTitle = chapter.title || `Chapter ${chapterNumber}`;
        const cloudUpdatedRaw = chapter.last_saved_at || chapter.updated_at || null;
        const cloudUpdatedAt = cloudUpdatedRaw ? Date.parse(cloudUpdatedRaw) || null : null;

        const applyDraft = (title: string, loadedScenes: SceneBlock[], markDirty: boolean) => {
          setScenes(loadedScenes);
          setActiveSceneId(loadedScenes[0]?.id || '');
          setChapterTitle(title);
          dirtyBaselineRef.current = JSON.stringify({ title, scenes: loadedScenes });
          setDirty(markDirty);
        };

        if (cached?.scenes?.length) {
          const decision = resolveDraftConflict(
            {
              updatedAt: cached.updated_at ?? null,
              fingerprint: fingerprintDraft(cached.title, cached.scenes),
              hasContent: !sceneContentEmpty(cached.scenes),
            },
            {
              updatedAt: cloudUpdatedAt,
              fingerprint: fingerprintDraft(cloudTitle, cloudScenes),
              hasContent: !sceneContentEmpty(cloudScenes),
            },
          );

          if (decision.hasConflict) {
            setPendingLocalDraft({
              title: cached.title,
              scenes: cached.scenes,
              updatedAt: cached.updated_at,
            });
            setPendingCloudDraft({
              title: cloudTitle,
              scenes: cloudScenes,
              updatedAt: cloudUpdatedAt,
            });
            setDraftConflictPrefer(decision.prefer);
            setDraftConflictOpen(true);
            // Load preferred side while modal is open so editor is never blank
            if (decision.prefer === 'local') {
              applyDraft(cached.title, cached.scenes, true);
            } else {
              applyDraft(cloudTitle, cloudScenes, false);
            }
          } else if (decision.prefer === 'local') {
            applyDraft(cached.title, cached.scenes, true);
          } else {
            applyDraft(cloudTitle, cloudScenes.length ? cloudScenes : cached.scenes, false);
          }
        } else {
          applyDraft(cloudTitle, cloudScenes.length ? cloudScenes : [createDefaultScene()], false);
        }

        setChapterStatus(chapter.status || null);
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
  }, [storyId, chapterNumber, isDemo, navigate]);

  useEffect(() => {
    if (!storyId || isDemo) return;
    let cancelled = false;
    setSceneCharactersLoading(true);
    Promise.all([
      api.getStoryCharacters(storyId),
      api.getSceneCharacterLinks(storyId, chapterNumber),
      api.getAuthorComments(storyId, chapterNumber),
    ])
      .then(([chars, links, comments]) => {
        if (cancelled) return;
        setStoryCharacters(chars.characters);
        setSceneCharacterLinks(links.links);
        setAuthorComments(comments.comments);
      })
      .catch(() => {
        if (!cancelled) {
          setStoryCharacters([]);
          setSceneCharacterLinks([]);
          setAuthorComments([]);
        }
      })
      .finally(() => {
        if (!cancelled) setSceneCharactersLoading(false);
      });
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

  useEffect(() => {
    if (!scenes.length) return;
    if (!scenes.some((s) => s.id === activeSceneId)) {
      setActiveSceneId(scenes[0].id);
    }
  }, [scenes, activeSceneId]);
  const narrativeFormat: NarrativeFormat = chapterNarrativeFormat;
  const wordCount = getWordCountFromScenes(scenes, locale);
  /**
   * Serialized: soft 1,500–2,500 · hard max 3,000 words.
   * Always resolve a concrete band for serials (hardcoded fallback if shared def missing).
   * Exempt: short_story, flash, collection, chat, branching.
   */
  /**
   * Always enforce the serial word band for normal stories.
   * Only skip for explicit short/flash/collection/experimental formats.
   * Hardcoded fallback so a bad content_type import can never disable the UI gate.
   */
  const softWordTarget = useMemo(() => {
    const ct = (storyContentType || 'serialized_story').trim();
    const exempt = new Set([
      'short_story',
      'flash_fiction',
      'short_story_collection',
      'epistolary_chat',
      'interactive_branching',
    ]);
    if (exempt.has(ct)) return null;
    const FALLBACK = { min: 1500, max: 2500, hardMax: 3000 as number | null };
    try {
      return softWordTargetForContentType(ct)
        || softWordTargetForContentType('serialized_story')
        || FALLBACK;
    } catch {
      return FALLBACK;
    }
  }, [storyContentType]);
  const softWordGoal = softWordTarget?.max ?? CHAPTER_WORD_GOAL;


  useEffect(() => {
    const fromScene = scenes.find((s) => s.narrativeFormat)?.narrativeFormat;
    if (fromScene) setChapterNarrativeFormat(fromScene);
  }, [scenes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const arrivalMomentum: ArrivalMomentum | null = useMemo(() => {
    if (!chapterTitle && !activeScene?.title) return null;
    const goal = softWordTarget?.max ?? CHAPTER_WORD_GOAL;
    return {
      storyTitle: storyDisplayTitle || chapterTitle || 'Untitled Chapter',
      lastSceneTitle: activeScene?.title || undefined,
      progressPercent: wordCount > 0 ? Math.min(100, Math.round((wordCount / goal) * 100)) : undefined,
    };
  }, [storyDisplayTitle, chapterTitle, activeScene?.title, wordCount, softWordTarget]);

  /** MVP1: format is fixed at story creation — ignore in-editor format changes. */
  const handleNarrativeFormatChange = useCallback((_format: NarrativeFormat) => {
    /* no-op: format locked */
  }, []);

  const handleUpdateBeatName = useCallback((sceneId: string, beatName: string) => {
    if (isChapterImmutable) return;
    setScenes((prev) => prev.map((s) =>
      s.id === sceneId ? { ...s, beatName } : s,
    ));
    setDirty(true);
  }, [isChapterImmutable]);

  const activeSceneLinkedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const link of sceneCharacterLinks) {
      if (link.scene_id === activeSceneId) ids.add(link.character_id);
    }
    return ids;
  }, [sceneCharacterLinks, activeSceneId]);

  const toggleSceneCharacter = useCallback(async (characterId: string) => {
    if (!storyId || isDemo || !activeSceneId || sceneCharacterBusy) return;
    const next = new Set(activeSceneLinkedIds);
    if (next.has(characterId)) next.delete(characterId);
    else next.add(characterId);
    const characterIds = [...next];
    setSceneCharacterBusy(true);
    try {
      await api.setSceneCharacters(storyId, chapterNumber, activeSceneId, characterIds);
      setSceneCharacterLinks((prev) => {
        const filtered = prev.filter((l) => l.scene_id !== activeSceneId);
        const added = characterIds.map((id) => ({
          id: `local-${activeSceneId}-${id}`,
          story_id: storyId,
          chapter_number: chapterNumber,
          scene_id: activeSceneId,
          character_id: id,
        }));
        return [...filtered, ...added];
      });
    } catch (err) {
      console.warn('Scene character link failed:', err);
    } finally {
      setSceneCharacterBusy(false);
    }
  }, [storyId, isDemo, activeSceneId, sceneCharacterBusy, activeSceneLinkedIds, chapterNumber]);

  const characterSuggestions = useMemo(() => {
    const draft = scenes.map((s) => `${s.title || ''} ${s.content || ''}`).join('\n');
    return suggestNewCharacters(draft, storyCharacters.map((c) => c.name), 4);
  }, [scenes, storyCharacters]);

  const handleQuickAddCharacter = useCallback(async (name: string) => {
    if (!storyId || isDemo || addingCharacterName) return;
    setAddingCharacterName(name);
    try {
      const { character } = await api.createStoryCharacter(storyId, { name: name.trim() });
      setStoryCharacters((prev) => [...prev, character]);
    } catch (err) {
      console.warn('Quick-add character failed:', err);
    } finally {
      setAddingCharacterName(null);
    }
  }, [storyId, isDemo, addingCharacterName]);

  const readMins = wordCount === 0 ? 0 : Math.max(1, Math.round(wordCount / 200));
  const workspaceLayout = layoutForWorkspace(authoringWorkspace);
  /** Character ceiling removed — only word band blocks publish for serials. */
  const overLimit = false;
  const hasContent = wordCount > 0;

  const findMatches = useMemo(
    () => findInChapter(scenes, findQuery),
    [scenes, findQuery],
  );
  const findActiveMatch = findMatches[findMatchIndex] ?? null;

  const applySidePanels = useCallback((next: { sceneSidebarCollapsed: boolean; previewCollapsed: boolean }) => {
    const reconciled = reconcileSidePanels(next, workspaceLayout.showSceneSidebar, workspaceLayout.showPreview);
    setSceneSidebarCollapsed(reconciled.sceneSidebarCollapsed);
    setPreviewCollapsed(reconciled.previewCollapsed);
  }, [workspaceLayout.showSceneSidebar, workspaceLayout.showPreview]);

  const toggleSceneSidebar = useCallback(() => {
    applySidePanels(toggleSceneSidebarPanels(sceneSidebarCollapsed, previewCollapsed));
  }, [applySidePanels, sceneSidebarCollapsed, previewCollapsed]);

  const openPreview = useCallback(() => {
    if (!workspaceLayout.showPreview) return;
    applySidePanels(expandPreviewPanels());
    setSceneDrawerOpen(false);
  }, [applySidePanels, workspaceLayout.showPreview]);

  const closePreview = useCallback(() => {
    setPreviewCollapsed(true);
    setMobilePreviewOpen(false);
  }, []);

  const openSceneDrawer = useCallback(() => {
    applySidePanels(expandSceneSidebarPanels());
    setSceneDrawerOpen(true);
    setMobilePreviewOpen(false);
  }, [applySidePanels]);

  const applyAuthoringWorkspace = useCallback((mode: AuthoringWorkspace) => {
    const layout = layoutForWorkspace(mode);
    setAuthoringWorkspace(mode);
    const panels = reconcileSidePanels(
      { sceneSidebarCollapsed: layout.sceneSidebarCollapsed, previewCollapsed: layout.previewCollapsed },
      layout.showSceneSidebar,
      layout.showPreview,
    );
    setSceneSidebarCollapsed(panels.sceneSidebarCollapsed);
    setPreviewCollapsed(panels.previewCollapsed);
    setFocusMode(layout.focusMode);
    setCanvasMaxWidth(layout.canvasMaxWidth);
    setSceneDrawerOpen(false);
    setMobilePreviewOpen(false);
    if (!isDemo) {
      saveEditorPrefs(storyId, chapterNumber, { authoringWorkspace: mode });
    }
  }, [storyId, chapterNumber, isDemo]);

  const updateSceneTitle = (id: string, newTitle: string) => {
    if (isChapterImmutable) return;
    setScenes(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
  };

  const updateSceneContent = (id: string, html: string) => {
    if (isChapterImmutable) return;
    setScenes(prev => {
      const next = prev.map(s => s.id === id ? { ...s, content: html } : s);
      const scene = next.find(s => s.id === id);
      if (scene) {
        void saveSceneVersion(id, scene.title, html);
        // Cycle 7 — throttled cloud version backup (IndexedDB remains primary offline)
        if (!isDemo) {
          void backupSceneVersionCloud({
            storyId,
            chapterNumber,
            sceneId: id,
            sceneTitle: scene.title,
            content: html,
            source: 'autosave',
          });
        }
      }
      return next;
    });
  };

  const handleAddScene = () => {
    if (isChapterImmutable) return;
    flushEditor();
    const newScene = createBlankScene(scenes.length + 1);
    setScenes(prev => [...prev, newScene]);
    setActiveSceneId(newScene.id);
  };

  const requestDeleteScene = (id: string) => {
    if (isChapterImmutable || scenes.length <= 1) return;
    setDeleteSceneId(id);
  };

  const confirmDeleteScene = () => {
    if (isChapterImmutable || !deleteSceneId) return;
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
    if (isChapterImmutable) return;
    flushEditor();
    const sceneToDup = scenes.find(s => s.id === id);
    if (!sceneToDup) return;
    const newId = `scene-${Date.now()}`;
    const newScene = { ...sceneToDup, id: newId, title: `${sceneToDup.title} (Copy)` };
    const idx = scenes.findIndex(s => s.id === id);
    setScenes(prev => { const next = [...prev]; next.splice(idx + 1, 0, newScene); return next; });
    setActiveSceneId(newId);
  };

  /** Restore from Story Versioning System — applies full chapter snapshot, history preserved. */
  const handleRestoreVersionSnapshot = useCallback((content: VersionContent) => {
    if (isChapterImmutable) return;
    if (content.title) setChapterTitle(content.title);
    if (content.scenes?.length) {
      const next = content.scenes.map((s) => ({
        id: s.id,
        title: s.title,
        content: s.content,
        narrativeFormat: (s.narrativeFormat as NarrativeFormat | undefined) || chapterNarrativeFormat,
      }));
      setScenes(next);
      setActiveSceneId(next[0]?.id || '');
      setDirty(true);
      setPublishSuccess(locale === 'te' ? 'వెర్షన్ పునరుద్ధరించబడింది' : 'Version restored');
      return;
    }
    if (content.plainContent && activeSceneId) {
      setScenes((prev) => prev.map((s) => (s.id === activeSceneId ? { ...s, content: content.plainContent! } : s)));
      setDirty(true);
    }
  }, [isChapterImmutable, chapterNarrativeFormat, activeSceneId, locale]);

  const navigateScene = useCallback((direction: -1 | 1) => {
    if (scenes.length < 2) return;
    const idx = scenes.findIndex(s => s.id === activeSceneId);
    if (idx < 0) return;
    const next = scenes[idx + direction];
    if (next) switchScene(next.id);
  }, [scenes, activeSceneId, switchScene]);

  const needsResubmit = moderationStatus === 'needs_revision' || moderationStatus === 'rejected';

  const handleSaveDraft = useCallback(async () => {
    if (isChapterImmutable) return;
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
      // Domain versioning: draft checkpoint (storage-agnostic)
      void createVersion({
        storyId,
        chapterId: String(chapterNumber),
        versionType: 'Draft',
        versionName: 'Draft save',
        content: buildChapterContent({ title: chapterTitle, scenes: scenesRef.current }),
      });
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSavingDraft(false);
    }
  }, [flushEditor, isDemo, persistDraft, cloudSaveDraft, setLastSaved, markClean, isChapterImmutable, storyId, chapterNumber, chapterTitle]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement | null;
      const inField = target?.closest?.('input, textarea, [contenteditable="true"], .ql-editor');

      if (meta && e.key.toLowerCase() === 'f' && !e.shiftKey) {
        e.preventDefault();
        if (!NARRATIVE_OS_ENABLED) setCommandPaletteOpen(false);
        setFindOpen(true);
        return;
      }

      if (meta && e.key.toLowerCase() === 'k') {
        if (NARRATIVE_OS_ENABLED) return;
        e.preventDefault();
        setFindOpen(false);
        setCommandPaletteOpen((open) => !open);
        return;
      }

      if (meta && e.key === 's') {
        e.preventDefault();
        handleSaveDraft();
        return;
      }

      if (e.key === 'Escape') {
        if (findOpen) {
          setFindOpen(false);
          return;
        }
        if (commandPaletteOpen) {
          setCommandPaletteOpen(false);
          return;
        }
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
  }, [
    handleSaveDraft,
    focusMode,
    applyAuthoringWorkspace,
    navigateScene,
    sceneDrawerOpen,
    mobilePreviewOpen,
    findOpen,
    commandPaletteOpen,
  ]);

  // Auto-dismiss success toasts
  useEffect(() => {
    if (!publishSuccess) return;
    const t = window.setTimeout(() => setPublishSuccess(null), 4000);
    return () => window.clearTimeout(t);
  }, [publishSuccess]);

  useEffect(() => {
    if (!scheduleSuccess) return;
    const t = window.setTimeout(() => setScheduleSuccess(null), 5000);
    return () => window.clearTimeout(t);
  }, [scheduleSuccess]);

  const publishWordBand = softWordTarget ?? {
    min: 1500,
    max: 2500,
    hardMax: 3000 as number | null,
  };

  const openWordBandBlock = (reason: WordBandBlockReason, count: number) => {
    const band = publishWordBand;
    setWordBandBlockReason(reason);
    setWordBandBlockOpen(true);
    setPublishConfirmOpen(false);
    const errMsg =
      reason === 'below_min'
        ? `Cannot publish: need at least ${band.min.toLocaleString()} words (you have ${count.toLocaleString()}). Recommended ${band.min.toLocaleString()}–${band.max.toLocaleString()}.`
        : `Cannot publish: hard max is ${(band.hardMax ?? 3000).toLocaleString()} words (you have ${count.toLocaleString()}). Trim before publishing.`;
    setPublishError(errMsg);
    // Native alert is guaranteed visible even if React portal fails or CMS is stale-bundled oddly.
    try {
      showWordBandBlockedAlert({
        wordCount: count,
        min: band.min,
        hardMax: band.hardMax ?? 3000,
        reason,
      });
    } catch {
      /* ignore */
    }
  };

  /** Returns false if blocked (and opens popup). True if OK to continue. */
  const checkWordBandOrNotify = (count: number): boolean => {
    // softWordTarget null = exempt format only
    if (softWordTarget === null) return true;
    const band = softWordTarget ?? publishWordBand;
    const min = band.min ?? 1500;
    const hardMax = band.hardMax ?? 3000;
    if (count < min) {
      openWordBandBlock('below_min', count);
      return false;
    }
    if (count > hardMax) {
      openWordBandBlock('over_hard_max', count);
      return false;
    }
    return true;
  };

  const assertWordBandOrThrow = (count: number) => {
    if (!checkWordBandOrNotify(count)) {
      throw new Error(
        `Serialized chapters need ${publishWordBand.min.toLocaleString()}–${(publishWordBand.hardMax ?? 3000).toLocaleString()} words (you have ${count.toLocaleString()}).`,
      );
    }
  };

  /** Parse API / edge errors into the word-band popup when possible. */
  const notifyWordBandFromError = (message: string, count: number) => {
    const lower = message.toLowerCase();
    if (
      lower.includes('at least') ||
      lower.includes('too short') ||
      lower.includes('need at least') ||
      lower.includes('1500') ||
      lower.includes('1,500')
    ) {
      openWordBandBlock('below_min', count);
      return true;
    }
    if (
      lower.includes('cannot exceed') ||
      lower.includes('too long') ||
      lower.includes('3000') ||
      lower.includes('3,000')
    ) {
      openWordBandBlock('over_hard_max', count);
      return true;
    }
    return false;
  };

  const executePublish = async () => {
    setPublishing(true);
    setPublishError(null);
    setPublishSuccess(null);
    try {
      flushEditor();
      const content = aggregateScenesToHtml(scenes);
      // Re-count after flush so empty/short body cannot slip past a stale wordCount.
      const liveWordCount = getWordCountFromScenes(scenes, locale);
      if (!content.trim() || liveWordCount === 0) {
        throw new Error('Add some content before publishing');
      }
      assertWordBandOrThrow(liveWordCount);

      if (!isDemo) {
        try {
          await cloudSaveDraft();
        } catch (draftErr) {
          if (!isLikelyOfflineError(draftErr)) throw draftErr;
          // Continue — publish may still queue offline
        }

        const publishBody = {
          chapter_number: chapterNumber,
          title: chapterTitle,
          content,
          content_delta: scenesToContentDelta(scenes),
          appeal_note: needsResubmit && appealNote.trim() ? appealNote.trim() : undefined,
        };

        try {
          const result = await api.publishChapter(storyId, publishBody) as {
            moderation?: { status?: string; note?: string };
            story_trust?: { suggestedTrustLevel?: string; score?: number };
          };
          setModerationStatus(result.moderation?.status || 'pending_review');
          const trustNote = result.story_trust?.score != null
            ? ` Story Trust SPI: ${result.story_trust.score}.`
            : '';
          setPublishSuccess(
            `Submitted for moderation — typically reviewed within 1–2 hours.${trustNote} Share to WhatsApp when ready.`,
          );
          void createVersion({
            storyId,
            chapterId: String(chapterNumber),
            versionType: 'Publish',
            versionName: 'Published',
            content: buildChapterContent({ title: chapterTitle, scenes }),
          });
          // One-tap distribution loop (DEC-008) — open share after publish.
          try {
            const meta = await api.getStoryChapters(storyId);
            const storyRow: StoryData = {
              id: storyId,
              title: meta.story?.title || storyDisplayTitle || chapterTitle,
              slug: (meta.story as { slug?: string } | undefined)?.slug,
              genre: 'general',
              chapter_count: meta.chapters?.length || chapterNumber,
              total_readers: 0,
            } as StoryData;
            setShareStory(storyRow);
            setShareChapters(
              (meta.chapters || []).map((c) => ({
                chapter_number: c.chapter_number,
                title: c.title,
              })) as ChapterListItem[],
            );
            // Immediate WhatsApp deep link for founding creators (zero extra steps).
            const slug = resolveStorySlug(storyRow);
            const url = buildChapterShareUrl(slug, chapterNumber);
            shareViaWhatsApp(url, buildShareMessage(storyRow.title, chapterTitle, chapterNumber));
            setShareOpen(true);
          } catch {
            /* non-fatal */
          }
        } catch (pubErr) {
          if (isLikelyOfflineError(pubErr)) {
            await enqueuePublishJob({
              storyId,
              chapterNumber,
              title: chapterTitle,
              content,
              content_delta: publishBody.content_delta,
              appeal_note: publishBody.appeal_note,
            });
            persistDraft();
            setModerationStatus('pending_review');
            setPublishSuccess(
              'You are offline — chapter queued. It will submit automatically when you reconnect.',
            );
          } else {
            throw pubErr;
          }
        }
      } else {
        persistDraft();
        setPublishSuccess('Demo draft saved locally');
      }
      setLastSaved(new Date());
      markClean();
      if (activeScene) saveSceneVersion(activeScene.id, activeScene.title, activeScene.content);
      setPublishConfirmOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Publish failed';
      const liveCount = getWordCountFromScenes(scenes, locale);
      // If under min, always show word-band UI (edge errors often hide the real message).
      if (liveCount > 0 && liveCount < 1500) {
        openWordBandBlock('below_min', liveCount);
      } else if (liveCount > 3000) {
        openWordBandBlock('over_hard_max', liveCount);
      } else if (!notifyWordBandFromError(msg, liveCount)) {
        setPublishError(msg);
        try {
          window.alert(`Publish failed:\n\n${msg}`);
        } catch {
          /* ignore */
        }
      }
      setPublishConfirmOpen(false);
    } finally {
      setPublishing(false);
      setPendingPublish(false);
    }
  };

  const handlePublish = () => {
    // Re-count from live scenes so stale wordCount cannot skip the popup.
    try {
      flushEditor();
    } catch {
      /* ignore */
    }
    const liveCount = getWordCountFromScenes(scenes, locale);
    if (liveCount <= 0) {
      setPublishError('Add some content before publishing');
      setWordBandBlockOpen(false);
      try {
        window.alert('Add some content before publishing.');
      } catch {
        /* ignore */
      }
      return;
    }
    // Force serial band even if softWordTarget failed to resolve (except explicit exempt).
    const ct = (storyContentType || 'serialized_story').trim();
    const exempt = ['short_story', 'flash_fiction', 'short_story_collection', 'epistolary_chat', 'interactive_branching'];
    if (!exempt.includes(ct) && liveCount < 1500) {
      openWordBandBlock('below_min', liveCount);
      return;
    }
    if (!exempt.includes(ct) && liveCount > 3000) {
      openWordBandBlock('over_hard_max', liveCount);
      return;
    }
    if (!checkWordBandOrNotify(liveCount)) {
      return;
    }
    setPublishError(null);
    if (!isDemo && !user?.phone_verified) {
      setPendingPublish(true);
      setPhoneVerifyOpen(true);
      return;
    }
    setPublishConfirmOpen(true);
  };

  const handleSchedulePublish = useCallback(async (isoDatetime: string) => {
    setScheduleError(null);
    setScheduleSuccess(null);
    if (!hasContent) {
      setScheduleError('Add some content before scheduling');
      return;
    }
    if (!checkWordBandOrNotify(wordCount)) {
      setScheduleError(
        softWordTarget
          ? `Need ${softWordTarget.min.toLocaleString()}–${(softWordTarget.hardMax ?? 3000).toLocaleString()} words to schedule (you have ${wordCount.toLocaleString()}).`
          : 'Chapter length out of range',
      );
      return;
    }
    const when = new Date(isoDatetime);
    if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now() + 60_000) {
      setScheduleError('Pick a time at least a few minutes in the future');
      return;
    }
    setScheduling(true);
    try {
      flushEditor();
      if (isDemo) {
        persistDraft();
        setScheduleSuccess(`Scheduled for ${when.toLocaleString()} (demo)`);
        setChapterStatus('scheduled');
        return;
      }
      await cloudSaveDraft();
      persistDraft();
      await api.scheduleChapter(storyId, {
        chapter_number: chapterNumber,
        scheduled_publish_at: when.toISOString(),
      });
      setChapterStatus('scheduled');
      setScheduleSuccess(`Scheduled for ${when.toLocaleString()}`);
      markClean();
    } catch (err) {
      setScheduleError(err instanceof Error ? err.message : 'Could not schedule publish');
    } finally {
      setScheduling(false);
    }
  }, [
    hasContent,
    wordCount,
    softWordTarget,
    flushEditor,
    isDemo,
    persistDraft,
    cloudSaveDraft,
    storyId,
    chapterNumber,
    markClean,
  ]);

  const handlePhoneVerified = async () => {
    await refreshUser();
    if (pendingPublish) {
      setPendingPublish(false);
      setPublishConfirmOpen(true);
    }
  };

  useEffect(() => {
    if (findMatchIndex >= findMatches.length) {
      setFindMatchIndex(Math.max(0, findMatches.length - 1));
    }
  }, [findMatches.length, findMatchIndex]);

  useEffect(() => {
    if (!findActiveMatch || findActiveMatch.sceneId === activeSceneId) return;
    switchScene(findActiveMatch.sceneId);
  }, [findActiveMatch, activeSceneId, switchScene]);

  const goToFindMatch = useCallback((nextIndex: number) => {
    if (findMatches.length === 0) return;
    const wrapped = (nextIndex + findMatches.length) % findMatches.length;
    setFindMatchIndex(wrapped);
  }, [findMatches.length]);

  const applyReplaceAt = useCallback((match: ChapterFindMatch, advance: boolean) => {
    if (isChapterImmutable) return;
    flushEditor();
    const scene = scenes.find((s) => s.id === match.sceneId);
    if (!scene) return;

    if (match.field === 'title') {
      updateSceneTitle(match.sceneId, replaceInSceneTitle(scene.title, match, findReplace));
    } else {
      updateSceneContent(
        match.sceneId,
        replaceInSceneContent(scene.content, match, findReplace),
      );
    }

    if (advance && findMatches.length > 1) {
      goToFindMatch(findMatchIndex + 1);
    }
  }, [scenes, findReplace, findMatches.length, findMatchIndex, goToFindMatch, flushEditor, isChapterImmutable]);

  const handleReplaceAll = useCallback(() => {
    if (isChapterImmutable || !findQuery.trim()) return;
    flushEditor();
    setScenes(replaceAllInChapter(scenes, findQuery, findReplace));
    setFindMatchIndex(0);
  }, [findQuery, findReplace, scenes, flushEditor, isChapterImmutable]);

  const editorCommands = useMemo(
    () => buildEditorCommands({
      scenes,
      onJumpScene: (id) => { switchScene(id); setSceneDrawerOpen(false); },
      onOpenChapters: () => navigate(`/stories/${storyId}`),
      onSwitchWorkspace: applyAuthoringWorkspace,
      onPreviewTheme: (t) => {
        setPreviewTheme(t);
        saveEditorPrefs(storyId, chapterNumber, { previewTheme: t });
      },
      onPublish: handlePublish,
      onHistory: () => setHistoryOpen(true),
      onOpenAi: () => setAiCompanionOpen(true),
      onOpenFind: () => setFindOpen(true),
    }),
    [scenes, storyId, chapterNumber, navigate, applyAuthoringWorkspace, handlePublish, switchScene],
  );

  const deleteTarget = deleteSceneId ? scenes.find(s => s.id === deleteSceneId) : null;

  if (loading) {
    return <EditorLoadingSkeleton />;
  }

  const editorModals = (
    <>
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
        softWordTarget={softWordTarget}
      />
      <WordBandBlockModal
        open={wordBandBlockOpen}
        onClose={() => setWordBandBlockOpen(false)}
        wordCount={wordCount}
        min={publishWordBand.min}
        max={publishWordBand.max}
        hardMax={publishWordBand.hardMax ?? 3000}
        reason={wordBandBlockReason}
        locale={locale}
      />
      <DeleteSceneModal
        open={Boolean(deleteSceneId)}
        sceneTitle={deleteTarget?.title || 'Untitled scene'}
        onClose={() => setDeleteSceneId(null)}
        onConfirm={confirmDeleteScene}
      />
      <VersionHistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        storyId={storyId}
        chapterNumber={chapterNumber}
        chapterTitle={chapterTitle}
        scenes={scenes}
        onRestored={handleRestoreVersionSnapshot}
        readOnly={isChapterImmutable}
      />
      {shareOpen && shareStory && (
        <ShareModal
          story={shareStory}
          chapters={shareChapters.length ? shareChapters : [{ chapter_number: chapterNumber, title: chapterTitle }]}
          onClose={() => setShareOpen(false)}
        />
      )}
      <DraftConflictModal
        open={draftConflictOpen}
        preferred={draftConflictPrefer}
        localUpdatedLabel={
          pendingLocalDraft
            ? new Date(pendingLocalDraft.updatedAt).toLocaleString()
            : 'Unknown'
        }
        cloudUpdatedLabel={
          pendingCloudDraft?.updatedAt
            ? new Date(pendingCloudDraft.updatedAt).toLocaleString()
            : 'Cloud draft'
        }
        onChoose={(choice) => {
          const side = choice === 'local' ? pendingLocalDraft : pendingCloudDraft;
          if (side) {
            setScenes(side.scenes);
            setActiveSceneId(side.scenes[0]?.id || '');
            setChapterTitle(side.title);
            dirtyBaselineRef.current = JSON.stringify({ title: side.title, scenes: side.scenes });
            setDirty(choice === 'local');
            if (choice === 'local' && storyId) {
              saveDraftToCache({
                key: `${storyId}:${chapterNumber}`,
                story_id: storyId,
                chapter_number: chapterNumber,
                title: side.title,
                scenes: side.scenes,
                updated_at: Date.now(),
              }).catch(() => {});
            }
          }
          setDraftConflictOpen(false);
          setPendingLocalDraft(null);
          setPendingCloudDraft(null);
        }}
      />
    </>
  );

  const narrativeStatusContent = (
    <>
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
      {moderationStatus === 'pending_review' && (
        <EditorStatusStrip
          tone="info"
          title="Pending review"
          message="Your chapter is in the moderation queue."
        />
      )}
      {needsResubmit && (
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
      {isChapterImmutable && !publishSuccess && (
        <EditorStatusStrip
          tone="success"
          title="Published — read only"
          message="This chapter is live for readers. Edits require resubmit for review — the editor is locked to protect the published version."
        />
      )}
      {publishSuccess && (
        <EditorStatusStrip
          tone="success"
          message={publishSuccess}
          onDismiss={() => setPublishSuccess(null)}
        />
      )}
      {publishError && (
        <EditorStatusStrip
          tone="error"
          title="Action needed"
          message={publishError}
          onDismiss={() => setPublishError(null)}
        />
      )}
    </>
  );

  if (NARRATIVE_OS_ENABLED) {
    return (
      <>
        <NarrativeChapterWorkspace
          storyId={storyId}
          storyTitle={storyDisplayTitle}
          chapterNum={chapterNumber}
          chapterTitle={chapterTitle}
          onChapterTitleChange={setChapterTitle}
          scenes={scenes}
          activeSceneId={activeSceneId}
          activeSceneIndex={activeSceneIndex}
          activeScene={activeScene}
          narrativeFormat={narrativeFormat}
          onNarrativeFormatChange={handleNarrativeFormatChange}
          onSwitchScene={switchScene}
          onUpdateBeatName={handleUpdateBeatName}
          onAddScene={handleAddScene}
          onReorderScenes={setScenes}
          onDeleteScene={requestDeleteScene}
          onDuplicateScene={handleDuplicateScene}
          updateSceneTitle={updateSceneTitle}
          updateSceneContent={updateSceneContent}
          wordCount={wordCount}
          readMins={readMins}
          charCount={charCount}
          charLimit={CHAR_LIMIT}
          wordGoal={softWordGoal}
          saving={saving || savingDraft}
          dirty={dirty}
          focusMode={focusMode}
          onToggleFocus={() => applyAuthoringWorkspace(focusMode ? 'writing' : 'focus')}
          phoneticLive={phoneticLive}
          onTogglePhonetic={() => setPhoneticLive((p) => !p)}
          fontScale={fontScale}
          onFontScaleChange={handleFontScaleChange}
          editorComfortStyle={editorComfortStyle}
          canvasMaxWidth={canvasMaxWidth}
          isChapterImmutable={isChapterImmutable}
          isDemo={isDemo}
          arrivalMomentum={arrivalMomentum}

          selectionRect={selectionRect}
          onSelectionRectChange={setSelectionRect}
          slashCmdOpen={slashCmdOpen}
          slashFilter={slashFilter}
          onSlashCmdOpenChange={(open) => {
            setSlashCmdOpen(open);
            if (!open) setSlashFilter('');
          }}
          cmdAnchor={cmdAnchor}
          onSlashCommandRequest={({ anchor, filter }) => {
            setCmdAnchor(anchor);
            setSlashFilter(filter);
            setSlashCmdOpen(true);
          }}
          onSlashCommandDismiss={() => setSlashCmdOpen(false)}
          highlightNoteRef={highlightAuthorNoteRef}
          findOpen={findOpen}
          findQuery={findQuery}
          findReplace={findReplace}
          findShowReplace={findShowReplace}
          findMatchIndex={findMatchIndex}
          findMatches={findMatches}
          findActiveMatch={findActiveMatch}
          onFindQueryChange={(value) => { setFindQuery(value); setFindMatchIndex(0); }}
          onFindReplaceChange={setFindReplace}
          onFindToggleReplace={() => setFindShowReplace((v) => !v)}
          onFindClose={() => setFindOpen(false)}
          onFindNext={() => goToFindMatch(findMatchIndex + 1)}
          onFindPrev={() => goToFindMatch(findMatchIndex - 1)}
          onFindReplace={() => findActiveMatch && applyReplaceAt(findActiveMatch, false)}
          onFindReplaceNext={() => findActiveMatch && applyReplaceAt(findActiveMatch, true)}
          onFindReplaceAll={handleReplaceAll}
          onOpenFind={() => setFindOpen(true)}
          authorComments={authorComments}
          activeAuthorCommentId={activeAuthorCommentId}
          flushRef={editorFlushRef}
          formatActionRef={formatActionRef}
          selectionCaptureRef={editorSelectionCaptureRef}
          onBack={() => navigate(`/stories/${storyId}`)}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
          onSchedulePublish={handleSchedulePublish}
          scheduling={scheduling}
          scheduleError={scheduleError}
          scheduleSuccess={scheduleSuccess}
          onHistory={() => setHistoryOpen(true)}
          onOpenTimeline={() => navigate(`/stories/${storyId}`)}
          publishLabel={needsResubmit ? 'Resubmit' : 'Publish'}
          publishing={publishing}
          publishDisabled={!hasContent || overLimit}
          statusContent={narrativeStatusContent}
          previewDevice={previewDevice}
          previewTheme={previewTheme}
          onPreviewDeviceChange={(d) => { setPreviewDevice(d); saveEditorPrefs(storyId, chapterNumber, { previewDevice: d }); }}
          onPreviewThemeChange={(th) => { setPreviewTheme(th); saveEditorPrefs(storyId, chapterNumber, { previewTheme: th }); }}
          showArrival={false}
          chapterOptions={chapterOptions}
          onSwitchChapter={(num) => {
            if (num === chapterNumber) return;
            navigate(resolveChapterEditorPath(storyId, num, {
              contentType: storyContentType,
              language: storyLanguage,
            }));
          }}
          storyContentType={storyContentType}
          formatLocked
          peopleSlot={!isDemo && activeSceneId ? (
            <SceneCharacterPanel
              characters={storyCharacters}
              linkedIds={activeSceneLinkedIds}
              onToggle={(id) => { void toggleSceneCharacter(id); }}
              suggestedNames={characterSuggestions}
              onAddCharacter={(name) => { void handleQuickAddCharacter(name); }}
              addingName={addingCharacterName}
              loading={sceneCharactersLoading}
              disabled={sceneCharacterBusy}
            />
          ) : undefined}
          notesSlot={!isDemo && activeSceneId ? (
            <AuthorNotesPanel
              comments={authorComments}
              sceneId={activeSceneId}
              disabled={sceneCharacterBusy}
              onCaptureAnchor={() => editorSelectionCaptureRef.current?.() ?? null}
              activeCommentId={activeAuthorCommentId}
              onNoteClick={(comment) => {
                setActiveAuthorCommentId(comment.id);
                highlightAuthorNoteRef.current?.(comment);
              }}
              onAdd={async (body, anchor) => {
                const { comment } = await api.createAuthorComment(storyId, chapterNumber, {
                  scene_id: activeSceneId,
                  body,
                  selected_text: anchor?.text,
                  start_offset: anchor?.start_offset,
                  end_offset: anchor?.end_offset,
                });
                setAuthorComments((prev) => [...prev, comment]);
              }}
              onResolve={async (commentId) => {
                const { comment } = await api.updateAuthorComment(storyId, chapterNumber, commentId, {
                  status: 'resolved',
                });
                setAuthorComments((prev) => prev.map((c) => (c.id === commentId ? comment : c)));
              }}
              onDelete={async (commentId) => {
                await api.deleteAuthorComment(storyId, chapterNumber, commentId);
                setAuthorComments((prev) => prev.filter((c) => c.id !== commentId));
              }}
            />
          ) : undefined}
        />
        {editorModals}
      </>
    );
  }

  return (
    <div className={`katha-proto-layout katha-proto-layout--premium katha-proto-layout--calm26 chapter-editor chapter-editor--parity chapter-editor--calm27 wc-page-enter${focusMode ? ' focus-mode' : ''}`} data-katha-mode="creation">
      <ChapterFindBar
        open={findOpen}
        query={findQuery}
        replaceText={findReplace}
        showReplace={findShowReplace}
        matchIndex={findMatchIndex}
        matchCount={findMatches.length}
        focusRestoreKey={findOpen ? `${findQuery}|${findMatchIndex}|${activeSceneId}` : undefined}
        onQueryChange={(value) => {
          setFindQuery(value);
          setFindMatchIndex(0);
        }}
        onReplaceTextChange={setFindReplace}
        onToggleReplace={() => setFindShowReplace((v) => !v)}
        onClose={() => setFindOpen(false)}
        onNext={() => goToFindMatch(findMatchIndex + 1)}
        onPrev={() => goToFindMatch(findMatchIndex - 1)}
        onReplace={() => findActiveMatch && applyReplaceAt(findActiveMatch, false)}
        onReplaceNext={() => findActiveMatch && applyReplaceAt(findActiveMatch, true)}
        onReplaceAll={handleReplaceAll}
      />

      <EditorCommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        commands={editorCommands}
      />

      {!focusMode && !NARRATIVE_OS_ENABLED && (
        <EditorNavbar
          chapterNum={chapterNumber}
          chapterTitle={chapterTitle}
          onChapterTitleChange={setChapterTitle}
          phoneticLive={phoneticLive}
          wordCount={wordCount}
          readMins={readMins}
          charCount={charCount}
          charLimit={CHAR_LIMIT}
          softWordTarget={softWordTarget}
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

      {/* Serialized word band: soft 1,500–2,500 · hard max 3,000 words (legacy + Narrative OS). */}
      {!focusMode && softWordTarget && (
        <div className="chapter-editor__progress" aria-label={t('editor.chapterWordGoal')}>
          <InkProgress
            wordsToday={wordCount}
            dailyGoal={softWordGoal}
            label={
              locale === 'te'
                ? `సిఫార్సు ${softWordTarget.min}–${softWordTarget.max} · కనీసం ${softWordTarget.min} · గరిష్ఠ ${softWordTarget.hardMax ?? 3000} పదాలు`
                : `Recommended ${softWordTarget.min}–${softWordTarget.max} · min ${softWordTarget.min} · hard max ${softWordTarget.hardMax ?? 3000} words`
            }
          />
        </div>
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

      {!focusMode && isChapterImmutable && !publishSuccess && (
        <EditorStatusStrip
          tone="success"
          title="Published — read only"
          message="This chapter is live for readers. Edits require resubmit for review — the editor is locked to protect the published version."
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

        {workspaceLayout.showSceneSidebar && !NARRATIVE_OS_ENABLED && (
          <SceneSidebar
            scenes={scenes}
            activeSceneId={activeSceneId}
            onSwitchScene={(id) => { switchScene(id); setSceneDrawerOpen(false); }}
            onAddScene={handleAddScene}
            onReorderScenes={setScenes}
            onDeleteScene={requestDeleteScene}
            onDuplicateScene={handleDuplicateScene}
            collapsed={sceneSidebarCollapsed}
            onToggleCollapse={toggleSceneSidebar}
            drawerMode={sceneDrawerOpen}
            onCloseDrawer={() => setSceneDrawerOpen(false)}
            phoneticLive={phoneticLive}
            storyId={storyId}
            chapterNum={chapterNumber}
            sceneSearchInputMode={prefs.sceneSearchInputMode}
            footerSlot={!isDemo && activeSceneId ? (
              <div className="katha-proto-sidebar-stack">
                <SceneCharacterPanel
                  characters={storyCharacters}
                  linkedIds={activeSceneLinkedIds}
                  onToggle={(id) => { void toggleSceneCharacter(id); }}
                  suggestedNames={characterSuggestions}
                  onAddCharacter={(name) => { void handleQuickAddCharacter(name); }}
                  addingName={addingCharacterName}
                  loading={sceneCharactersLoading}
                  disabled={sceneCharacterBusy}
                />
                <AuthorNotesPanel
                  comments={authorComments}
                  sceneId={activeSceneId}
                  disabled={sceneCharacterBusy}
                  onCaptureAnchor={() => editorSelectionCaptureRef.current?.() ?? null}
                  activeCommentId={activeAuthorCommentId}
                  onNoteClick={(comment) => {
                    setActiveAuthorCommentId(comment.id);
                    highlightAuthorNoteRef.current?.(comment);
                  }}
                  onAdd={async (body, anchor) => {
                    const { comment } = await api.createAuthorComment(storyId, chapterNumber, {
                      scene_id: activeSceneId,
                      body,
                      selected_text: anchor?.text,
                      start_offset: anchor?.start_offset,
                      end_offset: anchor?.end_offset,
                    });
                    setAuthorComments((prev) => [...prev, comment]);
                  }}
                  onResolve={async (commentId) => {
                    const { comment } = await api.updateAuthorComment(storyId, chapterNumber, commentId, {
                      status: 'resolved',
                    });
                    setAuthorComments((prev) => prev.map((c) => (c.id === commentId ? comment : c)));
                  }}
                  onDelete={async (commentId) => {
                    await api.deleteAuthorComment(storyId, chapterNumber, commentId);
                    setAuthorComments((prev) => prev.filter((c) => c.id !== commentId));
                  }}
                />
              </div>
            ) : undefined}
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
            selectionCaptureRef={editorSelectionCaptureRef}
            highlightNoteRef={highlightAuthorNoteRef}
            authorComments={authorComments}
            activeAuthorCommentId={activeAuthorCommentId}
            storyId={isDemo ? undefined : storyId}
            readOnly={isChapterImmutable}
            phoneticLive={phoneticLive}
            onTogglePhonetic={() => setPhoneticLive((p) => !p)}
            editorComfortStyle={editorComfortStyle}
            focusMode={focusMode}
            canvasMaxWidth={canvasMaxWidth}
            toolbarMinimal={workspaceLayout.toolbarMinimal}
            showSceneNav={sceneSidebarCollapsed || !workspaceLayout.showSceneSidebar}
            findOpen={findOpen}
            findActiveMatch={findActiveMatch}
            findSceneMatches={findMatches}
            aiCompanionOpen={aiCompanionOpen}
            onAiCompanionOpenChange={setAiCompanionOpen}
          />

        {!focusMode && workspaceLayout.showPreview && !previewCollapsed && (
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
            activeSceneId={activeSceneId}
            previewComfortStyle={editorComfortStyle}
            onCollapse={closePreview}
            mobileOpen={mobilePreviewOpen}
            onCloseMobile={() => setMobilePreviewOpen(false)}
          />
        )}

        {!focusMode && workspaceLayout.showAiNotes && (
          <AiNotesPanel storyId={storyId} chapterNum={chapterNumber} />
        )}
      </div>

      {!focusMode && workspaceLayout.showPreview && previewCollapsed && (
        <button
          type="button"
          className="katha-proto-preview-reopen"
          onClick={openPreview}
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
              onClick={openSceneDrawer}
              title="Scenes"
              aria-label="Open scenes"
            >
              <List size={18} />
            </button>
          )}
          {workspaceLayout.showPreview && (
            <button
              type="button"
              className="katha-proto-preview-drawer-toggle"
              onClick={() => {
                openPreview();
                setMobilePreviewOpen(true);
              }}
              title="Reader preview"
              aria-label="Open reader preview"
            >
              <PanelRightOpen size={18} />
            </button>
          )}
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

      {editorModals}
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
