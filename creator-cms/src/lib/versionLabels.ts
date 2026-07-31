export type VersionSource = 'autosave' | 'manual' | 'ai-rewrite' | 'published';

/** Labels never imply generative rewrite (Craft Moat Constitution §1). */
const VERSION_SOURCE_LABELS: Record<VersionSource, string> = {
  autosave: 'Autosave',
  manual: 'Manual edit',
  // Legacy source id retained for stored versions; display is non-generative.
  'ai-rewrite': 'Earlier edit',
  published: 'Published version',
};

export function versionSourceLabel(source: VersionSource = 'autosave'): string {
  return VERSION_SOURCE_LABELS[source] ?? VERSION_SOURCE_LABELS.autosave;
}