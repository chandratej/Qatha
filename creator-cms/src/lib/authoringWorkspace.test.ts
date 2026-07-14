import { describe, it, expect } from 'vitest';
import {
  expandPreviewPanels,
  expandSceneSidebarPanels,
  layoutForWorkspace,
  normalizeAuthoringWorkspace,
  reconcileSidePanels,
  toggleSceneSidebarPanels,
} from './authoringWorkspace';
import { MANUSCRIPT_COLUMN_WIDTH } from './manuscriptTypography';

describe('authoringWorkspace', () => {
  it('defaults unknown workspace modes to writing', () => {
    expect(normalizeAuthoringWorkspace(undefined)).toBe('writing');
    expect(normalizeAuthoringWorkspace('invalid')).toBe('writing');
  });

  it('always returns a layout object with comfort measure (BR-012)', () => {
    const layout = layoutForWorkspace(undefined);
    expect(layout.sceneSidebarCollapsed).toBe(false);
    expect(layout.canvasMaxWidth).toBe(MANUSCRIPT_COLUMN_WIDTH);
    expect(layoutForWorkspace('focus').canvasMaxWidth).toBe(MANUSCRIPT_COLUMN_WIDTH);
    expect(layoutForWorkspace('writing').canvasMaxWidth).toBe(MANUSCRIPT_COLUMN_WIDTH);
  });

  it('enables sync scroll in review mode', () => {
    expect(layoutForWorkspace('review').syncScroll).toBe(true);
  });

  it('hides scene sidebar in review mode', () => {
    expect(layoutForWorkspace('review').showSceneSidebar).toBe(false);
    expect(layoutForWorkspace('writing').showSceneSidebar).toBe(true);
  });

  it('hides AI notes (brand policy) and hides preview in planning mode', () => {
    expect(layoutForWorkspace('planning').showAiNotes).toBe(false);
    expect(layoutForWorkspace('planning').showPreview).toBe(false);
    expect(layoutForWorkspace('planning').previewCollapsed).toBe(true);
  });

  it('defaults writing and planning to scenes open, preview collapsed', () => {
    expect(layoutForWorkspace('writing')).toMatchObject({
      sceneSidebarCollapsed: false,
      previewCollapsed: true,
    });
    expect(layoutForWorkspace('planning')).toMatchObject({
      sceneSidebarCollapsed: false,
      previewCollapsed: true,
    });
  });

  it('keeps scenes and preview mutually exclusive', () => {
    expect(reconcileSidePanels({ sceneSidebarCollapsed: false, previewCollapsed: false })).toEqual({
      sceneSidebarCollapsed: false,
      previewCollapsed: true,
    });
    expect(expandSceneSidebarPanels()).toEqual({
      sceneSidebarCollapsed: false,
      previewCollapsed: true,
    });
    expect(expandPreviewPanels()).toEqual({
      sceneSidebarCollapsed: true,
      previewCollapsed: false,
    });
    expect(toggleSceneSidebarPanels(true, false)).toEqual({
      sceneSidebarCollapsed: false,
      previewCollapsed: true,
    });
    expect(toggleSceneSidebarPanels(false, false)).toEqual({
      sceneSidebarCollapsed: true,
      previewCollapsed: false,
    });
  });
});