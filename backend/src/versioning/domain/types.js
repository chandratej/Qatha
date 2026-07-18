/**
 * Domain re-exports for backend (JS). Storage-agnostic concepts only.
 */

export const VERSION_TYPES = ['AutoCheckpoint', 'Manual', 'Publish', 'Draft'];
export const VERSION_STATUSES = ['Active', 'Restored', 'Archived'];

export const DEFAULT_CHECKPOINT_RULES = {
  minIntervalMs: Number(process.env.VERSION_MIN_INTERVAL_MS) || 60_000,
  significantEditChars: Number(process.env.VERSION_SIGNIFICANT_EDIT_CHARS) || 200,
  onStoryCreate: true,
  onChapterCreate: true,
  onPublish: true,
  onManualSave: true,
  maxVersionsPerChapter: Number(process.env.VERSION_MAX_PER_CHAPTER) || 100,
};
