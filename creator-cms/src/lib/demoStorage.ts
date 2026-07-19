// Simple localStorage-backed demo data for the creator CMS.
// Allows full persistence of seasons, chapter order, titles, word counts, scene counts across refreshes.
// Used only for original demo stories (demo-valley-te / demo-valley-en).

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

const DEMO_STORY_IDS = new Set(['demo-valley-te', 'demo-valley-en', 'demo-manuscript']);

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

/**
 * Original Telugu-first demo arc — wholly original fiction, no film/IP references.
 * Decision: bilingual demos are intentional (EN + TE), not a language mismatch.
 */
export function initValleyDemoData(language: 'te' | 'en' = 'te'): DemoStoryData {
  const season1Chapters = Array.from({ length: 12 }, (_, i) => i + 1);
  const season2Chapters = Array.from({ length: 12 }, (_, i) => i + 13);

  const seasons: DemoSeason[] = [
    {
      id: 's1',
      num: 1,
      title: language === 'te' ? 'సీజన్ 1: వర్షం వచ్చే ముందు' : 'Season 1: Before the Monsoon',
      chapterNums: season1Chapters,
    },
    {
      id: 's2',
      num: 2,
      title: language === 'te' ? 'సీజన్ 2: నది గుర్తు' : 'Season 2: The River Remembers',
      chapterNums: season2Chapters,
    },
  ];

  const chapterTitles: Record<number, string> = {};
  const chapterWordCounts: Record<number, number> = {};
  const chapterSceneCounts: Record<number, number> = {};

  for (let ch = 1; ch <= 24; ch++) {
    chapterTitles[ch] = getDefaultChapterTitle(ch, language);
    chapterWordCounts[ch] = 820 + ((ch % 7) * 95);
    chapterSceneCounts[ch] = 2 + (ch % 3);
  }

  return {
    seasons,
    chapterTitles,
    chapterWordCounts: chapterWordCounts as Record<number, number>,
    chapterSceneCounts,
    chapterScenes: {},
  };
}

/** @deprecated Use initValleyDemoData */
export function initValleyDemoDataEn(): DemoStoryData {
  return initValleyDemoData('en');
}

function getDefaultChapterTitle(ch: number, language: 'te' | 'en'): string {
  const en: string[] = [
    'Drums Beyond the Ridge',
    'The Teak Doorframe',
    'Letter Without a Seal',
    'Gathering at Dusk',
    'The Unspoken Alliance',
    'Raid on the Outpost',
    'A New Voice Joins',
    'Through the Ghats',
    'Village Uprising',
    'The Colonial Trap',
    'A Sister\'s Resolve',
    'Night March',
    'The Final Stand',
    'Betrayal in the Ranks',
    'Fire in the Forest',
    'Reunion at Dawn',
    'Assault on the Fort',
    'Last Stand at First Light',
    'The Price of Freedom',
    'Legacy Ignites',
    'Stories Around the Fire',
    'Children of the Valley',
    'Songs of the Keepers',
    'The Eternal Flame',
  ];
  const te: string[] = [
    'కొండ వెనుక డ్రమ్ములు',
    'టేకు తలుపు చట్రం',
    'ముద్ర లేని లేఖ',
    'సాయంత్రం సమావేశం',
    'చెప్పని ఒప్పందం',
    'కాపలా పై దాడి',
    'కొత్త గొంతు చేరింది',
    'కనుమల గుండా',
    'గ్రామ తిరుగుబాటు',
    'ఉచ్చు',
    'సోదరి సంకల్పం',
    'రాత్రి నడక',
    'చివరి నిలబడటం',
    'వరుసలో ద్రోహం',
    'అడవిలో అగ్ని',
    'తెల్లవారుజామున కలయిక',
    'కోటపై దాడి',
    'మొదటి వెలుగులో చివరి నిలుపు',
    'స్వేచ్ఛ ధర',
    'వారసత్వం మండుతుంది',
    'అగ్ని చుట్టూ కథలు',
    'లోయ పిల్లలు',
    'కాపలాదారుల పాటలు',
    'శాశ్వత జ్వాల',
  ];
  const list = language === 'te' ? te : en;
  return list[ch - 1] || (language === 'te' ? `కథ కొనసాగింపు — ${ch}` : `The Continuing Arc — Part ${ch}`);
}

// Helper to get or create demo data for a story
export function getOrInitDemoData(storyId: string): DemoStoryData {
  const existing = loadDemoData(storyId);
  if (existing) return existing;

  if (DEMO_STORY_IDS.has(storyId)) {
    const language = storyId === 'demo-valley-te' ? 'te' : 'en';
    const fresh = initValleyDemoData(language);
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
  updates: { title?: string; wordCount?: number; sceneCount?: number },
) {
  const data = getOrInitDemoData(storyId);
  if (updates.title) data.chapterTitles[chapterNum] = updates.title;
  if (typeof updates.wordCount === 'number') data.chapterWordCounts[chapterNum] = updates.wordCount;
  if (typeof updates.sceneCount === 'number') data.chapterSceneCounts[chapterNum] = updates.sceneCount;
  saveDemoData(storyId, data);
}

export function loadChapterScenes(
  storyId: string,
  chapterNum: number,
): Array<{ id: string; title: string; content: string }> | null {
  const data = getOrInitDemoData(storyId);
  return (data.chapterScenes && data.chapterScenes[chapterNum]) || null;
}

export function saveChapterScenes(
  storyId: string,
  chapterNum: number,
  scenes: Array<{ id: string; title: string; content: string }>,
) {
  const data = getOrInitDemoData(storyId);
  if (!data.chapterScenes) data.chapterScenes = {};
  data.chapterScenes[chapterNum] = scenes;
  saveDemoData(storyId, data);
}

// Add a new chapter to a specific season
export function addChapterToSeason(storyId: string, seasonId: string): number {
  const data = getOrInitDemoData(storyId);
  const season = data.seasons.find((s) => s.id === seasonId);
  if (!season) return 1;

  const allChapters = data.seasons.flatMap((s) => s.chapterNums);
  const nextNum = allChapters.length > 0 ? Math.max(...allChapters) + 1 : 1;

  season.chapterNums.push(nextNum);

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
  const newNum = Math.max(0, ...data.seasons.map((s) => s.num)) + 1;
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
  const season = data.seasons.find((s) => s.id === seasonId);
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
