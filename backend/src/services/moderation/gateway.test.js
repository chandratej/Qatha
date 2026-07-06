import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { moderateContent, riskScoreFromResult } from './gateway.js';
import { moderateWithHeuristic } from './providers/heuristic.js';

describe('moderation gateway', () => {
  const env = { ...process.env };

  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    process.env = { ...env };
  });

  it('moderateWithHeuristic flags repeated toxic language', () => {
    const result = moderateWithHeuristic('kill hate stupid idiot kill hate');
    assert.equal(result.isSafe, false);
    assert.match(result.flaggedReason, /toxic/i);
  });

  it('moderateWithHeuristic passes clean content', () => {
    const result = moderateWithHeuristic('A peaceful Telugu story about friendship.');
    assert.equal(result.isSafe, true);
    assert.equal(result.flaggedReason, '');
  });

  it('moderateContent uses heuristic when OPENAI_API_KEY is unset', async () => {
    const result = await moderateContent('kill hate stupid idiot kill hate');
    assert.equal(result.isSafe, false);
    assert.equal(result.source, 'heuristic');
  });

  it('riskScoreFromResult maps gateway schema to analytics score', () => {
    assert.equal(riskScoreFromResult({ isSafe: true, flaggedReason: '', source: 'heuristic' }), 0);
    assert.equal(riskScoreFromResult({ isSafe: false, flaggedReason: 'hate', source: 'openai' }), 0.85);
  });
});