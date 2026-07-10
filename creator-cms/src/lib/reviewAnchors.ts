import type { ReviewComment } from '../types/reviewWorkspace';

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Character offsets of a DOM Range within a container element */
export function getRangeOffsets(container: HTMLElement, range: Range): { start: number; end: number } | null {
  if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) {
    return null;
  }
  const pre = document.createRange();
  pre.selectNodeContents(container);
  pre.setEnd(range.startContainer, range.startOffset);
  const start = pre.toString().length;
  const end = start + range.toString().length;
  return { start, end };
}

export interface ResolvedAnchor {
  commentId: string;
  start: number;
  end: number;
  priority: ReviewComment['priority'];
  kind: ReviewComment['kind'];
}

export function resolveCommentOffsets(plainText: string, comment: ReviewComment): ResolvedAnchor | null {
  const anchor = comment.anchor;
  if (anchor && anchor.endOffset > anchor.startOffset && anchor.endOffset <= plainText.length) {
    return {
      commentId: comment.id,
      start: anchor.startOffset,
      end: anchor.endOffset,
      priority: comment.priority,
      kind: comment.kind,
    };
  }
  const needle = comment.selectedText || comment.evidence;
  if (needle) {
    const idx = plainText.indexOf(needle);
    if (idx >= 0) {
      return {
        commentId: comment.id,
        start: idx,
        end: idx + needle.length,
        priority: comment.priority,
        kind: comment.kind,
      };
    }
  }
  return null;
}

/** Word-style inline highlights on exact passage offsets */
export function renderHighlightedParagraphHtml(
  plainText: string,
  comments: ReviewComment[],
  activeCommentId: string | null,
): string {
  const anchors = comments
    .map((c) => resolveCommentOffsets(plainText, c))
    .filter((a): a is ResolvedAnchor => a != null)
    .sort((a, b) => a.start - b.start);

  if (!anchors.length) {
    return `<p>${escapeHtml(plainText)}</p>`;
  }

  let html = '';
  let pos = 0;
  for (const a of anchors) {
    if (a.start < pos) continue;
    html += escapeHtml(plainText.slice(pos, a.start));
    const active = a.commentId === activeCommentId ? ' rw-text-anchor--active' : '';
    const kind = a.kind === 'suggestion' ? ' rw-text-anchor--suggest' : '';
    html += `<mark class="rw-text-anchor rw-text-anchor--${a.priority}${active}${kind}" data-comment-id="${a.commentId}" tabindex="0">${escapeHtml(plainText.slice(a.start, a.end))}</mark>`;
    pos = a.end;
  }
  html += escapeHtml(plainText.slice(pos));
  return `<p>${html}</p>`;
}

export function scrollToCommentAnchor(commentId: string): void {
  const el = document.querySelector(`[data-comment-id="${commentId}"]`);
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  (el as HTMLElement | null)?.focus?.({ preventScroll: true });
}