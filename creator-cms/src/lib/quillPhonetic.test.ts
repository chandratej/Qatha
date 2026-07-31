import { describe, expect, it } from 'vitest';
import {
  applyLivePhoneticToHtml,
  convertAllPhoneticInHtml,
  isEmptyEditorHtml,
} from './quillPhonetic';

describe('placeholder protection from phonetic pipeline', () => {
  it('does not convert UI seed Start writing text', () => {
    const html = '<p>Start writing…</p>';
    expect(applyLivePhoneticToHtml(html).html).toContain('Start writing');
    expect(convertAllPhoneticInHtml(html)).toContain('Start writing');
  });

  it('still converts normal prose including punctuated anusvara words', () => {
    const { html } = applyLivePhoneticToHtml('<p>satyam. </p>');
    expect(html).toMatch(/సత్యం/);
  });

  it('unwraps backtick escape for literal English', () => {
    const { html } = applyLivePhoneticToHtml('<p>`Netflix` </p>');
    expect(html).toContain('Netflix');
    expect(html).not.toContain('`');
    // Must not have been phonetic-mangled
    expect(html).not.toMatch(/నెట్|నెట్ఫ్లిక్స్/);
  });
});

describe('isEmptyEditorHtml', () => {
  it('treats empty / blank quill shells as empty', () => {
    expect(isEmptyEditorHtml('')).toBe(true);
    expect(isEmptyEditorHtml('<p><br></p>')).toBe(true);
    expect(isEmptyEditorHtml('<p></p>')).toBe(true);
    expect(isEmptyEditorHtml('<p> </p>')).toBe(true);
  });

  it('treats real content as non-empty', () => {
    expect(isEmptyEditorHtml('<p>hello</p>')).toBe(false);
    expect(isEmptyEditorHtml('<p>సత్యం</p>')).toBe(false);
  });
});
