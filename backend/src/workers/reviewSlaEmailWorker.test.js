import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('reviewSlaEmailWorker', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('runs without error and exposes email queue', async () => {
    const worker = await import(`./reviewSlaEmailWorker.js?test=${Date.now()}`);
    const result = await worker.runReviewSlaEmailWorker();
    assert.ok(typeof result.review_escalated === 'number');
    assert.ok(typeof result.accept_escalated === 'number');
    assert.ok(typeof result.email_enqueued === 'number');
    assert.ok(typeof result.email_delivered === 'number');
    const queue = worker.getEmailEscalationQueue();
    assert.ok(Array.isArray(queue));
  });

  it('flushes queued emails in mock mode', async () => {
    const worker = await import(`./reviewSlaEmailWorker.js?flush=${Date.now()}`);
    worker.enqueueEmailEscalation({
      assignmentId: 'asgn-1',
      userId: 'user-1',
      kind: 'review_due',
      body: 'Due soon',
    });
    const flush = await worker.flushEmailEscalationQueue();
    assert.ok(flush.sent >= 1);
    const queue = worker.getEmailEscalationQueue({ status: undefined });
    assert.ok(queue.some((q) => q.status === 'mock_sent' || q.status === 'sent'));
  });

  it('requeues failed emails up to max retries', async () => {
    const worker = await import(`./reviewSlaEmailWorker.js?retry=${Date.now()}`);
    const row = worker.enqueueEmailEscalation({
      assignmentId: 'asgn-retry',
      userId: 'user-retry',
      kind: 'accept_due',
      body: 'Retry me',
    });
    row.status = 'failed';
    row.retry_count = 0;
    const requeued = worker.requeueRetryableEmails();
    assert.equal(requeued, 1);
    assert.equal(row.status, 'queued');
  });
});