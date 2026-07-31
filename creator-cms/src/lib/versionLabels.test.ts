import { describe, it, expect } from 'vitest';
import { versionSourceLabel } from './versionLabels';

describe('versionLabels', () => {
  it('returns semantic labels for version sources', () => {
    expect(versionSourceLabel('autosave')).toBe('Autosave');
    expect(versionSourceLabel('manual')).toBe('Manual edit');
    expect(versionSourceLabel('ai-rewrite')).toBe('Earlier edit');
    expect(versionSourceLabel('published')).toBe('Published version');
  });

  it('defaults unknown sources to autosave label', () => {
    expect(versionSourceLabel(undefined)).toBe('Autosave');
  });
});