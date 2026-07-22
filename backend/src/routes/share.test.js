import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildShareHtml, PUBLIC_WEB_BASE } from './share.js';

describe('buildShareHtml', () => {
  it('emits og:title/description/image/url for a found chapter', () => {
    const html = buildShareHtml({
      storyId: 'story-001',
      chapterNumber: 3,
      storyTitle: 'మనసులో మిగిలిన మాట',
      chapterTitle: 'అధ్యాయం మూడు',
      hook: 'ఒక ప్రేమ కథ.',
      coverUrl: 'https://example.com/cover.jpg',
      found: true,
    });

    assert.match(html, /<meta property="og:title" content="మనసులో మిగిలిన మాట — అధ్యాయం మూడు" \/>/);
    assert.match(html, /<meta property="og:description" content="ఒక ప్రేమ కథ\." \/>/);
    assert.match(html, /<meta property="og:image" content="https:\/\/example\.com\/cover\.jpg" \/>/);
    assert.match(html, new RegExp(`og:url" content="${PUBLIC_WEB_BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/s/story-001/3"`));
    assert.match(html, /href="katha:\/\/s\/story-001\/3"/);
  });

  it('falls back to a chapter number label when the chapter has no title', () => {
    const html = buildShareHtml({
      storyId: 'story-001',
      chapterNumber: 2,
      storyTitle: 'Title',
      chapterTitle: undefined,
      hook: 'hook',
      coverUrl: null,
      found: true,
    });
    assert.match(html, /<title>Title — Chapter 2<\/title>/);
    assert.doesNotMatch(html, /og:image/);
  });

  it('escapes HTML-sensitive characters in story data', () => {
    const html = buildShareHtml({
      storyId: 's1',
      chapterNumber: 1,
      storyTitle: '<script>alert(1)</script>',
      chapterTitle: null,
      hook: 'a & b',
      coverUrl: null,
      found: true,
    });
    assert.ok(!html.includes('<script>alert(1)</script>'));
    assert.match(html, /&lt;script&gt;/);
    assert.match(html, /a &amp; b/);
  });

  it('renders a generic fallback card when the story/chapter is not found', () => {
    const html = buildShareHtml({ found: false });
    assert.match(html, /<meta property="og:title" content="కథ — Katha" \/>/);
    assert.doesNotMatch(html, /katha:\/\/s\//);
  });
});
