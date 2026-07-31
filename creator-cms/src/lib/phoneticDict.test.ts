import { describe, expect, it, beforeEach } from 'vitest';
import {
  deletePersonalCorrection,
  exportPersonalCorrectionsJson,
  getPersonalCorrections,
  importPersonalCorrections,
  setPersonalCorrection,
} from './phonetic';

describe('personal phonetic dictionary (moat)', () => {
  beforeEach(() => {
    // Clear via delete of known keys after import empty overwrite
    for (const key of Object.keys(getPersonalCorrections())) {
      deletePersonalCorrection(key);
    }
  });

  it('stores and exports personal corrections (schema v2 durable memory)', () => {
    setPersonalCorrection('Vaikuntapuram', 'వైకుంఠపురం');
    setPersonalCorrection('lakshmi', 'లక్ష్మి');
    const dict = getPersonalCorrections();
    expect(dict.vaikuntapuram).toBe('వైకుంఠపురం');
    expect(dict.lakshmi).toBe('లక్ష్మి');
    const json = exportPersonalCorrectionsJson();
    expect(json).toContain('vaikuntapuram');
    expect(json).toContain('వైకుంఠపురం');
    expect(json).toContain('schema_version');
    expect(json).toContain('records');
  });

  it('imports without overwriting when overwrite=false', () => {
    setPersonalCorrection('rama', 'రామ');
    importPersonalCorrections({ rama: 'రాముడు', sita: 'సీత' }, { overwrite: false });
    expect(getPersonalCorrections().rama).toBe('రామ');
    expect(getPersonalCorrections().sita).toBe('సీత');
  });

  it('deletes corrections', () => {
    setPersonalCorrection('demo', 'డెమో');
    deletePersonalCorrection('demo');
    expect(getPersonalCorrections().demo).toBeUndefined();
  });
});
