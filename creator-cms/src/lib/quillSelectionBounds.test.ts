import { describe, expect, it, vi } from 'vitest';
import {
  getSafeSelectionBounds,
  isOversizedSelection,
  MAX_UI_SELECTION_LENGTH,
} from './quillSelectionBounds';

describe('quillSelectionBounds', () => {
  it('returns null for empty / collapsed ranges without calling getBounds', () => {
    const getBounds = vi.fn();
    expect(getSafeSelectionBounds(getBounds, null)).toBeNull();
    expect(getSafeSelectionBounds(getBounds, { index: 0, length: 0 })).toBeNull();
    expect(getBounds).not.toHaveBeenCalled();
  });

  it('never calls getBounds with length > 0 (hang fix for double-click / Ctrl+A)', () => {
    const getBounds = vi.fn((index: number, length?: number) => {
      if ((length ?? 0) > 0) throw new Error(`unsafe getBounds(${index}, ${length})`);
      return { top: index, left: index * 2, width: 4, height: 18 };
    });

    const short = getSafeSelectionBounds(getBounds, { index: 10, length: 6 });
    expect(short).not.toBeNull();
    expect(getBounds).toHaveBeenCalledWith(10, 0);
    expect(getBounds).toHaveBeenCalledWith(15, 0);
    // Never called with positive length
    for (const call of getBounds.mock.calls) {
      expect(call[1] ?? 0).toBe(0);
    }
  });

  it('skips oversized selections entirely (Ctrl+A / long drag)', () => {
    const getBounds = vi.fn();
    const range = { index: 0, length: MAX_UI_SELECTION_LENGTH + 1 };
    expect(isOversizedSelection(range)).toBe(true);
    expect(getSafeSelectionBounds(getBounds, range)).toBeNull();
    expect(getBounds).not.toHaveBeenCalled();
  });
});
