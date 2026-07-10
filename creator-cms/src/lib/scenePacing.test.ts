import { describe, expect, it } from 'vitest';
import { getScenePacing, scenePacingLabel } from './scenePacing';

describe('scenePacing', () => {
  it('labels short scenes', () => {
    expect(getScenePacing(100)).toBe('short');
    expect(scenePacingLabel('short')).toBe('Running light');
  });

  it('labels on-pace scenes', () => {
    expect(getScenePacing(400)).toBe('on-pace');
    expect(scenePacingLabel('on-pace')).toBe('On pace');
  });

  it('labels long scenes', () => {
    expect(getScenePacing(700)).toBe('long');
    expect(scenePacingLabel('long')).toBe('Running rich');
  });
});