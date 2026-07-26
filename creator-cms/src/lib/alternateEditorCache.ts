/** Local persistence for epistolary and branching editor drafts. */

export type ChatSpeaker = 'protagonist' | 'antagonist' | 'narrator';

/** Named cast member — define once; messages pick from this list. */
export interface EpistolaryCastMember {
  id: string;
  role: ChatSpeaker;
  name: string;
}

export interface EpistolaryBubble {
  id: string;
  speaker: ChatSpeaker;
  speakerName: string;
  /** Links to cast member so rename/select auto-fills name */
  castId?: string;
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
  /** Story cast — multi protag/antag/narrator; names auto-fill on messages */
  cast?: EpistolaryCastMember[];
  updated_at: number;
}

export const DEFAULT_EPISTOLARY_CAST: EpistolaryCastMember[] = [
  { id: 'cast-p1', role: 'protagonist', name: 'Ananya' },
  { id: 'cast-a1', role: 'antagonist', name: 'Rohan' },
  { id: 'cast-n1', role: 'narrator', name: 'Narrator' },
];

/** Infer cast from bubble names when older drafts have no cast array. */
export function inferCastFromBubbles(bubbles: EpistolaryBubble[]): EpistolaryCastMember[] {
  const byKey = new Map<string, EpistolaryCastMember>();
  for (const b of bubbles) {
    const name = (b.speakerName || '').trim() || 'Character';
    const key = b.castId || `${b.speaker}::${name.toLowerCase()}`;
    if (byKey.has(key)) continue;
    byKey.set(key, {
      id: b.castId || `cast-${b.speaker}-${byKey.size + 1}`,
      role: b.speaker,
      name,
    });
  }
  if (byKey.size === 0) return DEFAULT_EPISTOLARY_CAST.map((c) => ({ ...c }));
  return Array.from(byKey.values());
}

/** Attach castId on bubbles that only have role+name. */
export function linkBubblesToCast(
  bubbles: EpistolaryBubble[],
  cast: EpistolaryCastMember[],
): EpistolaryBubble[] {
  return bubbles.map((b) => {
    if (b.castId && cast.some((c) => c.id === b.castId)) {
      const member = cast.find((c) => c.id === b.castId)!;
      return {
        ...b,
        speaker: member.role,
        speakerName: member.name,
        castId: member.id,
      };
    }
    const byName = cast.find(
      (c) =>
        c.role === b.speaker &&
        c.name.trim().toLowerCase() === (b.speakerName || '').trim().toLowerCase(),
    );
    if (byName) {
      return { ...b, castId: byName.id, speaker: byName.role, speakerName: byName.name };
    }
    const byRole = cast.find((c) => c.role === b.speaker);
    if (byRole) {
      return { ...b, castId: byRole.id, speaker: byRole.role, speakerName: byRole.name };
    }
    return b;
  });
}

export function createCastMember(role: ChatSpeaker, existing: EpistolaryCastMember[]): EpistolaryCastMember {
  const count = existing.filter((c) => c.role === role).length + 1;
  const defaults: Record<ChatSpeaker, string> = {
    protagonist: count === 1 ? 'Protagonist' : `Protagonist ${count}`,
    antagonist: count === 1 ? 'Antagonist' : `Antagonist ${count}`,
    narrator: count === 1 ? 'Narrator' : `Narrator ${count}`,
  };
  return {
    id: `cast-${role}-${Date.now()}-${count}`,
    role,
    name: defaults[role],
  };
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
  draft: Pick<EpistolaryDraft, 'title' | 'bubbles' | 'cast'>,
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