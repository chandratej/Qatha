import { describe, it, expect } from 'vitest';
import { layoutForWorkspace, normalizeAuthoringWorkspace } from './authoringWorkspace';

describe('authoringWorkspace', () => {
  it('defaults unknown workspace modes to writing', () => {
    expect(normalizeAuthoringWorkspace(undefined)).toBe('writing');
    expect(normalizeAuthoringWorkspace('invalid')).toBe('writing');
  });

  it('always returns a layout object', () => {
    const layout = layoutForWorkspace(undefined);
    expect(layout.sceneSidebarCollapsed).toBe(false);
    expect(layout.canvasMaxWidth).toBe(960);
  });

  it('enables sync scroll in review mode', () => {
    expect(layoutForWorkspace('review').syncScroll).toBe(true);
  });

  it('hides scene sidebar in review mode', () => {
    expect(layoutForWorkspace('review').showSceneSidebar).toBe(false);
    expect(layoutForWorkspace('writing').showSceneSidebar).toBe(true);
  });

  it('shows AI notes in planning mode', () => {
    expect(layoutForWorkspace('planning').showAiNotes).toBe(true);
    expect(layoutForWorkspace('planning').previewCollapsed).toBe(false);
  });
});