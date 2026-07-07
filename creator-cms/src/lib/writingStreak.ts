const STORAGE_KEY = 'katha_writing_streak';
const GOAL_KEY = 'katha_daily_word_goal';

export interface WritingStreakData {
  currentStreak: number;
  longestStreak: number;
  lastWriteDate: string | null;
  activityByDate: Record<string, number>;
}

export interface ProductivitySnapshot {
  wordsToday: number;
  wordsThisWeek: number;
  wordsThisMonth: number;
  dailyGoal: number;
  focusSessions: number;
  writingMinutes: number;
}

const DEFAULT: WritingStreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastWriteDate: null,
  activityByDate: {},
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function load(): WritingStreakData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT };
  }
}

function save(data: WritingStreakData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function daysBetween(a: string, b: string) {
  const da = new Date(a + 'T12:00:00');
  const db = new Date(b + 'T12:00:00');
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

export function recordWritingActivity(words: number) {
  if (words <= 0) return;
  const data = load();
  const today = todayKey();
  data.activityByDate[today] = (data.activityByDate[today] ?? 0) + words;
  if (data.lastWriteDate !== today) {
    const gap = data.lastWriteDate ? daysBetween(data.lastWriteDate, today) : 999;
    data.currentStreak = gap === 1 ? data.currentStreak + 1 : 1;
    data.lastWriteDate = today;
    data.longestStreak = Math.max(data.longestStreak, data.currentStreak);
  }
  save(data);
}

export function getWritingStreak(): WritingStreakData {
  const data = load();
  if (data.lastWriteDate && daysBetween(data.lastWriteDate, todayKey()) > 1) {
    return { ...data, currentStreak: 0 };
  }
  return data;
}

export function ensureDemoStreak(totalReaders: number): WritingStreakData {
  if (load().lastWriteDate) return getWritingStreak();
  const today = new Date();
  const activityByDate: Record<string, number> = {};
  const streakDays = Math.min(47, Math.max(3, Math.floor(totalReaders / 50)));
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (i < 5) activityByDate[dateKey(d)] = 400 + (i * 80);
  }
  const seeded = { currentStreak: streakDays, longestStreak: Math.max(streakDays, 52), lastWriteDate: todayKey(), activityByDate };
  save(seeded);
  return seeded;
}

export function getDailyWordGoal() {
  const n = Number(localStorage.getItem(GOAL_KEY));
  return n > 0 ? n : 500;
}

export function getProductivitySnapshot(): ProductivitySnapshot {
  const data = getWritingStreak();
  const today = todayKey();
  const now = new Date();
  let wordsThisWeek = 0;
  let wordsThisMonth = 0;
  for (const [key, count] of Object.entries(data.activityByDate)) {
    const d = new Date(key + 'T12:00:00');
    const dayDiff = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
    if (dayDiff <= 6) wordsThisWeek += count;
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) wordsThisMonth += count;
  }
  const wordsToday = data.activityByDate[today] ?? 0;
  const focusSessions = Math.max(1, Math.floor(wordsThisWeek / 800));
  return { wordsToday, wordsThisWeek, wordsThisMonth, dailyGoal: getDailyWordGoal(), focusSessions, writingMinutes: Math.max(focusSessions * 25, Math.floor(wordsToday / 20)) };
}

/** 12-week heatmap cells (last 84 days). */
export function getStreakHeatmap(): Array<{ date: string; words: number; level: 0 | 1 | 2 | 3 }> {
  const data = getWritingStreak();
  const cells: Array<{ date: string; words: number; level: 0 | 1 | 2 | 3 }> = [];
  const today = new Date();
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const words = data.activityByDate[key] ?? 0;
    const level: 0 | 1 | 2 | 3 = words === 0 ? 0 : words < 300 ? 1 : words < 700 ? 2 : 3;
    cells.push({ date: key, words, level });
  }
  return cells;
}

export function getWeekHeatmap() {
  const data = getWritingStreak();
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const today = new Date();
  const dow = (today.getDay() + 6) % 7;
  return labels.map((label, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - dow + i);
    const words = data.activityByDate[dateKey(d)] ?? 0;
    return { label, active: words > 0, words };
  });
}

/** Last 30 days for compact streak strip. */
export function getMonthHeatmap(): Array<{ date: string; words: number; level: 0 | 1 | 2 | 3 }> {
  return getStreakHeatmap().slice(-30);
}