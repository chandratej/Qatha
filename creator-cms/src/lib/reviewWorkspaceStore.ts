import type {
  ReviewChecklistItem,
  ReviewComment,
  ReviewWorkspaceDraft,
  ReviewWorkspaceMetrics,
  ReviewWorkspacePrefs,
} from '../types/reviewWorkspace';
import { REVIEW_CATEGORIES } from '../types/reviewWorkspace';

const DRAFT_KEY_PREFIX = 'katha_review_workspace_';

function storageKey(assignmentId: string): string {
  return `${DRAFT_KEY_PREFIX}${assignmentId}`;
}

const DEFAULT_CHECKLIST: ReviewChecklistItem[] = [
  { id: 'plot', label: 'Plot reviewed', category: 'plot', completed: false, autoComplete: true },
  { id: 'dialogue', label: 'Dialogue reviewed', category: 'dialogue', completed: false, autoComplete: true },
  { id: 'character', label: 'Character motivation reviewed', category: 'character', completed: false, autoComplete: true },
  { id: 'grammar', label: 'Grammar reviewed', category: 'grammar', completed: false, autoComplete: true },
  { id: 'emotion', label: 'Emotional consistency reviewed', category: 'emotion', completed: false, autoComplete: true },
  { id: 'ending', label: 'Chapter ending reviewed', category: 'ending', completed: false, autoComplete: true },
  { id: 'cliffhanger', label: 'Cliffhanger reviewed', category: 'cliffhanger', completed: false, autoComplete: true },
  { id: 'hook', label: 'Reader hook reviewed', category: 'hook', completed: false, autoComplete: true },
];

/** Reading-first defaults — UX & Ergonomics Council: immersion over dashboard density */
const DEFAULT_PREFS: ReviewWorkspacePrefs = {
  focusMode: true,
  distractionFree: false,
  readingRuler: false,
  splitReview: false,
  showTrackChanges: false,
  zoom: 100,
  leftPanelCollapsed: true,
  rightPanelCollapsed: true,
  bottomPanelCollapsed: true,
};

function emptyMetrics(): ReviewWorkspaceMetrics {
  return {
    timeSpentMinutes: 0,
    commentsCount: 0,
    suggestionsCount: 0,
    questionsCount: 0,
    criticalCount: 0,
    openCount: 0,
    resolvedCount: 0,
  };
}

export function createEmptyDraft(assignmentId: string, requestId: string): ReviewWorkspaceDraft {
  const now = new Date().toISOString();
  return {
    assignmentId,
    requestId,
    startedAt: now,
    lastSavedAt: now,
    currentChapter: 1,
    chaptersReviewed: [],
    comments: [],
    trackChanges: [],
    checklist: DEFAULT_CHECKLIST.map((c) => ({ ...c })),
    summary: {
      overallReview: '',
      strengths: '',
      weaknesses: '',
      recommendation: '',
      decision: '',
      visibleToAuthor: true,
      internalNotes: '',
    },
    metrics: emptyMetrics(),
    prefs: { ...DEFAULT_PREFS },
  };
}

const PREFS_MIGRATION_KEY = 'katha_rw_prefs_v';

export function loadReviewDraft(assignmentId: string, requestId: string): ReviewWorkspaceDraft {
  try {
    const raw = localStorage.getItem(storageKey(assignmentId));
    if (raw) {
      const draft = JSON.parse(raw) as ReviewWorkspaceDraft;
      const migrated = localStorage.getItem(PREFS_MIGRATION_KEY) === '2';
      if (!migrated && draft.comments.length === 0) {
        draft.prefs = { ...draft.prefs, ...DEFAULT_PREFS };
        localStorage.setItem(PREFS_MIGRATION_KEY, '2');
      }
      return draft;
    }
  } catch { /* ignore */ }
  try {
    localStorage.setItem(PREFS_MIGRATION_KEY, '2');
  } catch { /* ignore */ }
  return createEmptyDraft(assignmentId, requestId);
}

export function clearReviewDraft(assignmentId: string): void {
  try {
    localStorage.removeItem(storageKey(assignmentId));
  } catch { /* ignore */ }
}

export function saveReviewDraft(draft: ReviewWorkspaceDraft): ReviewWorkspaceDraft {
  const updated = {
    ...draft,
    lastSavedAt: new Date().toISOString(),
    metrics: computeMetrics(draft.comments),
  };
  try {
    localStorage.setItem(storageKey(updated.assignmentId), JSON.stringify(updated));
  } catch { /* ignore */ }
  return updated;
}

export function computeMetrics(comments: ReviewComment[]): ReviewWorkspaceMetrics {
  const open = comments.filter((c) => c.status === 'open' || c.status === 'pinned');
  return {
    timeSpentMinutes: 0,
    commentsCount: comments.filter((c) => c.kind === 'comment').length,
    suggestionsCount: comments.filter((c) => c.kind === 'suggestion').length,
    questionsCount: comments.filter((c) => c.kind === 'question').length,
    criticalCount: comments.filter((c) => c.priority === 'critical').length,
    openCount: open.length,
    resolvedCount: comments.filter((c) => c.status === 'resolved').length,
  };
}

export function syncChecklistFromComments(
  checklist: ReviewChecklistItem[],
  comments: ReviewComment[],
): ReviewChecklistItem[] {
  const categoriesWithComments = new Set(comments.map((c) => c.category));
  return checklist.map((item) => {
    if (!item.autoComplete || !item.category) return item;
    return {
      ...item,
      completed: categoriesWithComments.has(item.category),
    };
  });
}

export function predictRqiGain(comments: ReviewComment[]): number {
  const base = 2;
  const depth = Math.min(8, comments.length * 0.4);
  const critical = comments.filter((c) => c.priority === 'critical').length * 0.5;
  return Math.round((base + depth + critical) * 10) / 10;
}

export function duplicateCommentWarning(comments: ReviewComment[], text: string): boolean {
  const norm = text.trim().toLowerCase().slice(0, 40);
  if (!norm) return false;
  return comments.some((c) => c.reason.toLowerCase().includes(norm) || c.selectedText?.toLowerCase().includes(norm));
}

export const ALL_CATEGORIES = REVIEW_CATEGORIES;