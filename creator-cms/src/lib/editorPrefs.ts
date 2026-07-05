export type WorkspaceMode = 'editor' | 'split' | 'desktop' | 'mobile';
export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';
export type PreviewTheme = 'light' | 'dark' | 'sepia' | 'high-contrast';
export type EditorTheme = 'light' | 'dark' | 'sepia';

const PREFIX = 'katha-editor-prefs-';

export interface EditorPrefs {
  workspaceMode: WorkspaceMode;
  previewDevice: PreviewDevice;
  previewTheme: PreviewTheme;
  editorTheme: EditorTheme;
  syncScroll: boolean;
  showWordGoal: boolean;
  sidebarWidth: number;
}

const DEFAULTS: EditorPrefs = {
  workspaceMode: 'split',
  previewDevice: 'desktop',
  previewTheme: 'light',
  editorTheme: 'light',
  syncScroll: false,
  showWordGoal: true,
  sidebarWidth: 280,
};

function key(storyId: string, chapterNum: number) {
  return `${PREFIX}${storyId}-${chapterNum}`;
}

export function loadEditorPrefs(storyId: string, chapterNum: number): EditorPrefs {
  try {
    const raw = localStorage.getItem(key(storyId, chapterNum));
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
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