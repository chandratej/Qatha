import { describe, expect, it, vi } from 'vitest';
import {
  applyLivePhoneticViaQuill,
  buildPhoneticReplacements,
  commitWordAtCursorViaQuill,
  PHONETIC_WORD_SPACE,
  preserveTrailingSpacesInHtml,
  quillRootHtml,
  type QuillLike,
} from './quillPhoneticApply';
import { shouldKeepLiteralEnglish, unwrapLiteralEnglish } from './phoneticEscape';
import { phoneticToTelugu } from './phonetic';
import { findPhoneticTokens } from './phoneticTokens';

function makeMockEditor(initial: string): QuillLike & { _text: string } {
  const state = { _text: initial };
  const editor: QuillLike & { _text: string } = {
    get _text() { return state._text; },
    set _text(v: string) { state._text = v; },
    root: document.createElement('div'),
    getText: (index = 0, length?: number) => {
      const t = state._text;
      if (length == null) return t.slice(index);
      return t.slice(index, index + length);
    },
    getLength: () => state._text.length + 1,
    getSelection: () => ({ index: state._text.length, length: 0 }),
    setSelection: vi.fn(),
    deleteText: (index, length) => {
      state._text = state._text.slice(0, index) + state._text.slice(index + length);
    },
    insertText: (index, text) => {
      state._text = state._text.slice(0, index) + text + state._text.slice(index);
    },
    // No updateContents → exercise delete/insert fallback path
  };
  return editor;
}

describe('backtick escape hatch', () => {
  it('tokenizes `Netflix` including backticks', () => {
    const tokens = findPhoneticTokens('watch `Netflix` tonight ');
    expect(tokens.some((t) => t.raw === '`Netflix`')).toBe(true);
  });

  it('shouldKeepLiteralEnglish sees backtick-wrapped words', () => {
    expect(shouldKeepLiteralEnglish('`Netflix`')).toBe(true);
    expect(unwrapLiteralEnglish('`Netflix`')).toBe('Netflix');
  });

  it('buildPhoneticReplacements unwraps backticks instead of converting', () => {
    const reps = buildPhoneticReplacements('`Netflix` satyam ');
    const netflix = reps.find((r) => r.tel === 'Netflix');
    expect(netflix).toBeTruthy();
    expect(netflix!.length).toBe('`Netflix`'.length);
    expect(reps.some((r) => r.tel.includes('సత్యం') || r.tel === phoneticToTelugu('satyam'))).toBe(true);
  });

  it('applyLivePhoneticViaQuill leaves Netflix literal after unwrap', () => {
    const editor = makeMockEditor('`Netflix` satyam. ');
    applyLivePhoneticViaQuill(editor);
    const after = editor.getText(0, editor.getLength() - 1);
    expect(after).toContain('Netflix');
    expect(after).not.toContain('`');
    expect(after).toMatch(/సత్యం/);
  });

  it('$ prefix escape unwraps without converting', () => {
    expect(shouldKeepLiteralEnglish('$Netflix')).toBe(true);
    expect(unwrapLiteralEnglish('$Netflix')).toBe('Netflix');
    const editor = makeMockEditor('$Netflix satyam. ');
    applyLivePhoneticViaQuill(editor);
    const after = editor.getText(0, editor.getLength() - 1);
    expect(after).toContain('Netflix');
    expect(after).not.toContain('$');
    expect(after).toMatch(/సత్యం/);
  });
});

describe('applyLivePhoneticViaQuill (document integrity)', () => {
  it('converts completed roman words without rewriting unrelated offsets blindly', () => {
    const editor = makeMockEditor('CHAPTER1 satyam. ');
    applyLivePhoneticViaQuill(editor);
    const after = editor.getText(0, editor.getLength() - 1);
    expect(after.startsWith('CHAPTER1')).toBe(true);
    expect(after).toMatch(/సత్యం/);
    expect(after.indexOf('CHAPTER1')).toBe(0);
  });

  it('Telugu-first: short roman syllables convert (not frozen as English)', () => {
    // Explicit escapes still work; bare "the"/"of"/"a" convert phonetically
    expect(shouldKeepLiteralEnglish('the')).toBe(false);
    expect(shouldKeepLiteralEnglish('of')).toBe(false);
    expect(shouldKeepLiteralEnglish('a')).toBe(false);
    expect(shouldKeepLiteralEnglish('$the')).toBe(true);
    expect(shouldKeepLiteralEnglish('CHAPTER1')).toBe(true);

    const editor = makeMockEditor('a satyam ');
    applyLivePhoneticViaQuill(editor);
    const after = editor.getText(0, editor.getLength() - 1);
    expect(after).toMatch(/అ/);
    expect(after).toMatch(/సత్యం/);
  });
});

describe('everyday word fixes', () => {
  it('rupayalu and sarlu', () => {
    expect(phoneticToTelugu('rupayalu')).toBe('రూపాయలు');
    expect(phoneticToTelugu('sarlu')).toBe('సార్లు');
  });

  it('ee digraph does not stack two vowel signs', () => {
    const out = phoneticToTelugu('week');
    expect(out).not.toMatch(/ెె/);
  });
});

describe('Pramukh live model — no mid-word convert (అమ్ంఅ fix)', () => {
  it('does not convert while typing amma (doubles stay latin)', () => {
    for (const partial of ['a', 'am', 'amm', 'amma']) {
      const editor = makeMockEditor(partial);
      const result = applyLivePhoneticViaQuill(editor);
      expect(result.applied).toBe(false);
      expect(editor.getText(0, editor.getLength() - 1)).toBe(partial);
      expect(result.trailingWord).toBe(partial);
    }
  });

  it('converts amma only after space', () => {
    const editor = makeMockEditor('amma ');
    const result = applyLivePhoneticViaQuill(editor);
    expect(result.applied).toBe(true);
    expect(editor.getText(0, editor.getLength() - 1)).toBe('అమ్మ ');
    expect(result.trailingWord).toBe('');
  });

  it('keystroke sequence amma space never produces అమ్ంఅ', () => {
    const editor = makeMockEditor('');
    for (const ch of 'amma ') {
      editor.insertText(editor.getText(0, editor.getLength() - 1).length, ch);
      applyLivePhoneticViaQuill(editor);
    }
    const after = editor.getText(0, editor.getLength() - 1);
    expect(after).toBe('అమ్మ ');
    expect(after).not.toMatch(/అమ్ంఅ|అమ్మ్అ/);
  });

  it('full dialogue phrase keystroke path', () => {
    const editor = makeMockEditor('');
    for (const ch of 'ammaa ela unnavu. ') {
      editor.insertText(editor.getText(0, editor.getLength() - 1).length, ch);
      applyLivePhoneticViaQuill(editor);
    }
    const after = editor.getText(0, editor.getLength() - 1).replace(/\s+/g, ' ').trim();
    expect(after).toBe('అమ్మా ఎలా ఉన్నావు.');
  });
});

describe('commitWordAtCursorViaQuill — Space/Enter accept', () => {
  it('Space commits amma → అమ్మ + NBSP (survives HTML round-trip)', () => {
    const editor = makeMockEditor('amma');
    const ok = commitWordAtCursorViaQuill(editor, { suffix: ' ' });
    expect(ok).toBe(true);
    expect(editor.getText(0, editor.getLength() - 1)).toBe(`అమ్మ${PHONETIC_WORD_SPACE}`);
  });

  it('Space with suggestion pick uses selected form + NBSP', () => {
    const editor = makeMockEditor('ammaa');
    const ok = commitWordAtCursorViaQuill(editor, { telugu: 'అమ్మా', suffix: ' ' });
    expect(ok).toBe(true);
    expect(editor.getText(0, editor.getLength() - 1)).toBe(`అమ్మా${PHONETIC_WORD_SPACE}`);
  });

  it('Enter commits without requiring space suffix', () => {
    const editor = makeMockEditor('ela');
    const ok = commitWordAtCursorViaQuill(editor, { telugu: 'ఎలా', suffix: '' });
    expect(ok).toBe(true);
    expect(editor.getText(0, editor.getLength() - 1)).toBe('ఎలా');
  });

  it('returns false when no roman word (must not swallow Space)', () => {
    const editor = makeMockEditor(`అమ్మ${PHONETIC_WORD_SPACE}`);
    const ok = commitWordAtCursorViaQuill(editor, { suffix: ' ' });
    expect(ok).toBe(false);
    expect(editor.getText(0, editor.getLength() - 1)).toBe(`అమ్మ${PHONETIC_WORD_SPACE}`);
  });

  it('commits word before cursor mid-document and keeps following text', () => {
    const editor = makeMockEditor('అమ్మ ela more');
    const text = editor.getText(0, editor.getLength() - 1);
    const elaEnd = text.indexOf('ela') + 3;
    editor.getSelection = () => ({ index: elaEnd, length: 0 });
    const ok = commitWordAtCursorViaQuill(editor, { suffix: ' ' });
    expect(ok).toBe(true);
    const after = editor.getText(0, editor.getLength() - 1);
    expect(after).toContain(`ఎలా${PHONETIC_WORD_SPACE}`);
    expect(after).toContain('more');
  });

  it('sentence build: amma + space + ela + space keeps word breaks', () => {
    const editor = makeMockEditor('amma');
    commitWordAtCursorViaQuill(editor, { suffix: ' ' });
    // type next word after NBSP
    const cur = editor.getText(0, editor.getLength() - 1);
    editor.insertText(cur.length, 'ela');
    editor.getSelection = () => ({
      index: editor.getText(0, editor.getLength() - 1).length,
      length: 0,
    });
    commitWordAtCursorViaQuill(editor, { suffix: ' ' });
    const after = editor.getText(0, editor.getLength() - 1);
    expect(after.startsWith('అమ్మ')).toBe(true);
    expect(after).toContain('ఎలా');
    // Must NOT be glued అమ్మెలా
    expect(after).not.toMatch(/అమ్మెలా|అమ్మela/);
    expect(after.indexOf('ఎలా')).toBeGreaterThan(after.indexOf('అమ్మ') + 2);
  });

  it('preserveTrailingSpacesInHtml keeps end spaces as NBSP', () => {
    const html = '<p>అమ్మ </p>';
    const out = preserveTrailingSpacesInHtml(html);
    // browsers serialize NBSP as &nbsp; in innerHTML
    expect(out.includes('\u00A0') || out.includes('&nbsp;')).toBe(true);
    expect(out).not.toMatch(/అమ్మ<\/p>/);
  });
});
