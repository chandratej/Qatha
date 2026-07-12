import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('msg91Email', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
    delete process.env.MSG91_AUTH_KEY;
  });

  it('mock-sends email without network', async () => {
    const { sendMsg91Email } = await import('./msg91Email.js');
    const result = await sendMsg91Email({
      to: 'reviewer@example.com',
      subject: 'SLA reminder',
      body: 'Your review is due soon.',
    });
    assert.equal(result.ok, true);
    assert.ok(result.skipped);
  });

  it('resolves mock user email', async () => {
    const { resolveUserEmail } = await import('./msg91Email.js');
    const email = await resolveUserEmail('user-abc');
    assert.equal(email, 'user-abc@mock.katha.local');
  });
});