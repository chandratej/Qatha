import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  platformWriteRateLimit,
  resetPlatformWriteRateLimits,
} from './platformWriteRateLimit.js';

function mockReq(method = 'POST', userId = 'user-1') {
  return {
    method,
    ip: '127.0.0.1',
    headers: {},
    auth: { userId },
  };
}

function mockRes() {
  const headers = {};
  return {
    headers,
    setHeader(name, value) {
      headers[name] = value;
    },
  };
}

describe('platformWriteRateLimit', () => {
  beforeEach(() => {
    resetPlatformWriteRateLimits();
    delete process.env.SKIP_PLATFORM_RATE_LIMIT;
  });

  it('allows GET requests without counting', () => {
    const limiter = platformWriteRateLimit({ limit: 1, windowSec: 60 });
    const req = mockReq('GET');
    const res = mockRes();
    let called = false;
    limiter(req, res, () => { called = true; });
    assert.equal(called, true);
  });

  it('blocks writes after limit exceeded', () => {
    const limiter = platformWriteRateLimit({ limit: 2, windowSec: 60 });
    const req = mockReq('POST');
    const res = mockRes();

    let err;
    limiter(req, res, (e) => { err = e; });
    assert.ok(!err);

    limiter(req, res, (e) => { err = e; });
    assert.ok(!err);

    limiter(req, res, (e) => { err = e; });
    assert.ok(err);
    assert.equal(err.status, 429);
    assert.equal(err.code, 'RATE_LIMITED');
    assert.ok(res.headers['Retry-After']);
  });

  it('can be disabled via SKIP_PLATFORM_RATE_LIMIT', () => {
    process.env.SKIP_PLATFORM_RATE_LIMIT = 'true';
    const limiter = platformWriteRateLimit({ limit: 1, windowSec: 60 });
    const req = mockReq('POST');
    const res = mockRes();

    for (let i = 0; i < 5; i += 1) {
      let err;
      limiter(req, res, (e) => { err = e; });
      assert.ok(!err);
    }
  });
});