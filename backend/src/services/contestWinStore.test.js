import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.MOCK_MODE = 'true';

const {
  stampContestWin,
  confirmEventWinners,
  assertContestSubmissionAllowed,
  getStoryContestMeta,
  _resetMockContestWins,
  _setMockStoryContestMeta,
  isWinningRank,
} = await import('./contestWinStore.js');

describe('contestWinStore (Format Spec v1)', () => {
  beforeEach(() => {
    _resetMockContestWins();
  });

  it('treats ranks 1–3 as wins', () => {
    assert.equal(isWinningRank(1), true);
    assert.equal(isWinningRank(3), true);
    assert.equal(isWinningRank(4), false);
  });

  it('stamps first win idempotently', async () => {
    const first = await stampContestWin({ storyId: 's1', eventId: 'e1', rank: 1 });
    assert.equal(first.stamped, true);
    assert.ok(first.contest_won_at);

    const second = await stampContestWin({ storyId: 's1', eventId: 'e2', rank: 1 });
    assert.equal(second.stamped, false);
    assert.equal(second.already_won, true);
  });

  it('confirmEventWinners stamps story ids', async () => {
    const out = await confirmEventWinners('evt-1', [
      { registration_id: 'r1', story_id: 'story-a', rank: 1 },
      { registration_id: 'r2', story_id: 'story-b', rank: 4 },
    ]);
    assert.equal(out.winners[0].stamp.stamped, true);
    assert.equal(out.winners[1].stamp, null);
    const meta = await getStoryContestMeta('story-a');
    assert.equal(meta.has_won_contest, true);
  });

  it('blocks re-entry after win for short story', async () => {
    _setMockStoryContestMeta('ss1', {
      contest_won_at: new Date().toISOString(),
      content_type: 'short_story',
      chapter_count: 1,
    });
    await assert.rejects(
      () => assertContestSubmissionAllowed('ss1'),
      /already won a contest/,
    );
  });

  it('blocks continuous formats under 25 chapters', async () => {
    _setMockStoryContestMeta('ser1', {
      content_type: 'serialized_story',
      chapter_count: 10,
      contest_won_at: null,
    });
    await assert.rejects(
      () => assertContestSubmissionAllowed('ser1'),
      /≥25 published chapters/,
    );
  });

  it('allows continuous formats at 25 chapters', async () => {
    _setMockStoryContestMeta('ser2', {
      content_type: 'serialized_story',
      chapter_count: 25,
      contest_won_at: null,
    });
    await assertContestSubmissionAllowed('ser2');
  });
});
