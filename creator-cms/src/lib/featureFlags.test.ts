import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isStudioLabPath,
  isStudioLabsEnabled,
  setStudioLabsEnabled,
  STUDIO_LAB_PATHS,
} from './featureFlags';

describe('featureFlags (DEC-007 / BR-010)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    try {
      localStorage.removeItem('katha_studio_labs');
    } catch {
      /* ignore */
    }
  });

  it('defaults labs off', () => {
    vi.stubEnv('VITE_STUDIO_LABS', '');
    expect(isStudioLabsEnabled()).toBe(false);
  });

  it('enables labs from env', () => {
    vi.stubEnv('VITE_STUDIO_LABS', 'true');
    expect(isStudioLabsEnabled()).toBe(true);
  });

  it('enables labs from localStorage override', () => {
    vi.stubEnv('VITE_STUDIO_LABS', '');
    setStudioLabsEnabled(true);
    expect(isStudioLabsEnabled()).toBe(true);
    setStudioLabsEnabled(false);
    expect(isStudioLabsEnabled()).toBe(false);
  });

  it('recognizes lab paths including nested', () => {
    expect(STUDIO_LAB_PATHS.length).toBeGreaterThanOrEqual(4);
    expect(isStudioLabPath('/events')).toBe(true);
    expect(isStudioLabPath('/events/new')).toBe(true);
    expect(isStudioLabPath('/reviewers')).toBe(true);
    expect(isStudioLabPath('/tags')).toBe(true);
    expect(isStudioLabPath('/platform')).toBe(true);
    expect(isStudioLabPath('/stories')).toBe(false);
    expect(isStudioLabPath('/monetization')).toBe(false);
  });
});
