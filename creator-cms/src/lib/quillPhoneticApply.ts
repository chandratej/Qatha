/**
 * Quill-native live phonetic conversion — PramukhIME model.
 *
 * - Active roman word stays Latin while typing (including doubles: amma, nanna).
 * - Only completed roman words (before the trailing token) are converted.
 * - Never mid-word "ottu" commit — that produced అమ్ంఅ garbage.
 * - Uses Quill Delta / delete+insert (not innerHTML) for undo + caret integrity.
 */

import Quill from 'quill';
import { getPhoneticEditState } from '../business/phoneticText';
import { phoneticToTelugu } from './phonetic';
import {
  isProtectedPlaceholderText,
  shouldKeepLiteralEnglish,
  unwrapLiteralEnglish,
} from './phoneticEscape';
import { findPhoneticTokens } from './phoneticTokens';

const Delta = Quill.import('delta');

/** Structural type for Quill — keep loose so Quill's overloaded methods assign cleanly. */
export type QuillLike = {
  getText: (index?: number, length?: number) => string;
  getLength: () => number;
  getSelection: (focus?: boolean) => { index: number; length: number } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setSelection: (...args: any[]) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deleteText: (...args: any[]) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  insertText: (...args: any[]) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateContents?: (...args: any[]) => any;
  root: HTMLElement;
};

export type LivePhoneticApplyResult = {
  applied: boolean;
  trailingWord: string;
  plainAfter: string;
};

export type Replacement = { index: number; length: number; tel: string };

/** Set while applying conversion so host onChange can ignore the echo. */
let applyingPhonetic = false;

export function isApplyingPhoneticViaQuill(): boolean {
  return applyingPhonetic;
}

/**
 * Build replacements for completed region (roman words + `backtick` unwraps).
 * Exported for unit tests.
 */
export function buildPhoneticReplacements(completed: string): Replacement[] {
  const replacements: Replacement[] = [];
  for (const tok of findPhoneticTokens(completed)) {
    const word = tok.raw;
    if (isProtectedPlaceholderText(word)) continue;

    if (shouldKeepLiteralEnglish(word)) {
      const unwrapped = unwrapLiteralEnglish(word);
      if (unwrapped !== word) {
        replacements.push({ index: tok.index, length: tok.length, tel: unwrapped });
      }
      continue;
    }

    // Already Telugu / non-latin — skip (findPhoneticTokens only yields latin, but be safe)
    if (!/[A-Za-z]/.test(word)) continue;

    const tel = phoneticToTelugu(word);
    if (tel && tel !== word) {
      replacements.push({ index: tok.index, length: tok.length, tel });
    }
  }
  return replacements;
}

/**
 * Convert completed roman words in the document using Quill APIs only.
 * Skips while IME composition is active.
 */
export function applyLivePhoneticViaQuill(
  editor: QuillLike,
  opts?: { composing?: boolean },
): LivePhoneticApplyResult {
  if (opts?.composing || applyingPhonetic) {
    return { applied: false, trailingWord: '', plainAfter: editorPlain(editor) };
  }

  if ((editor.root as HTMLElement & { isComposing?: boolean }).isComposing) {
    return { applied: false, trailingWord: '', plainAfter: editorPlain(editor) };
  }

  const len = Math.max(0, editor.getLength() - 1);
  const fullText = editor.getText(0, len);
  if (!fullText || isProtectedPlaceholderText(fullText)) {
    return { applied: false, trailingWord: '', plainAfter: fullText };
  }

  const { convertLen, trailingWord } = getPhoneticEditState(fullText);
  if (convertLen <= 0) {
    return { applied: false, trailingWord, plainAfter: fullText };
  }

  const completed = fullText.slice(0, convertLen);
  // Only latin tokens in completed region — never rewrite existing Telugu
  if (!/[A-Za-z$`]/.test(completed)) {
    return { applied: false, trailingWord, plainAfter: fullText };
  }

  const replacements = buildPhoneticReplacements(completed);
  if (replacements.length === 0) {
    return { applied: false, trailingWord, plainAfter: fullText };
  }

  const sel = editor.getSelection(true);
  let cursor = sel?.index ?? convertLen;

  for (const r of replacements) {
    if (cursor > r.index) {
      cursor += r.tel.length - r.length;
    }
  }

  // Hold the lock only for the synchronous Quill mutation + its re-entrant
  // text-change. Must clear in the same turn — queueMicrotask left the lock
  // sticky and skipped every following keystroke in the same event loop tick
  // (keystroke tests + fast typists with batched handlers).
  applyingPhonetic = true;
  try {
    applyReplacements(editor, replacements);
    const maxIdx = Math.max(0, editor.getLength() - 1);
    editor.setSelection(Math.min(Math.max(0, cursor), maxIdx), 0, 'silent');
  } finally {
    applyingPhonetic = false;
  }

  return { applied: true, trailingWord, plainAfter: editorPlain(editor) };
}

/**
 * Word-break after phonetic commit.
 * Regular ASCII space is stripped by Quill's HTML round-trip (controlled `value={html}`).
 * NBSP survives serialization and still looks/types like a normal space between words.
 */
export const PHONETIC_WORD_SPACE = '\u00A0';

/** Map Space suffix to NBSP so sentences can be built without trailing-space loss. */
export function normalizeCommitSuffix(suffix = ''): string {
  if (suffix === ' ' || suffix === 'Spacebar') return PHONETIC_WORD_SPACE;
  // Multiple spaces
  if (/^ +$/.test(suffix)) return PHONETIC_WORD_SPACE.repeat(suffix.length);
  return suffix;
}

/**
 * Convert trailing ASCII spaces in text nodes to NBSP so HTML save/load keeps them.
 * Mid-line spaces that already sit between glyphs are left alone when not trailing.
 */
export function preserveTrailingSpacesInHtml(html: string): string {
  if (!html || typeof document === 'undefined') return html;
  const div = document.createElement('div');
  div.innerHTML = html;
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node.textContent ?? '';
      if (/[ \t]+$/.test(t)) {
        node.textContent = t.replace(/[ \t]+$/g, (m) => PHONETIC_WORD_SPACE.repeat(m.length));
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      Array.from(node.childNodes).forEach(walk);
    }
  };
  walk(div);
  return div.innerHTML;
}

/**
 * Commit the roman word immediately before the caret (Pramukh Space/Enter).
 * Uses cursor position — not only document end — so mid-scene typing works.
 *
 * @param telugu If provided (suggestion pick), use it; else phoneticToTelugu(word).
 * @param suffix Appended after commit (`' '` for Space → NBSP, `'\n'` optional for Enter).
 * @returns false when there is no roman word to commit (caller must NOT preventDefault).
 */
export function commitWordAtCursorViaQuill(
  editor: QuillLike,
  opts?: { telugu?: string; suffix?: string },
): boolean {
  if (applyingPhonetic) return false;

  const docLen = Math.max(0, editor.getLength() - 1);
  const sel = editor.getSelection(true);
  const cursor = Math.min(Math.max(0, sel?.index ?? docLen), docLen);
  const before = editor.getText(0, cursor);
  // Include NBSP as a word boundary so we commit the roman token only
  const match = before.match(/[a-zA-Z]+$/);
  if (!match) return false;

  const word = match[0];
  const start = before.length - word.length;
  const tel = (opts?.telugu && opts.telugu.length > 0)
    ? opts.telugu
    : phoneticToTelugu(word);
  if (!tel) return false;
  if (tel === word && !opts?.suffix) return false;

  const insert = `${tel}${normalizeCommitSuffix(opts?.suffix ?? '')}`;

  applyingPhonetic = true;
  try {
    applyReplacements(editor, [{ index: start, length: word.length, tel: insert }]);
    editor.setSelection(start + insert.length, 0, 'silent');
  } finally {
    applyingPhonetic = false;
  }
  return true;
}

/**
 * Replace trailing roman / `escape` with a picked suggestion (Quill-native).
 * Prefers word-at-cursor; falls back to document-end token.
 * @param suffix Optional text after the suggestion (e.g. `' '` for Space-accept).
 */
export function applySuggestionViaQuill(
  editor: QuillLike,
  suggestion: string,
  suffix = '',
): boolean {
  // Cursor-aware path first (Space/Enter while typing mid-document)
  if (commitWordAtCursorViaQuill(editor, { telugu: suggestion, suffix })) {
    return true;
  }

  // Fallback: token at absolute document end
  const len = Math.max(0, editor.getLength() - 1);
  const fullText = editor.getText(0, len);
  const trailing = findTrailingClosedOrOpen(fullText);
  if (!trailing || !/[a-zA-Z]/.test(trailing)) return false;
  const start = fullText.length - trailing.length;
  const insert = suggestion + normalizeCommitSuffix(suffix);
  applyingPhonetic = true;
  try {
    applyReplacements(editor, [{ index: start, length: trailing.length, tel: insert }]);
    editor.setSelection(start + insert.length, 0, 'silent');
  } finally {
    applyingPhonetic = false;
  }
  return true;
}

/** Convert all remaining roman words (Convert-all button). */
export function convertAllRomanViaQuill(editor: QuillLike): boolean {
  const len = Math.max(0, editor.getLength() - 1);
  const fullText = editor.getText(0, len);
  if (!fullText || isProtectedPlaceholderText(fullText)) return false;

  const replacements = buildPhoneticReplacements(fullText);
  if (!replacements.length) return false;

  applyingPhonetic = true;
  try {
    applyReplacements(editor, replacements);
  } finally {
    applyingPhonetic = false;
  }
  return true;
}

/**
 * Single-delta update when possible → one Ctrl+Z undoes the whole conversion batch.
 * Falls back to per-token delete/insert if updateContents is unavailable.
 */
function applyReplacements(editor: QuillLike, replacements: Replacement[]) {
  if (!replacements.length) return;

  if (typeof editor.updateContents === 'function' && Delta) {
    const sorted = [...replacements].sort((a, b) => a.index - b.index);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let delta: any = new Delta();
    let pos = 0;
    for (const r of sorted) {
      const retain = r.index - pos;
      if (retain > 0) delta = delta.retain(retain);
      delta = delta.delete(r.length).insert(r.tel);
      pos = r.index + r.length;
    }
    editor.updateContents(delta, 'user');
    return;
  }

  for (let i = replacements.length - 1; i >= 0; i -= 1) {
    const r = replacements[i];
    editor.deleteText(r.index, r.length, 'user');
    editor.insertText(r.index, r.tel, 'user');
  }
}

function findTrailingClosedOrOpen(text: string): string {
  const m = text.match(/`[a-zA-Z][a-zA-Z0-9_\-]*`$|[a-zA-Z]+$/);
  return m ? m[0] : '';
}

function editorPlain(editor: QuillLike): string {
  return editor.getText(0, Math.max(0, editor.getLength() - 1));
}

/**
 * Build HTML snapshot for React state after Quill mutation.
 * Preserves trailing spaces (as NBSP) so controlled re-renders / saves don't
 * glue the next word onto the previous one.
 */
export function quillRootHtml(editor: QuillLike): string {
  return preserveTrailingSpacesInHtml(editor.root.innerHTML);
}
