/**
 * Integration test scaffold for the creator lifecycle.
 * Full browser E2E (Playwright) can wrap these steps against a running dev stack.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, setApiAuth } from '../lib/api';

describe('creator lifecycle (API integration scaffold)', () => {
  beforeEach(() => {
    setApiAuth({ id: 'test-creator', phone: '+91999', role: 'creator', display_name: 'Test' }, 'token');
    vi.stubGlobal('fetch', vi.fn());
  });

  it('documents the happy path: create → draft → publish → moderation', async () => {
    const mockFetch = vi.mocked(fetch);

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ story: { id: 'story-new' } }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ saved: true }) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          chapter: { id: 'ch-1', status: 'pending_review' },
          moderation: { status: 'pending_review' },
        }),
      } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ queue: [{ id: 'mod-1', status: 'pending' }] }) } as Response);

    const { story } = await api.createStory({ title: 'Test Story', genre: 'romance' });
    expect(story.id).toBe('story-new');

    await api.saveDraft(story.id, {
      chapter_number: 1,
      title: 'Chapter 1',
      content: '<p>Hello world</p>',
    });

    const published = await api.publishChapter(story.id, {
      chapter_number: 1,
      title: 'Chapter 1',
      content: '<p>Hello world</p>',
    });
    expect(published).toHaveProperty('moderation');

    const { queue } = await api.getModerationQueue();
    expect(queue.length).toBeGreaterThan(0);
  });
});