export type AuthoringWorkspace = 'planning' | 'writing' | 'focus' | 'review';

export interface AuthoringWorkspaceLayout {
  sceneSidebarCollapsed: boolean;
  previewCollapsed: boolean;
  focusMode: boolean;
  showSceneSidebar: boolean;
  showPreview: boolean;
  workspaceClass: string;
  canvasMaxWidth: number;
  syncScroll: boolean;
  showAiNotes: boolean;
  toolbarMinimal: boolean;
}

export type WorkspaceIconId = 'notebook' | 'pen' | 'focus' | 'book-open';

export const AUTHORING_WORKSPACES: {
  id: AuthoringWorkspace;
  label: string;
  icon: WorkspaceIconId;
}[] = [
  { id: 'planning', label: 'Planning', icon: 'notebook' },
  { id: 'writing', label: 'Writing', icon: 'pen' },
  { id: 'focus', label: 'Focus', icon: 'focus' },
  { id: 'review', label: 'Review', icon: 'book-open' },
];

const VALID_WORKSPACES = new Set<AuthoringWorkspace>(['planning', 'writing', 'focus', 'review']);

export interface SidePanelState {
  sceneSidebarCollapsed: boolean;
  previewCollapsed: boolean;
}

/** Keep scenes and preview panes mutually exclusive — never both expanded. */
export function reconcileSidePanels(
  state: SidePanelState,
  showSceneSidebar = true,
  showPreview = true,
): SidePanelState {
  const next = {
    sceneSidebarCollapsed: showSceneSidebar ? state.sceneSidebarCollapsed : true,
    previewCollapsed: showPreview ? state.previewCollapsed : true,
  };
  if (showSceneSidebar && showPreview && !next.sceneSidebarCollapsed && !next.previewCollapsed) {
    return { sceneSidebarCollapsed: false, previewCollapsed: true };
  }
  return next;
}

export function expandSceneSidebarPanels(): SidePanelState {
  return { sceneSidebarCollapsed: false, previewCollapsed: true };
}

export function expandPreviewPanels(): SidePanelState {
  return { sceneSidebarCollapsed: true, previewCollapsed: false };
}

export function toggleSceneSidebarPanels(collapsed: boolean, previewCollapsed: boolean): SidePanelState {
  if (collapsed) return expandSceneSidebarPanels();
  return { sceneSidebarCollapsed: true, previewCollapsed };
}

export function normalizeAuthoringWorkspace(mode: unknown): AuthoringWorkspace {
  if (typeof mode === 'string' && VALID_WORKSPACES.has(mode as AuthoringWorkspace)) {
    return mode as AuthoringWorkspace;
  }
  return 'writing';
}

export function layoutForWorkspace(mode: AuthoringWorkspace | unknown): AuthoringWorkspaceLayout {
  const resolved = normalizeAuthoringWorkspace(mode);
  switch (resolved) {
    case 'planning':
      return {
        sceneSidebarCollapsed: false,
        previewCollapsed: true,
        focusMode: false,
        showSceneSidebar: true,
        showPreview: false,
        syncScroll: false,
        showAiNotes: true,
        toolbarMinimal: false,
        workspaceClass: 'katha-proto-workspace--mode-planning',
        canvasMaxWidth: 840,
      };
    case 'writing':
      return {
        sceneSidebarCollapsed: false,
        previewCollapsed: true,
        focusMode: false,
        showSceneSidebar: true,
        showPreview: true,
        syncScroll: false,
        showAiNotes: false,
        toolbarMinimal: false,
        workspaceClass: 'katha-proto-workspace--mode-writing',
        canvasMaxWidth: 960,
      };
    case 'focus':
      return {
        sceneSidebarCollapsed: true,
        previewCollapsed: true,
        focusMode: true,
        showSceneSidebar: false,
        showPreview: false,
        syncScroll: false,
        showAiNotes: false,
        toolbarMinimal: true,
        workspaceClass: 'katha-proto-workspace--mode-focus',
        canvasMaxWidth: 940,
      };
    case 'review':
      return {
        sceneSidebarCollapsed: true,
        previewCollapsed: false,
        focusMode: false,
        showSceneSidebar: false,
        showPreview: true,
        syncScroll: true,
        showAiNotes: false,
        toolbarMinimal: false,
        workspaceClass: 'katha-proto-workspace--mode-review',
        canvasMaxWidth: 720,
      };
    default:
      return {
        sceneSidebarCollapsed: false,
        previewCollapsed: true,
        focusMode: false,
        showSceneSidebar: true,
        showPreview: true,
        syncScroll: false,
        showAiNotes: false,
        toolbarMinimal: false,
        workspaceClass: 'katha-proto-workspace--mode-writing',
        canvasMaxWidth: 960,
      };
  }
}