import { describe, it, expect } from 'vitest';
import { aggregateScenesToHtml, scenesFromChapterPayload } from './sceneUtils';

describe('sceneUtils', () => {
  it('aggregates scenes with scene-break hr', () => {
    const html = aggregateScenesToHtml([
      { id: '1', title: 'A', content: '<p>One</p>' },
      { id: '2', title: 'B', content: '<p>Two</p>' },
    ]);
    expect(html).toContain('<p>One</p>');
    expect(html).toContain('scene-break');
    expect(html).toContain('<p>Two</p>');
  });

  it('parses content_delta scenes', () => {
    const scenes = scenesFromChapterPayload({
      content_delta: {
        scenes: [{ id: 's1', title: 'Open', content: '<p>Hi</p>' }],
      },
    });
    expect(scenes).toHaveLength(1);
    expect(scenes[0].title).toBe('Open');
  });

  it('splits aggregated html back into scenes', () => {
    const content = '<p>A</p><hr class="scene-break" data-scene-break="true" /><p>B</p>';
    const scenes = scenesFromChapterPayload({ content });
    expect(scenes).toHaveLength(2);
    expect(scenes[0].content).toContain('A');
    expect(scenes[1].content).toContain('B');
  });
});