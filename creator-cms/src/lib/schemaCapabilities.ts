/**
 * Optional DB columns from migrations 011/012.
 * Defaults to off (no network probe) so consoles stay clean when migrations aren't applied yet.
 * Set VITE_SCHEMA_FEATURES=full after running 011 + 012 in Supabase SQL Editor.
 */
export type SchemaCapabilities = {
  storySlug: boolean;
  chapterScheduledPublishAt: boolean;
  /** chapter_drafts.status was never in schema — always false */
  chapterDraftStatus: boolean;
};

let cached: SchemaCapabilities | null = null;

export function getSchemaCapabilities(): SchemaCapabilities {
  if (cached) return cached;

  const full = import.meta.env.VITE_SCHEMA_FEATURES === 'full';
  cached = {
    storySlug: full,
    chapterScheduledPublishAt: full,
    chapterDraftStatus: false,
  };
  return cached;
}

export function resetSchemaCapabilitiesCache() {
  cached = null;
}