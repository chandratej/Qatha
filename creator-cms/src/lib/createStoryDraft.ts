const DRAFT_KEY = 'katha-create-story-draft';

export interface CreateStoryDraft {
  title: string;
  description: string;
  contentType: string;
  genre: string;
  secondaryGenres: string[];
  ageRating: string;
  language: string;
  storyStatus: string;
  setting: string;
  themes: string;
  selectedTags: string[];
  schedule: string;
  savedAt: number;
}

export function loadCreateStoryDraft(): CreateStoryDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CreateStoryDraft;
  } catch {
    return null;
  }
}

export function saveCreateStoryDraft(draft: Omit<CreateStoryDraft, 'savedAt'>): void {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, savedAt: Date.now() }));
  } catch {
    /* quota or private mode */
  }
}

export function clearCreateStoryDraft(): void {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}