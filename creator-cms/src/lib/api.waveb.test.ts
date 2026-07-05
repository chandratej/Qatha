import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Wave B routing', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('uses Supabase direct by default when mock mode is off', async () => {
    vi.stubEnv('VITE_MOCK_MODE', 'false');
    vi.stubEnv('VITE_SUPABASE_URL', 'https://real-project.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'real-key');
    const { useSupabaseDirect } = await import('./api');
    expect(useSupabaseDirect()).toBe(true);
  });

  it('uses Node API when mock mode is on', async () => {
    vi.stubEnv('VITE_MOCK_MODE', 'true');
    const { useSupabaseDirect } = await import('./api');
    expect(useSupabaseDirect()).toBe(false);
  });

  it('respects VITE_USE_SUPABASE_DIRECT=false override', async () => {
    vi.stubEnv('VITE_MOCK_MODE', 'false');
    vi.stubEnv('VITE_SUPABASE_URL', 'https://real-project.supabase.co');
    vi.stubEnv('VITE_USE_SUPABASE_DIRECT', 'false');
    const { useSupabaseDirect } = await import('./api');
    expect(useSupabaseDirect()).toBe(false);
  });
});