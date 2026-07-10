import { describe, expect, it } from 'vitest';
import {
  fingerprintDraft,
  resolveDraftConflict,
  sceneContentEmpty,
} from './draftConflict';

describe('draftConflict (DEC-023)', () => {
  it('fingerprints title and scenes', () => {
    const a = fingerprintDraft('T', [{ id: '1', title: 'S', content: '<p>hi</p>' }]);
    const b = fingerprintDraft('T', [{ id: '1', title: 'S', content: '<p>hi</p>' }]);
    const c = fingerprintDraft('T', [{ id: '1', title: 'S', content: '<p>bye</p>' }]);
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it('detects empty scenes', () => {
    expect(sceneContentEmpty([{ content: '<p></p>' }])).toBe(true);
    expect(sceneContentEmpty([{ content: '<p>Hello</p>' }])).toBe(false);
  });

  it('prefers local when cloud empty', () => {
    const d = resolveDraftConflict(
      { updatedAt: 10, fingerprint: 'a', hasContent: true },
      { updatedAt: null, fingerprint: 'b', hasContent: false },
    );
    expect(d.hasConflict).toBe(false);
    expect(d.prefer).toBe('local');
  });

  it('flags divergent content as conflict', () => {
    const d = resolveDraftConflict(
      { updatedAt: 100, fingerprint: 'local', hasContent: true },
      { updatedAt: 200, fingerprint: 'cloud', hasContent: true },
    );
    expect(d.hasConflict).toBe(true);
    expect(d.prefer).toBe('cloud');
    expect(d.reason).toBe('cloud_newer');
  });

  it('no conflict when fingerprints match', () => {
    const d = resolveDraftConflict(
      { updatedAt: 100, fingerprint: 'same', hasContent: true },
      { updatedAt: 50, fingerprint: 'same', hasContent: true },
    );
    expect(d.hasConflict).toBe(false);
    expect(d.reason).toBe('same');
  });
});
