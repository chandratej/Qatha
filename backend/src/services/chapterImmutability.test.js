import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assertChapterEditable } from './chapterImmutability.js';

describe('chapterImmutability', () => {
  it('allows draft edits', () => {
    assert.doesNotThrow(() => assertChapterEditable('draft'));
    assert.doesNotThrow(() => assertChapterEditable('pending_review'));
  });

  it('blocks published edits', () => {
    assert.throws(() => assertChapterEditable('published'), /immutable/);
  });
});