export type VersionSource = 'autosave' | 'manual' | 'ai-rewrite' | 'published';

const VERSION_SOURCE_LABELS: Record<VersionSource, string> = {
  autosave: 'Autosave',
  manual: 'Manual edit',
  'ai-rewrite': 'AI rewrite',
  published: 'Published version',
};

export function versionSourceLabel(source: VersionSource = 'autosave'): string {
  return VERSION_SOURCE_LABELS[source] ?? VERSION_SOURCE_LABELS.autosave;
}