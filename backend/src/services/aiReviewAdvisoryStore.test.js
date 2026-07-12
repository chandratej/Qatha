import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('aiReviewAdvisoryStore', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
    delete process.env.ADVISORY_AI_ENABLED;
    delete process.env.XAI_API_KEY;
  });

  it('generates heuristic advisory suggestions for assignment', async () => {
    const peer = await import('./peerReviewStore.js');
    const advisory = await import('./aiReviewAdvisoryStore.js');

    const authorId = `author-ai-${Date.now()}`;
    const { request } = await peer.createPeerReviewRequest(authorId, {
      storyId: `story-ai-${Date.now()}`,
      storyTitle: 'Advisory Test',
      mode: 'volunteer',
      packageFeeInr: 0,
      storyGenre: 'romance',
    });
    const assignments = await peer.listAssignmentsForSlot('slot-1');
    const assignment = assignments.find((a) => a.request_id === request.id);
    assert.ok(assignment);

    const first = await advisory.ensureAdvisorySuggestions(assignment.id, assignment.reviewer_slot);
    assert.ok(first.generated);
    assert.ok(first.suggestions.length >= 2);

    const second = await advisory.ensureAdvisorySuggestions(assignment.id, assignment.reviewer_slot);
    assert.equal(second.generated, false);
    assert.equal(second.suggestions.length, first.suggestions.length);
  });

  it('records accept and ignore responses', async () => {
    const peer = await import('./peerReviewStore.js');
    const advisory = await import('./aiReviewAdvisoryStore.js');

    const authorId = `author-ai2-${Date.now()}`;
    const { request } = await peer.createPeerReviewRequest(authorId, {
      storyId: `story-ai2-${Date.now()}`,
      storyTitle: 'Respond Test',
      mode: 'volunteer',
      packageFeeInr: 0,
      storyGenre: 'literary',
    });
    const assignments = await peer.listAssignmentsForSlot('slot-1');
    const assignment = assignments.find((a) => a.request_id === request.id);
    assert.ok(assignment);
    const { suggestions } = await advisory.ensureAdvisorySuggestions(assignment.id, assignment.reviewer_slot);
    const pending = suggestions.find((s) => s.status === 'pending');
    assert.ok(pending);

    const accepted = await advisory.respondToAdvisorySuggestion(pending.id, 'accepted');
    assert.equal(accepted.status, 'accepted');
    assert.ok(accepted.resolved_at);
  });
});