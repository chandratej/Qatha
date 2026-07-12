import { sceneMatchesQuery } from './sceneSearch';

export interface StorySearchable {
  title: string;
  description?: string | null;
  genre?: string;
}

/** Telugu-aware story search — title & description (incl. phonetic roman input). */
export function storyMatchesQuery(story: StorySearchable, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  return sceneMatchesQuery(
    {
      title: story.title,
      content: story.description ?? '',
    },
    q,
  );
}

/** Filter stories by Telugu-aware search query. */
export function filterStoriesByQuery<T extends StorySearchable>(
  stories: T[],
  query: string,
): T[] {
  const q = query.trim();
  if (!q) return stories;
  return stories.filter((story) => storyMatchesQuery(story, q));
}