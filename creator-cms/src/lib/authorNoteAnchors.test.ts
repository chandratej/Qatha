import { describe, it, expect } from 'vitest';
import { resolveAuthorCommentOffsets } from './authorNoteAnchors';
import type { StoryAuthorComment } from '../../../packages/shared/collaboration';

function comment(partial: Partial<StoryAuthorComment>): StoryAuthorComment {
  return {
    id: 'c1',
    story_id: 's1',
    chapter_number: 1,
    scene_id: 'scene-1',
    body: 'note',
    status: 'open',
    ...partial,
  };
}

describe('authorNoteAnchors', () => {
  const plain = 'The village was quiet at dawn.';

  it('resolves stored offsets', () => {
    const a = resolveAuthorCommentOffsets(plain, comment({ start_offset: 4, end_offset: 11 }));
    expect(a).toEqual({ commentId: 'c1', start: 4, end: 11 });
  });

  it('falls back to selected_text', () => {
    const a = resolveAuthorCommentOffsets(plain, comment({ selected_text: 'village' }));
    expect(a?.start).toBe(4);
    expect(a?.end).toBe(11);
  });
});