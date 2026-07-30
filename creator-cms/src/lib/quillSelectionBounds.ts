/**
 * Quill selection helpers that never freeze the main thread.
 *
 * Quill's getBounds(index, length) walks every character in the range.
 * That freezes the editor on:
 * - Ctrl+A (full document)
 * - Triple-click (paragraph)
 * - Double-click on long Telugu tokens / drag-select
 * - Any multi-hundred-char selection
 *
 * Selection UI only needs an anchor point — use caret-style getBounds(index, 0)
 * plus a second sample at the end for short ranges.
 */

/** Selections longer than this skip bounds entirely (no floating chip). */
export const MAX_UI_SELECTION_LENGTH = 120;

export type QuillRange = { index: number; length: number };

export type BoundsLike = {
  top: number;
  left: number;
  width: number;
  height: number;
};

/**
 * Safe bounds for selection UI. Never calls getBounds(index, length>0).
 * Returns null for empty / oversized ranges (Ctrl+A, long drag).
 */
export function getSafeSelectionBounds(
  getBounds: (index: number, length?: number) => BoundsLike | null | undefined,
  range: QuillRange | null | undefined,
  maxLength: number = MAX_UI_SELECTION_LENGTH,
): BoundsLike | null {
  if (!range || range.length <= 0) return null;
  if (range.length > maxLength) return null;

  // Always sample a single index — O(1) relative to selection size.
  const start = getBounds(range.index, 0);
  if (!start) return null;

  if (range.length <= 1) {
    return {
      top: start.top,
      left: start.left,
      width: Math.max(start.width || 2, 8),
      height: start.height || 18,
    };
  }

  const endIndex = range.index + range.length - 1;
  const end = getBounds(endIndex, 0) ?? start;
  const top = Math.min(start.top, end.top);
  const bottom = Math.max(start.top + (start.height || 18), end.top + (end.height || 18));
  const left = Math.min(start.left, end.left);
  const right = Math.max(start.left + (start.width || 8), end.left + (end.width || 8));

  return {
    top,
    left,
    width: Math.max(8, right - left),
    height: Math.max(start.height || 18, bottom - top),
  };
}

/** True when the selection is too large for annotation UI (select-all / long drag). */
export function isOversizedSelection(
  range: QuillRange | null | undefined,
  maxLength: number = MAX_UI_SELECTION_LENGTH,
): boolean {
  return Boolean(range && range.length > maxLength);
}

/**
 * Schedule work on the next animation frame; coalesces bursts (drag-select,
 * double-click selection-change storms).
 */
export function createRafScheduler(fn: () => void): {
  schedule: () => void;
  cancel: () => void;
} {
  let id: number | null = null;
  return {
    schedule: () => {
      if (id != null) return;
      id = window.requestAnimationFrame(() => {
        id = null;
        fn();
      });
    },
    cancel: () => {
      if (id != null) {
        window.cancelAnimationFrame(id);
        id = null;
      }
    },
  };
}
