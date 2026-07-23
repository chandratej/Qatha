import { describe, it, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  getFoundingAuthorProgramConfig,
  tryEnrollFoundingAuthor,
  getFoundingAcceleratedSharePct,
  getFoundingAccelerationForCreator,
  __resetMockFoundingEnrollmentsForTests,
} from './foundingAuthorProgram.js';

describe('foundingAuthorProgram', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });
  beforeEach(() => __resetMockFoundingEnrollmentsForTests());
  after(() => {
    delete process.env.KATHA_FOUNDING_PROGRAM_START;
    delete process.env.KATHA_FOUNDING_COHORT_SIZE;
    delete process.env.KATHA_FOUNDING_PROGRAM_WINDOW_DAYS;
    delete process.env.KATHA_FOUNDING_ACCELERATED_SHARE_PCT;
  });

  it('is unconfigured/disabled by default — no fabricated enrollment window', () => {
    delete process.env.KATHA_FOUNDING_PROGRAM_START;
    const config = getFoundingAuthorProgramConfig();
    assert.equal(config.configured, false);
    assert.equal(config.enrollment_opens_at, null);
  });

  it('never grants a lifetime or open-ended percentage — acceleration and bonus are always bounded', () => {
    const config = getFoundingAuthorProgramConfig();
    assert.ok(Number.isFinite(config.acceleration_duration_months) && config.acceleration_duration_months > 0);
    assert.ok(config.acceleration_duration_months < 999); // structurally time-boxed, never "forever"
  });

  it('refuses to enroll anyone while unconfigured', async () => {
    delete process.env.KATHA_FOUNDING_PROGRAM_START;
    const result = await tryEnrollFoundingAuthor('creator-1');
    assert.equal(result.enrolled, false);
    assert.equal(result.reason, 'program_not_configured');
  });

  it('enrolls creators once configured and open, up to the cohort cap, then stops', async () => {
    process.env.KATHA_FOUNDING_PROGRAM_START = new Date(Date.now() - 86400000).toISOString(); // opened yesterday
    process.env.KATHA_FOUNDING_PROGRAM_WINDOW_DAYS = '90';
    process.env.KATHA_FOUNDING_COHORT_SIZE = '2';

    const a = await tryEnrollFoundingAuthor('creator-a');
    const b = await tryEnrollFoundingAuthor('creator-b');
    const c = await tryEnrollFoundingAuthor('creator-c');

    assert.equal(a.enrolled, true);
    assert.equal(b.enrolled, true);
    assert.equal(c.enrolled, false);
    assert.equal(c.reason, 'cohort_full');
  });

  it('is idempotent — re-enrolling an already-enrolled creator is a no-op, not a double-count', async () => {
    process.env.KATHA_FOUNDING_PROGRAM_START = new Date(Date.now() - 86400000).toISOString();
    process.env.KATHA_FOUNDING_PROGRAM_WINDOW_DAYS = '90';
    process.env.KATHA_FOUNDING_COHORT_SIZE = '5';

    await tryEnrollFoundingAuthor('creator-x');
    const again = await tryEnrollFoundingAuthor('creator-x');
    assert.equal(again.enrolled, true);
    assert.equal(again.reason, 'already_enrolled');
  });

  it('refuses enrollment once the window has closed', async () => {
    process.env.KATHA_FOUNDING_PROGRAM_START = new Date(Date.now() - 200 * 86400000).toISOString(); // 200 days ago
    process.env.KATHA_FOUNDING_PROGRAM_WINDOW_DAYS = '90'; // closed 110 days ago
    process.env.KATHA_FOUNDING_COHORT_SIZE = '50';

    const result = await tryEnrollFoundingAuthor('creator-late');
    assert.equal(result.enrolled, false);
    assert.equal(result.reason, 'enrollment_window_closed');
  });

  it('acceleration is unset (null) until the founder configures a real elevated share pct', () => {
    delete process.env.KATHA_FOUNDING_ACCELERATED_SHARE_PCT;
    assert.equal(getFoundingAcceleratedSharePct(), null);
  });

  it('grants the accelerated share only to an enrolled creator, only while their window is active', async () => {
    process.env.KATHA_FOUNDING_PROGRAM_START = new Date(Date.now() - 86400000).toISOString();
    process.env.KATHA_FOUNDING_PROGRAM_WINDOW_DAYS = '90';
    process.env.KATHA_FOUNDING_COHORT_SIZE = '10';
    process.env.KATHA_FOUNDING_ACCELERATED_SHARE_PCT = '55';

    await tryEnrollFoundingAuthor('creator-accel');
    const accel = await getFoundingAccelerationForCreator('creator-accel');
    assert.equal(accel.accelerated_share_pct, 55);

    const notEnrolled = await getFoundingAccelerationForCreator('creator-never-enrolled');
    assert.equal(notEnrolled, null);
  });

  it('self-expires once acceleration_ends_at has passed — never a permanent grant', async () => {
    process.env.KATHA_FOUNDING_PROGRAM_START = new Date(Date.now() - 86400000).toISOString();
    process.env.KATHA_FOUNDING_PROGRAM_WINDOW_DAYS = '90';
    process.env.KATHA_FOUNDING_COHORT_SIZE = '10';
    process.env.KATHA_FOUNDING_ACCELERATION_MONTHS = '18';
    process.env.KATHA_FOUNDING_ACCELERATED_SHARE_PCT = '55';

    const enrollment = await tryEnrollFoundingAuthor('creator-expired');
    // Simulate the acceleration window having already elapsed (mock-mode record is mutable).
    enrollment.acceleration_ends_at = new Date(Date.now() - 1000).toISOString();

    const accel = await getFoundingAccelerationForCreator('creator-expired');
    assert.equal(accel, null);
    delete process.env.KATHA_FOUNDING_ACCELERATION_MONTHS;
  });
});
