/** Resolve chapter editor path from story content type and language. */

export function chapterEditorPath(
  storyId: string,
  chapterNum: number,
  opts?: {
    contentType?: string | null;
    language?: string | null;
    seasonId?: string | null;
  },
): string {
  const contentType = opts?.contentType ?? 'serialized_story';
  const language = opts?.language ?? 'te';

  if (contentType === 'epistolary_chat') {
    return `/stories/${storyId}/epistolary/${chapterNum}`;
  }
  if (contentType === 'interactive_branching') {
    return `/stories/${storyId}/branching/${chapterNum}`;
  }
  if (language === 'en') {
    return `/stories/${storyId}/en/chapters/${chapterNum}`;
  }
  if (opts?.seasonId) {
    return `/stories/${storyId}/seasons/${opts.seasonId}/chapters/${chapterNum}`;
  }
  return `/stories/${storyId}/chapters/${chapterNum}`;
}