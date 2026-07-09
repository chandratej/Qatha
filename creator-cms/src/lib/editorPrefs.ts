import { normalizeAuthoringWorkspace, type AuthoringWorkspace } from './authoringWorkspace';
import type { SceneSearchInputMode } from './sceneSearch';

export type WorkspaceMode = 'editor' | 'split' | 'desktop' | 'mobile';
export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';
export type PreviewTheme = 'light' | 'dark' | 'sepia' | 'high-contrast';
export type EditorTheme = 'light' | 'dark' | 'sepia';
export type { SceneSearchInputMode };

const PREFIX = 'katha-editor-prefs-';

export interface EditorPrefs {
  workspaceMode: WorkspaceMode;
  authoringWorkspace: AuthoringWorkspace;
  previewDevice: PreviewDevice;
  previewTheme: PreviewTheme;
  editorTheme: EditorTheme;
  syncScroll: boolean;
  showWordGoal: boolean;
  sidebarWidth: number;
  sceneSearchInputMode: SceneSearchInputMode;
}

const DEFAULTS: EditorPrefs = {
  workspaceMode: 'split',
  authoringWorkspace: 'writing',
  previewDevice: 'desktop',
  previewTheme: 'sepia',
  editorTheme: 'sepia',
  syncScroll: false,
  showWordGoal: true,
  sidebarWidth: 280,
  sceneSearchInputMode: 'phonetic',
};

function key(storyId: string, chapterNum: number) {
  return `${PREFIX}${storyId}-${chapterNum}`;
}

export function loadEditorPrefs(storyId: string, chapterNum: number): EditorPrefs {
  try {
    const raw = localStorage.getItem(key(storyId, chapterNum));
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<EditorPrefs>;
    return {
      ...DEFAULTS,
      ...parsed,
      authoringWorkspace: normalizeAuthoringWorkspace(parsed.authoringWorkspace),
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveEditorPrefs(storyId: string, chapterNum: number, prefs: Partial<EditorPrefs>) {
  try {
    const current = loadEditorPrefs(storyId, chapterNum);
    localStorage.setItem(key(storyId, chapterNum), JSON.stringify({ ...current, ...prefs }));
  } catch {
    /* ignore */
  }
}