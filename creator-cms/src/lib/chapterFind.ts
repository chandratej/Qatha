import { phoneticToTelugu } from './phonetic';
import { queryVariants } from './sceneSearch';

export type FindField = 'title' | 'content';

export interface ChapterFindMatch {
  sceneId: string;
  sceneIndex: number;
  field: FindField;
  start: number;
  end: number;
  needle: string;
}

export interface ChapterFindScene {
  id: string;
  title: string;
  content: string;
}

export function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function fold(text: string): string {
  return text.toLocaleLowerCase('en');
}

function findInHaystack(
  haystack: string,
  variants: string[],
): Array<{ start: number; end: number; needle: string }> {
  if (!haystack) return [];
  const folded = fold(haystack);
  const results: Array<{ start: number; end: number; needle: string }> = [];
  const seen = new Set<string>();

  for (const variant of variants) {
    if (!variant) continue;
    let pos = 0;
    while (pos < folded.length) {
      const idx = folded.indexOf(variant, pos);
      if (idx === -1) break;
      const key = `${idx}:${idx + variant.length}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          start: idx,
          end: idx + variant.length,
          needle: haystack.slice(idx, idx + variant.length),
        });
      }
      pos = idx + 1;
    }
  }

  return results.sort((a, b) => a.start - b.start);
}

/** Telugu-aware find across all scenes in the current chapter. */
export function findInChapter(scenes: ChapterFindScene[], query: string): ChapterFindMatch[] {
  const q = query.trim();
  if (!q) return [];

  const variants = queryVariants(q);
  const matches: ChapterFindMatch[] = [];

  scenes.forEach((scene, sceneIndex) => {
    const titleHay = scene.title || '';
    findInHaystack(titleHay, variants).forEach((m) => {
      matches.push({ sceneId: scene.id, sceneIndex, field: 'title', ...m });
    });

    const contentHay = stripHtml(scene.content);
    findInHaystack(contentHay, variants).forEach((m) => {
      matches.push({ sceneId: scene.id, sceneIndex, field: 'content', ...m });
    });
  });

  return matches;
}

/** Map plain-text offset in stripped content to Quill document index. */
export function plainOffsetToQuillIndex(quillText: string, plainOffset: number): number {
  const target = Math.max(0, plainOffset);
  let plainPos = 0;
  for (let i = 0; i < quillText.length; i++) {
    if (plainPos === target) return i;
    const ch = quillText[i];
    if (ch !== '\n' || (i > 0 && quillText[i - 1] !== '\n')) {
      plainPos += 1;
    }
  }
  return quillText.length;
}

interface QuillLike {
  getText: () => string;
  getLength: () => number;
  setSelection: (index: number, length?: number, source?: unknown) => void;
  formatText: (index: number, length: number, format: string, value: unknown, source?: unknown) => void;
}

export interface QuillFindRange {
  start: number;
  length: number;
}

/** Highlight matches in Quill content. Selection is optional so find input keeps focus. */
export function applyContentFindInQuill(
  editor: QuillLike,
  scenePlain: string,
  matches: ChapterFindMatch[],
  active: ChapterFindMatch | null,
  options?: { selectActive?: boolean },
): QuillFindRange | null {
  const length = editor.getLength();
  editor.formatText(0, Math.max(0, length - 1), 'background', false, 'silent');

  const quillText = editor.getText();
  const foldedQuill = fold(quillText);
  const contentMatches = matches.filter((m) => m.field === 'content');
  const activeRange = contentMatches.reduce<QuillFindRange | null>((found, match) => {
    const idx = locateNeedleIndex(foldedQuill, fold(match.needle), scenePlain, match);
    if (idx < 0) return found;
    const start = plainOffsetToQuillIndex(quillText, idx);
    const isActive = active?.sceneId === match.sceneId
      && active?.field === 'content'
      && active.start === match.start;
    editor.formatText(
      start,
      match.needle.length,
      'background',
      isActive ? '#FCD34D' : '#FFF3CD',
      'silent',
    );
    if (isActive) return { start, length: match.needle.length };
    return found;
  }, null);

  if (options?.selectActive && activeRange) {
    editor.setSelection(activeRange.start, activeRange.length, 'silent');
  }

  return activeRange;
}

function locateNeedleIndex(
  foldedHaystack: string,
  foldedNeedle: string,
  scenePlain: string,
  match: ChapterFindMatch,
): number {
  if (!foldedNeedle) return -1;
  const before = scenePlain.slice(0, match.start);
  const occurrence = findOccurrenceIndex(before, match.needle);
  let from = 0;
  let found = 0;
  while (found <= occurrence) {
    const idx = foldedHaystack.indexOf(foldedNeedle, from);
    if (idx === -1) return -1;
    if (found === occurrence) return idx;
    found += 1;
    from = idx + 1;
  }
  return -1;
}

function findOccurrenceIndex(before: string, needle: string): number {
  if (!needle) return 0;
  const foldedBefore = fold(before);
  const foldedNeedle = fold(needle);
  let count = 0;
  let from = 0;
  while (from < foldedBefore.length) {
    const idx = foldedBefore.indexOf(foldedNeedle, from);
    if (idx === -1) break;
    count += 1;
    from = idx + foldedNeedle.length;
  }
  return count;
}

export function replaceInSceneTitle(title: string, match: ChapterFindMatch, replacement: string): string {
  return title.slice(0, match.start) + replacement + title.slice(match.end);
}

/** Replace within HTML content while preserving surrounding markup. */
export function replaceInSceneContent(html: string, match: ChapterFindMatch, replacement: string): string {
  if (match.field !== 'content') return html;
  const div = document.createElement('div');
  div.innerHTML = html || '';
  let pos = 0;
  let replaced = false;

  const walk = (node: Node) => {
    if (replaced) return;
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      const nodeStart = pos;
      const nodeEnd = pos + text.length;
      if (match.start >= nodeStart && match.end <= nodeEnd) {
        const localStart = match.start - nodeStart;
        const localEnd = match.end - nodeStart;
        node.textContent = text.slice(0, localStart) + replacement + text.slice(localEnd);
        replaced = true;
      }
      pos = nodeEnd;
      return;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      if ((node as HTMLElement).tagName === 'BR') {
        pos += 1;
      }
      node.childNodes.forEach(walk);
    }
  };

  walk(div);
  return replaced ? div.innerHTML : html;
}

export function replaceAllInChapter(
  scenes: ChapterFindScene[],
  query: string,
  replacement: string,
): ChapterFindScene[] {
  const q = query.trim();
  if (!q) return scenes;

  return scenes.map((scene) => {
    let title = scene.title;
    let content = scene.content;
    const sceneMatches = findInChapter([scene], q)
      .filter((m) => m.sceneId === scene.id)
      .sort((a, b) => {
        if (a.field !== b.field) return a.field === 'content' ? 1 : -1;
        return b.start - a.start;
      });

    for (const match of sceneMatches) {
      if (match.field === 'title') {
        title = replaceInSceneTitle(title, match, replacement);
      } else {
        content = replaceInSceneContent(content, match, replacement);
      }
    }

    return { ...scene, title, content };
  });
}

/** Recompute match positions after a single replace (query unchanged). */
export function phoneticNeedleVariants(word: string): string[] {
  return queryVariants(word);
}

export { phoneticToTelugu };