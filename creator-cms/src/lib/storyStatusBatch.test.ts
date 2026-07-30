import { describe, expect, it } from 'vitest';
import { attachBatchedStoryStatuses, groupStatusRowsByStoryId } from './storyStatusBatch';

describe('storyStatusBatch', () => {
  it('groups rows by story_id and defaults missing status to draft', () => {
    const map = groupStatusRowsByStoryId([
      { story_id: 'a', status: 'published' },
      { story_id: 'a', status: null },
      { story_id: 'b', chapter_number: 1 },
    ]);
    expect(map.get('a')).toEqual([{ status: 'published' }, { status: 'draft' }]);
    expect(map.get('b')).toEqual([{ status: 'draft' }]);
  });

  it('derives moderation_status from a single batched chapter+draft set (no N+1)', () => {
    const stories = [
      { id: 's1', title: 'One', genre: 'romance', chapter_count: 0, total_readers: 0 },
      { id: 's2', title: 'Two', genre: 'thriller', chapter_count: 2, total_readers: 5 },
      { id: 's3', title: 'Empty', genre: 'romance', chapter_count: 0, total_readers: 0 },
    ];
    const chapters = [
      { story_id: 's1', status: 'published' },
      { story_id: 's2', status: 'draft' },
    ];
    const drafts = [
      { story_id: 's1', status: 'draft' },
      { story_id: 's2', status: 'pending_review' },
    ];

    const out = attachBatchedStoryStatuses(stories, chapters, drafts);
    expect(out).toHaveLength(3);
    // s1: published + draft → published
    expect(out.find((s) => s.id === 's1')?.moderation_status).toBe('published');
    // s2: draft + pending_review → pending_review
    expect(out.find((s) => s.id === 's2')?.moderation_status).toBe('pending_review');
    // s3: empty → draft
    expect(out.find((s) => s.id === 's3')?.moderation_status).toBe('draft');
  });

  it('floors chapter_count with observed chapter+draft rows', () => {
    const out = attachBatchedStoryStatuses(
      [{ id: 's1', title: 'T', genre: 'romance', chapter_count: 0, total_readers: 0 }],
      [],
      [
        { story_id: 's1', chapter_number: 1 },
        { story_id: 's1', chapter_number: 2 },
      ],
    );
    expect(out[0].chapter_count).toBe(2);
  });
});
