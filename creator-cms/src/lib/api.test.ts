import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('api client', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_MOCK_MODE', 'true');
    vi.stubEnv('VITE_USE_SUPABASE_DIRECT', 'false');
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('throws a helpful message when the API is unreachable', async () => {
    const { api, setApiAuth } = await import('./api');
    setApiAuth({ id: 'test-creator', phone: '+91999', role: 'creator', display_name: 'Test' }, 'token-1');
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(api.getDashboard()).rejects.toThrow(/couldn't connect to Katha/i);
  });

  it('defaults to Node API path in mock mode', async () => {
    const { useSupabaseDirect } = await import('./api');
    expect(useSupabaseDirect()).toBe(false);
  });

  it('sends Bearer token on getCreatorStories (no spoofable identity headers)', async () => {
    const { api, setApiAuth } = await import('./api');
    setApiAuth({ id: 'test-creator', phone: '+91999', role: 'creator', display_name: 'Test' }, 'token-1');

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