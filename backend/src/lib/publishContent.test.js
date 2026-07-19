import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizePublishedContent,
  estimateReadTimeMinutes,
  countWordsFromContent,
  sanitizeStoryDescription,
} from './publishContent.js';

describe('sanitizePublishedContent', () => {
  it('strips background-color highlight spans', () => {
    const html =
      '<p>Hello <span style="background-color: rgb(255, 243, 205);">తెలుగు</span> world</p>';
    const out = sanitizePublishedContent(html);
    assert.equal(out.includes('background-color'), false);
    assert.equal(out.includes('<span'), false);
    assert.match(out, /తెలుగు/);
  });

  it('normalizes scene-break HR', () => {
    const html = '<p>A</p><hr class="scene-break" data-scene-break="true" /><p>B</p>';
    const out = sanitizePublishedContent(html);
    assert.match(out, /class="scene-break"/);
    assert.match(out, /data-scene-break="true"/);
  });
});

describe('estimateReadTimeMinutes', () => {
  it('uses word count not raw char length for HTML', () => {
    const words = Array.from({ length: 900 }, (_, i) => `word${i}`).join(' ');
    const html = `<p>${words}</p>`;
    const minutes = estimateReadTimeMinutes(html);
    // 900 / 180 = 5
    assert.equal(minutes, 5);
    assert.ok(minutes > 1);
  });

  it('counts plain text words', () => {
    assert.equal(countWordsFromContent('one two three'), 3);
  });
});

describe('sanitizeStoryDescription', () => {
  it('removes RRR and Rajamouli references', () => {
    const raw =
      'Inspired by RRR and director S.S. Rajamouli, this is an original tale.';
    const out = sanitizeStoryDescription(raw);
    assert.equal(/\bRRR\b/.test(out), false);
    assert.equal(/Rajamouli/i.test(out), false);
    assert.match(out, /original tale/);
  });
});
