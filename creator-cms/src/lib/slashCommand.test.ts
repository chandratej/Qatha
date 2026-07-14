import { describe, it, expect } from 'vitest';
import { parseSlashLine, commandMatchesPrefix } from './slashCommand';

describe('parseSlashLine', () => {
  it('matches bare slash', () => {
    expect(parseSlashLine('/')).toEqual({ match: true, filter: '' });
  });

  it('matches slash with latin filter', () => {
    expect(parseSlashLine('/novel')).toEqual({ match: true, filter: 'novel' });
  });

  it('matches slash with telugu filter runes', () => {
    expect(parseSlashLine('/నవల')).toEqual({ match: true, filter: 'నవల' });
  });

  it('rejects slash mid-line', () => {
    expect(parseSlashLine('hello /novel')).toEqual({ match: false, filter: '' });
  });
});

describe('commandMatchesPrefix', () => {
  const cmd = { id: 'novel', label: 'Novel', group: 'Switch narrative mode', desc: '/novel' };

  it('matches id prefix', () => {
    expect(commandMatchesPrefix(cmd, 'nov')).toBe(true);
  });

  it('rejects substring not at start', () => {
    expect(commandMatchesPrefix(cmd, 'vel')).toBe(false);
  });
});