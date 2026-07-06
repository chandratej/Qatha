import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

describe('mockMode', () => {
  const env = { ...process.env };

  beforeEach(() => {
    delete process.env.MOCK_MODE;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  afterEach(() => {
    process.env = { ...env };
  });

  it('respects explicit MOCK_MODE=false even without credentials', async () => {
    process.env.MOCK_MODE = 'FALSE';
    const { isMockMode } = await import(`./mockMode.js?test=${Date.now()}`);
    assert.equal(isMockMode(), false);
  });

  it('auto-enables mock mode when credentials are missing and flag is unset', async () => {
    const { isMockMode } = await import(`./mockMode.js?test=${Date.now()}`);
    assert.equal(isMockMode(), true);
  });
});