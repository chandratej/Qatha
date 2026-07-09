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
    expect(layout.canvasMaxWidth).toBe(920);
  });
});