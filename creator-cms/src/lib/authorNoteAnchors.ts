import type { StoryAuthorComment } from '../../../packages/shared/collaboration';

export interface ResolvedAuthorAnchor {
  commentId: string;
  start: number;
  end: number;
}

export function resolveAuthorCommentOffsets(
  plainText: string,
  comment: StoryAuthorComment,
): ResolvedAuthorAnchor | null {
  if (
    comment.start_offset != null
    && comment.end_offset != null
    && comment.end_offset > comment.start_offset
    && comment.end_offset <= plainText.length
  ) {
    return {
      commentId: comment.id,
      start: comment.start_offset,
      end: comment.end_offset,
    };
  }
  const needle = comment.selected_text?.trim();
  if (needle) {
    const idx = plainText.indexOf(needle);
    if (idx >= 0) {
      return { commentId: comment.id, start: idx, end: idx + needle.length };
    }
  }
  return null;
}

type QuillHighlightEditor = {
  getText: () => string;
  getLength: () => number;
  formatText: (index: number, length: number, name: string, value: string, source?: string) => void;
  removeFormat: (index: number, length: number, name: string, source?: string) => void;
};

/** Clear Quill background highlights applied for author-note anchors */
export function clearAuthorNoteHighlights(editor: QuillHighlightEditor) {
  const len = editor.getLength();
  // Full-document removeFormat is expensive on long chapters — skip empty docs.
  if (len > 1) editor.removeFormat(0, len - 1, 'background', 'api');
}

/** Word-style inline highlights for anchored author notes in the active scene */
export function applyAuthorNoteHighlights(
  editor: QuillHighlightEditor,
  comments: StoryAuthorComment[],
  sceneId: string,
  activeCommentId: string | null,
) {
  const sceneComments = comments.filter(
    (c) => c.scene_id === sceneId && c.status !== 'resolved',
  );
  // Avoid full-document format clear when there is nothing to draw (common case).
  if (sceneComments.length === 0) return;

  clearAuthorNoteHighlights(editor);
  const plainText = editor.getText();

  for (const comment of sceneComments) {
    const anchor = resolveAuthorCommentOffsets(plainText, comment);
    if (!anchor) continue;
    const length = anchor.end - anchor.start;
    if (length <= 0) continue;
    // Cap highlight span — runaway offsets must not format tens of thousands of chars
    const safeLen = Math.min(length, 500);
    const color = comment.id === activeCommentId ? '#fde68a' : '#fef9c3';
    editor.formatText(anchor.start, safeLen, 'background', color, 'api');
  }
}

export function scrollToAuthorNoteAnchor(
  editor: {
    getText: () => string;
    setSelection: (index: number, length: number, source?: string) => void;
    getBounds: (index: number) => { top: number; left: number; height: number };
  },
  scrollContainer: HTMLElement | null,
  comment: StoryAuthorComment,
): boolean {
  const plainText = editor.getText();
  const anchor = resolveAuthorCommentOffsets(plainText, comment);
  if (!anchor) return false;

  const length = anchor.end - anchor.start;
  editor.setSelection(anchor.start, length, 'api');

  if (scrollContainer) {
    const bounds = editor.getBounds(anchor.start);
    const editorRect = scrollContainer.getBoundingClientRect();
    scrollContainer.scrollTop += bounds.top - editorRect.height * 0.35;
  }
  return true;
}