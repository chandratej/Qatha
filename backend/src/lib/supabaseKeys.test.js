import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { getPublishableKey, getSecretKey, isPlaceholderKey } from './supabaseKeys.js';

describe('supabaseKeys', () => {
  const env = { ...process.env };

  beforeEach(() => {
    delete process.env.SUPABASE_PUBLISHABLE_KEYS;
    delete process.env.SUPABASE_SECRET_KEYS;
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  afterEach(() => {
    process.env = { ...env };
  });

  it('prefers publishable key over legacy anon', () => {
    process.env.SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_new';
    process.env.SUPABASE_ANON_KEY = 'legacy-anon';
    assert.equal(getPublishableKey(), 'sb_publishable_new');
  });

  it('falls back to legacy anon when publishable is unset', () => {
    process.env.SUPABASE_ANON_KEY = 'legacy-anon';
    assert.equal(getPublishableKey(), 'legacy-anon');
  });

  it('reads publishable key from JSON env map', () => {
    process.env.SUPABASE_PUBLISHABLE_KEYS = JSON.stringify({ default: 'sb_publishable_map' });
    assert.equal(getPublishableKey(), 'sb_publishable_map');
  });

  it('prefers secret key over legacy service_role', () => {
    process.env.SUPABASE_SECRET_KEY = 'sb_secret_new';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'legacy-service';
    assert.equal(getSecretKey(), 'sb_secret_new');
  });

  it('detects placeholder keys', () => {
    assert.equal(isPlaceholderKey('your-secret-key'), true);
    assert.equal(isPlaceholderKey('sb_secret_abc'), false);
  });
});