import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('eventsStore', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('lists events and registers participant in mock mode', async () => {
    const { listEvents, registerForEvent, listRegistrationsForUser } = await import(
      `./eventsStore.js?test=${Date.now()}`
    );
    const userId = `creator-${Date.now()}`;
    const events = await listEvents();
    assert.ok(events.length >= 1);

    const eventId = events[0].id;
    const result = await registerForEvent(userId, eventId);
    assert.equal(result.alreadyRegistered, false);
    assert.equal(result.registration.participant_id, userId);

    const regs = await listRegistrationsForUser(userId);
    assert.equal(regs.length, 1);
    assert.equal(regs[0].event_id, eventId);
  });

  it('submits and upserts story attachment', async () => {
    const {
      listEvents,
      registerForEvent,
      submitToEvent,
      getRegistration,
    } = await import(`./eventsStore.js?test=${Date.now()}-submit`);

    const userId = `creator-submit-${Date.now()}`;
    const events = await listEvents();
    const eventId = events[0].id;
    await registerForEvent(userId, eventId);

    const first = await submitToEvent(userId, eventId, {
      story_id: 'story-1',
      story_title: 'First Draft',
    });
    assert.equal(first.submission.story_id, 'story-1');
    assert.equal(first.registration.story_title, 'First Draft');

    const second = await submitToEvent(userId, eventId, {
      story_id: 'story-2',
      story_title: 'Revised Draft',
    });
    assert.equal(second.submission.story_id, 'story-2');

    const reg = await getRegistration(eventId, userId);
    assert.equal(reg.story_id, 'story-2');
    assert.equal(reg.story_title, 'Revised Draft');
  });

  it('rejects duplicate registration gracefully', async () => {
    const { listEvents, registerForEvent } = await import(
      `./eventsStore.js?test=${Date.now()}-dup`
    );
    const userId = `creator-dup-${Date.now()}`;
    const eventId = (await listEvents())[0].id;
    const first = await registerForEvent(userId, eventId);
    const second = await registerForEvent(userId, eventId);
    assert.equal(first.alreadyRegistered, false);
    assert.equal(second.alreadyRegistered, true);
  });
});