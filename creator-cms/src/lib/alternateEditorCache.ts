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

/** Scene break — chat fiction acts/locations/time jumps. */
export interface EpistolaryScene {
  id: string;
  title: string;
  bubbles: EpistolaryBubble[];
}

export interface BranchNode {
  id: string;
  title: string;
  body: string;
  choiceA: string;
  choiceB: string;
  choiceATarget?: string | null;
  choiceBTarget?: string | null;
}

export type AlternateEditorKind = 'epistolary' | 'branching';

export interface EpistolaryDraft {
  title: string;
  bubbles: EpistolaryBubble[];
  cast?: EpistolaryCastMember[];
  scenes?: EpistolaryScene[];
  updated_at: number;
}

export interface BranchingDraft {
  title: string;
  nodes: BranchNode[];
  updated_at: number;
}

/** Telugu-first sample cast (UTF-8). */
export const DEFAULT_EPISTOLARY_CAST: EpistolaryCastMember[] = [
  { id: 'cast-p1', role: 'protagonist', name: 'అనన్య' },
  { id: 'cast-a1', role: 'antagonist', name: 'రోహన్' },
  { id: 'cast-n1', role: 'narrator', name: 'కథకుడు' },
];

export const DEFAULT_EPISTOLARY_BUBBLES: EpistolaryBubble[] = [
  {
    id: 'bubble-1',
    speaker: 'protagonist',
    speakerName: 'అనన్య',
    castId: 'cast-p1',
    text: 'ఈ రాత్రి నువ్వు వస్తున్నావా?',
    timestamp: '9:41 PM',
  },
  {
    id: 'bubble-2',
    speaker: 'antagonist',
    speakerName: 'రోహన్',
    castId: 'cast-a1',
    text: 'బహుశా. నువ్వు నిజంగా అంటేనే వస్తా.',
    timestamp: '9:42 PM',
  },
];

export function createDefaultEpistolaryScenes(
  bubbles: EpistolaryBubble[] = DEFAULT_EPISTOLARY_BUBBLES,
): EpistolaryScene[] {
  return [
    {
      id: 'scene-1',
      title: 'సీన్ 1',
      bubbles: bubbles.map((b) => ({ ...b })),
    },
  ];
}

export function flattenEpistolaryScenes(scenes: EpistolaryScene[]): EpistolaryBubble[] {
  return scenes.flatMap((s) => s.bubbles);
}

export function normalizeEpistolaryScenes(
  scenes: EpistolaryScene[] | undefined,
  bubbles: EpistolaryBubble[] | undefined,
): EpistolaryScene[] {
  if (scenes && scenes.length > 0) {
    return scenes.map((s, i) => ({
      id: s.id || `scene-${i + 1}`,
      title: s.title?.trim() || `సీన్ ${i + 1}`,
      bubbles: Array.isArray(s.bubbles) ? s.bubbles : [],
    }));
  }
  return createDefaultEpistolaryScenes(bubbles?.length ? bubbles : DEFAULT_EPISTOLARY_BUBBLES);
}

export function inferCastFromBubbles(bubbles: EpistolaryBubble[]): EpistolaryCastMember[] {
  const byKey = new Map<string, EpistolaryCastMember>();
  for (const b of bubbles) {
    const name = (b.speakerName || '').trim() || 'పాత్ర';
    const key = b.castId || `${b.speaker}::${name}`;
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
        c.name.trim() === (b.speakerName || '').trim(),
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

export function linkScenesToCast(
  scenes: EpistolaryScene[],
  cast: EpistolaryCastMember[],
): EpistolaryScene[] {
  return scenes.map((s) => ({
    ...s,
    bubbles: linkBubblesToCast(s.bubbles, cast),
  }));
}

export function createCastMember(
  role: ChatSpeaker,
  existing: EpistolaryCastMember[],
  name?: string,
): EpistolaryCastMember {
  const count = existing.filter((c) => c.role === role).length + 1;
  const teDefaults: Record<ChatSpeaker, string> = {
    protagonist: count === 1 ? 'నాయకుడు' : `నాయకుడు ${count}`,
    antagonist: count === 1 ? 'విరోధి' : `విరోధి ${count}`,
    narrator: count === 1 ? 'కథకుడు' : `కథకుడు ${count}`,
  };
  return {
    id: `cast-${role}-${Date.now()}-${count}`,
    role,
    name: (name && name.trim()) || teDefaults[role],
  };
}

export function createScene(index: number, title?: string): EpistolaryScene {
  return {
    id: `scene-${Date.now()}-${index}`,
    title: title?.trim() || `సీన్ ${index}`,
    bubbles: [],
  };
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
  draft: Pick<EpistolaryDraft, 'title' | 'bubbles' | 'cast' | 'scenes'>,
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
