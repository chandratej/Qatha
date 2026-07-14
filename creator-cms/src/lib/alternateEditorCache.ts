/** Local persistence for epistolary and branching editor drafts. */

export type ChatSpeaker = 'protagonist' | 'antagonist' | 'narrator';

export interface EpistolaryBubble {
  id: string;
  speaker: ChatSpeaker;
  speakerName: string;
  text: string;
  timestamp: string;
}

export interface BranchNode {
  id: string;
  title: string;
  body: string;
  choiceA: string;
  choiceB: string;
  /** Target node id for choice A — null means end of path */
  choiceATarget?: string | null;
  /** Target node id for choice B — null means end of path */
  choiceBTarget?: string | null;
}

export type AlternateEditorKind = 'epistolary' | 'branching';

export interface EpistolaryDraft {
  title: string;
  bubbles: EpistolaryBubble[];
  updated_at: number;
}

export interface BranchingDraft {
  title: string;
  nodes: BranchNode[];
  updated_at: number;
}

function cacheKey(kind: AlternateEditorKind, storyId: string, chapter: number): string {
  return `katha-${kind}:${storyId}:${chapter}`;
}

export function loadEpistolaryDraft(storyId: string, chapter: number): EpistolaryDraft | null {
  return loadDraft<EpistolaryDraft>('epistolary', storyId, chapter);
}

export function saveEpistolaryDraft(
  storyId: string,
  chapter: number,
  draft: Pick<EpistolaryDraft, 'title' | 'bubbles'>,
  updatedAt?: number,
): void {
  saveDraft('epistolary', storyId, chapter, draft, updatedAt);
}

export function loadBranchingDraft(storyId: string, chapter: number): BranchingDraft | null {
  return loadDraft<BranchingDraft>('branching', storyId, chapter);
}

export function saveBranchingDraft(
  storyId: string,
  chapter: number,
  draft: Pick<BranchingDraft, 'title' | 'nodes'>,
  updatedAt?: number,
): void {
  saveDraft('branching', storyId, chapter, draft, updatedAt);
}

function loadDraft<T>(kind: AlternateEditorKind, storyId: string, chapter: number): T | null {
  try {
    const raw = localStorage.getItem(cacheKey(kind, storyId, chapter));
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function saveDraft(
  kind: AlternateEditorKind,
  storyId: string,
  chapter: number,
  draft: Record<string, unknown>,
  updatedAt?: number,
): void {
  try {
    localStorage.setItem(
      cacheKey(kind, storyId, chapter),
      JSON.stringify({ ...draft, updated_at: updatedAt ?? Date.now() }),
    );
  } catch {
    /* storage quota — silent fail */
  }
}