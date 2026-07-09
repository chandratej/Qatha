export type AuthoringWorkspace = 'planning' | 'writing' | 'focus' | 'review';

export interface AuthoringWorkspaceLayout {
  sceneSidebarCollapsed: boolean;
  previewCollapsed: boolean;
  focusMode: boolean;
  workspaceClass: string;
  canvasMaxWidth: number;
}

export const AUTHORING_WORKSPACES: {
  id: AuthoringWorkspace;
  label: string;
  icon: string;
}[] = [
  { id: 'planning', label: 'Planning', icon: '📋' },
  { id: 'writing', label: 'Writing', icon: '✍' },
  { id: 'focus', label: 'Focus', icon: '🎯' },
  { id: 'review', label: 'Review', icon: '📖' },
];

const VALID_WORKSPACES = new Set<AuthoringWorkspace>(['planning', 'writing', 'focus', 'review']);

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
        workspaceClass: 'katha-proto-workspace--mode-planning',
        canvasMaxWidth: 880,
      };
    case 'writing':
      return {
        sceneSidebarCollapsed: false,
        previewCollapsed: false,
        focusMode: false,
        workspaceClass: 'katha-proto-workspace--mode-writing',
        canvasMaxWidth: 920,
      };
    case 'focus':
      return {
        sceneSidebarCollapsed: true,
        previewCollapsed: true,
        focusMode: true,
        workspaceClass: 'katha-proto-workspace--mode-focus',
        canvasMaxWidth: 900,
      };
    case 'review':
      return {
        sceneSidebarCollapsed: true,
        previewCollapsed: false,
        focusMode: false,
        workspaceClass: 'katha-proto-workspace--mode-review',
        canvasMaxWidth: 760,
      };
    default:
      return {
        sceneSidebarCollapsed: false,
        previewCollapsed: false,
        focusMode: false,
        workspaceClass: 'katha-proto-workspace--mode-writing',
        canvasMaxWidth: 920,
      };
  }
}