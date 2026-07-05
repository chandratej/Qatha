// Simple localStorage-backed demo data for the creator CMS.
// Allows full persistence of seasons, chapter order, titles, word counts, scene counts across refreshes.
// Used only for demo stories (e.g. 'demo-rrr').

export interface DemoSeason {
  id: string;
  num: number;
  title: string;
  chapterNums: number[]; // ordered list of chapters belonging to this season
}

export interface DemoStoryData {
  seasons: DemoSeason[];
  chapterTitles: Record<number, string>;
  chapterWordCounts: Record<number, number>;
  chapterSceneCounts: Record<number, number>;
  // Full scene blocks persisted for demo reloads (HTML content)
  chapterScenes?: Record<number, Array<{ id: string; title: string; content: string }>>;
}

const STORAGE_KEY_PREFIX = 'katha-demo-story-';

function getKey(storyId: string) {
  return `${STORAGE_KEY_PREFIX}${storyId}`;
}

export function loadDemoData(storyId: string): DemoStoryData | null {
  try {
    const raw = localStorage.getItem(getKey(storyId));
    if (!raw) return null;
    return JSON.parse(raw) as DemoStoryData;
  } catch {
    return null;
  }
}

export function saveDemoData(storyId: string, data: DemoStoryData) {
  try {
    localStorage.setItem(getKey(storyId), JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to persist demo data', e);
  }
}

export function clearDemoData(storyId: string) {
  localStorage.removeItem(getKey(storyId));
}

// Initialize a fresh RRR demo with 2 seasons (supports sequels/prequels model)
export function initRRRDemoData(): DemoStoryData {
  const season1Chapters = Array.from({ length: 12 }, (_, i) => i + 1);
  const season2Chapters = Array.from({ length: 12 }, (_, i) => i + 13);

  const seasons: DemoSeason[] = [
    {
      id: 's1',
      num: 1,
      title: 'Season 1: Rise of the Rebels',
      chapterNums: season1Chapters,
    },
    {
      id: 's2',
      num: 2,
      title: 'Season 2: The Eternal Flame (Sequel)',
      chapterNums: season2Chapters,
    },
  ];

  const chapterTitles: Record<number, string> = {};
  const chapterWordCounts: Record<number, number> = {};
  const chapterSceneCounts: Record<number, number> = {};

  // Seed some plausible titles + counts (real values will be overwritten by editor on load/edit)
  for (let ch = 1; ch <= 24; ch++) {
    chapterTitles[ch] = getDefaultChapterTitle(ch);
    chapterWordCounts[ch] = 820 + ((ch % 7) * 95);
    chapterSceneCounts[ch] = 2 + (ch % 3);
  }

  return {
    seasons,
    chapterTitles,
    chapterWordCounts: chapterWordCounts as any,
    chapterSceneCounts,
    chapterScenes: {},
  };
}

function getDefaultChapterTitle(ch: number): string {
  const titles: string[] = [
    'The Call of the Jungle',
    'The Hill Rebel',
    'Escape and First Blood',
    'Gathering the Warriors',
    'The Secret Alliance',
    'Raid on the Outpost',
    'Sitaramaraju Joins',
    'Through the Ghats',
    'Village Uprising',
    'The British Trap',
    'Bheem\'s Resolve',
    'Night March',
    'The Final Stand',
    'Betrayal in the Ranks',
    'Fire in the Forest',
    'Reunion of Heroes',
    'Assault on the Fort',
    'Last Stand at Dawn',
    'The Price of Freedom',
    'Legacy Ignites',
    'Stories Around the Fire',
    'Children of the Revolution',
    'Songs of the Martyrs',
    'The Eternal Flame'
  ];
  return titles[ch - 1] || `The Continuing Struggle - Part ${ch}`;
}

// Helper to get or create demo data for a story
export function getOrInitDemoData(storyId: string): DemoStoryData {
  const existing = loadDemoData(storyId);
  if (existing) return existing;

  if (storyId === 'demo-rrr') {
    const fresh = initRRRDemoData();
    saveDemoData(storyId, fresh);
    return fresh;
  }

  // Default for other stories: one season with no chapters yet
  const defaultData: DemoStoryData = {
    seasons: [{ id: 's1', num: 1, title: 'Season 1', chapterNums: [] }],
    chapterTitles: {},
    chapterWordCounts: {},
    chapterSceneCounts: {},
  };
  saveDemoData(storyId, defaultData);
  return defaultData;
}

// Update a single chapter's stats (called from editor)
export function updateChapterStats(
  storyId: string,
  chapterNum: number,
  updates: { title?: string; wordCount?: number; sceneCount?: number }
) {
  const data = getOrInitDemoData(storyId);
  if (updates.title) data.chapterTitles[chapterNum] = updates.title;
  if (typeof updates.wordCount === 'number') data.chapterWordCounts[chapterNum] = updates.wordCount;
  if (typeof updates.sceneCount === 'number') data.chapterSceneCounts[chapterNum] = updates.sceneCount;
  saveDemoData(storyId, data);
}

// Save full scenes for a chapter (for cross-page persistence in demo)
export function saveChapterScenes(storyId: string, chapterNum: number, scenes: Array<{ id: string; title: string; content: string }>) {
  const data = getOrInitDemoData(storyId);
  if (!data.chapterScenes) data.chapterScenes = {};
  data.chapterScenes[chapterNum] = scenes;
  saveDemoData(storyId, data);
}

export function loadChapterScenes(storyId: string, chapterNum: number): Array<{ id: string; title: string; content: string }> | null {
  const data = getOrInitDemoData(storyId);
  return (data.chapterScenes && data.chapterScenes[chapterNum]) || null;
}

// Add a new chapter to a specific season
export function addChapterToSeason(storyId: string, seasonId: string): number {
  const data = getOrInitDemoData(storyId);
  const season = data.seasons.find(s => s.id === seasonId);
  if (!season) return 1;

  // Find next available chapter number (global)
  const allChapters = data.seasons.flatMap(s => s.chapterNums);
  const nextNum = allChapters.length > 0 ? Math.max(...allChapters) + 1 : 1;

  season.chapterNums.push(nextNum);

  // Seed defaults
  if (!data.chapterTitles[nextNum]) {
    data.chapterTitles[nextNum] = `Chapter ${nextNum}`;
  }
  data.chapterWordCounts[nextNum] = 0;
  data.chapterSceneCounts[nextNum] = 0;

  saveDemoData(storyId, data);
  return nextNum;
}

// Add a new season (for sequels/prequels)
export function addSeason(storyId: string, title: string): DemoSeason {
  const data = getOrInitDemoData(storyId);
  const newNum = Math.max(0, ...data.seasons.map(s => s.num)) + 1;
  const newSeason: DemoSeason = {
    id: `s${Date.now()}`,
    num: newNum,
    title: title.trim(),
    chapterNums: [],
  };
  data.seasons.push(newSeason);
  saveDemoData(storyId, data);
  return newSeason;
}

// Reorder seasons (array order defines display order)
export function reorderSeasons(storyId: string, newSeasons: DemoSeason[]) {
  const data = getOrInitDemoData(storyId);
  data.seasons = newSeasons;
  saveDemoData(storyId, data);
}

// Reorder chapters inside one season
export function reorderChaptersInSeason(storyId: string, seasonId: string, newChapterNums: number[]) {
  const data = getOrInitDemoData(storyId);
  const season = data.seasons.find(s => s.id === seasonId);
  if (season) {
    season.chapterNums = newChapterNums;
    saveDemoData(storyId, data);
  }
}

// Get title for a chapter (falls back to default)
export function getChapterTitle(storyId: string, ch: number): string {
  const data = getOrInitDemoData(storyId);
  return data.chapterTitles[ch] || `Chapter ${ch}`;
}

export function getChapterStats(storyId: string, ch: number) {
  const data = getOrInitDemoData(storyId);
  return {
    words: data.chapterWordCounts[ch] || 0,
    scenes: data.chapterSceneCounts[ch] || 0,
  };
}
