import { describe, it, expect } from 'vitest';
import { isEmptyEditorHtml, applyLivePhoneticToHtml } from './quillPhonetic';

describe('quillPhonetic', () => {
  it('detects empty editor html', () => {
    expect(isEmptyEditorHtml('')).toBe(true);
    expect(isEmptyEditorHtml('<p><br></p>')).toBe(true);
    expect(isEmptyEditorHtml('<p>Hello</p>')).toBe(false);
  });

  it('returns trailing roman word from live phonetic pass', () => {
    const { trailingWord } = applyLivePhoneticToHtml('<p>nama</p>');
    expect(trailingWord).toBe('nama');
  });
});