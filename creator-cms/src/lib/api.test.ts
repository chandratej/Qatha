import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, setApiAuth, useSupabaseDirect } from './api';

describe('api client', () => {
  beforeEach(() => {
    setApiAuth({ id: 'test-creator', phone: '+91999', role: 'creator', display_name: 'Test' }, 'token-1');
    vi.stubGlobal('fetch', vi.fn());
  });

  it('throws a helpful message when the API is unreachable', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(api.getDashboard()).rejects.toThrow(/Cannot reach the API/);
  });

  it('defaults to Node API path in mock mode', () => {
    expect(useSupabaseDirect()).toBe(false);
  });

  it('sends Bearer token on getCreatorStories (no spoofable identity headers)', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ stories: [] }),
    } as Response);

    await api.getCreatorStories();

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer token-1');
    expect(headers['x-creator-id']).toBeUndefined();
    expect(headers['x-user-id']).toBeUndefined();
  });
});