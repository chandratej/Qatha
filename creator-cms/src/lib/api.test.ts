import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, setApiAuth } from './api';

describe('api client', () => {
  beforeEach(() => {
    setApiAuth({ id: 'test-creator', phone: '+91999', role: 'creator', display_name: 'Test' }, 'token-1');
    vi.stubGlobal('fetch', vi.fn());
  });

  it('throws a helpful message when the API is unreachable', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(api.getDashboard()).rejects.toThrow(/Cannot reach the API/);
  });

  it('sends creator auth headers on getCreatorStories', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ stories: [] }),
    } as Response);

    await api.getCreatorStories();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/creators/stories'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-creator-id': 'test-creator',
          Authorization: 'Bearer token-1',
        }),
      }),
    );
  });
});