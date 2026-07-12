import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('collaborationStore', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('lists members and manages tasks', async () => {
    const {
      listStoryMembers,
      createCollaborationTask,
      listCollaborationTasks,
      updateCollaborationTask,
    } = await import(`./collaborationStore.js?test=${Date.now()}`);

    const storyId = `story-collab-${Date.now()}`;
    const userId = 'creator-1';
    const members = await listStoryMembers(storyId);
    assert.equal(members[0].role, 'owner');

    const task = await createCollaborationTask(storyId, userId, {
      title: 'Proofread Chapter 3',
      assignee_label: 'Editor',
    });
    assert.equal(task.status, 'open');

    const done = await updateCollaborationTask(storyId, task.id, { status: 'done' });
    assert.equal(done.status, 'done');

    const tasks = await listCollaborationTasks(storyId);
    assert.equal(tasks.length, 1);
  });
});