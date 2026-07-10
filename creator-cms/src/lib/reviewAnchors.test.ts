import { describe, expect, it } from 'vitest';
import { renderHighlightedParagraphHtml, resolveCommentOffsets } from './reviewAnchors';
import type { ReviewComment } from '../types/reviewWorkspace';

function mockComment(partial: Partial<ReviewComment>): ReviewComment {
  return {
    id: 'cmt-1',
    kind: 'comment',
    chapterNum: 1,
    paragraphIndex: 0,
    category: 'plot',
    priority: 'medium',
    reason: 'Test',
    recommendation: '',
    expectedImpact: '',
    reviewerConfidence: 80,
    relatedCommentIds: [],
    status: 'open',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  };
}

describe('reviewAnchors', () => {
  it('resolves offsets from anchor', () => {
    const plain = 'The village slept beneath monsoon clouds.';
    const c = mockComment({
      anchor: {
        chapterNum: 1,
        sceneId: 's1',
        paragraphIndex: 0,
        startOffset: 4,
        endOffset: 11,
        selectedText: 'village',
      },
    });
    expect(resolveCommentOffsets(plain, c)).toEqual({
      commentId: 'cmt-1',
      start: 4,
      end: 11,
      priority: 'medium',
      kind: 'comment',
    });
  });

  it('renders inline highlight markup', () => {
    const plain = 'The village slept.';
    const html = renderHighlightedParagraphHtml(plain, [
      mockComment({
        anchor: {
          chapterNum: 1,
          sceneId: 's1',
          paragraphIndex: 0,
          startOffset: 4,
          endOffset: 11,
          selectedText: 'village',
        },
      }),
    ], null);
    expect(html).toContain('rw-text-anchor');
    expect(html).toContain('village');
    expect(html).toContain('data-comment-id="cmt-1"');
  });
});