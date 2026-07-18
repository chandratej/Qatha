import { describe, it, expect } from 'vitest';
import {
  friendlyFeatureError,
  isSchemaTableMissingMessage,
  mapApiError,
  SCHEMA_FEATURE_PENDING,
} from './errors';

describe('errors', () => {
  it('detects missing table messages', () => {
    expect(isSchemaTableMissingMessage("Could not find the table 'public.media_assets'")).toBe(true);
    expect(isSchemaTableMissingMessage('relation "story_characters" does not exist')).toBe(true);
    expect(isSchemaTableMissingMessage(SCHEMA_FEATURE_PENDING)).toBe(true);
    expect(isSchemaTableMissingMessage('Network error')).toBe(false);
  });

  it('maps API errors without leaking table names', () => {
    expect(
      mapApiError({ message: "Could not find the table 'public.media_assets' in the schema cache" }),
    ).toBe(SCHEMA_FEATURE_PENDING);
  });

  it('friendlyFeatureError sanitizes schema errors', () => {
    expect(friendlyFeatureError("Could not find the table 'public.media_assets'")).toBe(SCHEMA_FEATURE_PENDING);
    expect(friendlyFeatureError('Upload failed')).toBe('Upload failed');
  });
});