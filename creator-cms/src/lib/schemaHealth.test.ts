import { describe, it, expect } from 'vitest';
import { isSchemaMissingError, isMissingColumnError } from './schemaHealth';

describe('schemaHealth', () => {
  it('detects missing table errors', () => {
    expect(isSchemaMissingError({ message: 'relation "profiles" does not exist', code: '42P01', details: '', hint: '', name: 'PostgrestError' })).toBe(true);
    expect(isSchemaMissingError({ message: 'Could not find the table', code: 'PGRST205', details: '', hint: '', name: 'PostgrestError' })).toBe(true);
  });

  it('detects missing column errors', () => {
    expect(isMissingColumnError({ message: 'column email does not exist', code: '42703', details: '', hint: '', name: 'PostgrestError' })).toBe(true);
  });
});