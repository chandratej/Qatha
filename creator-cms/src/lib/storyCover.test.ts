import { describe, expect, it } from 'vitest';
import { isMissingOrDefaultCover, DEFAULT_STORY_COVER_PATH } from './storyCover';

describe('storyCover', () => {
  it('treats empty as missing', () => {
    expect(isMissingOrDefaultCover(null)).toBe(true);
    expect(isMissingOrDefaultCover('')).toBe(true);
    expect(isMissingOrDefaultCover('   ')).toBe(true);
  });

  it('detects default cover path', () => {
    expect(isMissingOrDefaultCover(DEFAULT_STORY_COVER_PATH)).toBe(true);
    expect(isMissingOrDefaultCover('https://app.example.com/default-story-cover.svg')).toBe(true);
  });

  it('accepts real covers', () => {
    expect(isMissingOrDefaultCover('https://cdn.example.com/covers/story-abc.jpg')).toBe(false);
  });
});
