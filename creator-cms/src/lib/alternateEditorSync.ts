import { api } from './api';
import {
  loadEpistolaryDraft,
  saveEpistolaryDraft,
  loadBranchingDraft,
  saveBranchingDraft,
  DEFAULT_EPISTOLARY_CAST,
  inferCastFromBubbles,
  linkScenesToCast,
  normalizeEpistolaryScenes,
  flattenEpistolaryScenes,
  type AlternateEditorKind,
  type EpistolaryBubble,
  type EpistolaryCastMember,
  type EpistolaryScene,
  type BranchNode,
} from './alternateEditorCache';

const SCENE_PREFIX: Record<AlternateEditorKind, string> = {
  epistolary: 'katha-epistolary',
  branching: 'katha-branching',
};

interface CloudPayload {
  kind: AlternateEditorKind;
  bubbles?: EpistolaryBubble[];
  cast?: EpistolaryCastMember[];
  scenes?: EpistolaryScene[];
  nodes?: BranchNode[];
}

export interface AlternateEditorLoadResult<T> {
  title: string;
  data: T;
  updated_at: number;
  source: 'cloud' | 'local' | 'default';
  cast?: EpistolaryCastMember[];
}

export interface EpistolaryLoadResult extends AlternateEditorLoadResult<EpistolaryBubble[]> {
  cast: EpistolaryCastMember[];
  scenes: EpistolaryScene[];
}

function sceneId(kind: AlternateEditorKind, chapter: number): string {
  return `${SCENE_PREFIX[kind]}-${chapter}`;
}

function serializeEpistolary(
  scenes: EpistolaryScene[],
  cast: EpistolaryCastMember[],
): string {
  const bubbles = flattenEpistolaryScenes(scenes);
  const payload: CloudPayload = {
    kind: 'epistolary',
    scenes,
    cast,
    bubbles, // flat list for older readers / previews
  };
  return JSON.stringify(payload);
}

function serializeBranching(nodes: BranchNode[]): string {
  return JSON.stringify({ kind: 'branching', nodes } satisfies CloudPayload);
}

interface ParsedEpistolary {
  bubbles: EpistolaryBubble[];
  cast?: EpistolaryCastMember[];
  scenes?: EpistolaryScene[];
}

function parsePayload(
  kind: AlternateEditorKind,
  raw: string,
): EpistolaryBubble[] | BranchNode[] | ParsedEpistolary | null {
  if (!raw.trim()) return null;
  const cleaned = raw
    .replace(/^<p>/i, '')
    .replace(/<\/p>$/i, '')
    .replace(/<br\s*\/?>/gi, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
  try {
    const parsed = JSON.parse(cleaned) as CloudPayload | BranchNode[] | EpistolaryBubble[];
    if (Array.isArray(parsed)) {
      if (kind === 'branching' && parsed.length > 0 && 'body' in (parsed[0] as object)) {
        return parsed as BranchNode[];
      }
      if (kind === 'epistolary' && parsed.length > 0 && 'speaker' in (parsed[0] as object)) {
        return { bubbles: parsed as EpistolaryBubble[] };
      }
      return null;
    }
    if (parsed && typeof parsed === 'object') {
      if (kind === 'epistolary') {
        const bubbles = Array.isArray(parsed.bubbles) ? parsed.bubbles : [];
        const scenes = Array.isArray(parsed.scenes) ? parsed.scenes : undefined;
        if (bubbles.length || (scenes && scenes.length)) {
          return {
            bubbles: bubbles.length
              ? bubbles
              : flattenEpistolaryScenes(scenes ?? []),
            cast: Array.isArray(parsed.cast) ? parsed.cast : undefined,
            scenes,
          };
        }
      }
      if (kind === 'branching' && Array.isArray(parsed.nodes)) {
        return parsed.nodes;
      }
      if (kind === 'branching' && Array.isArray((parsed as { nodes?: BranchNode[] }).nodes)) {
        return (parsed as { nodes: BranchNode[] }).nodes;
      }
    }
  } catch {
    /* fall through */
  }
  return null;
}

async function loadFromCloud(
  kind: AlternateEditorKind,
  storyId: string,
  chapter: number,
  fallbackTitle: string,
): Promise<{
  title: string;
  data: EpistolaryBubble[] | BranchNode[];
  cast?: EpistolaryCastMember[];
  scenes?: EpistolaryScene[];
  updated_at: number;
} | null> {
  try {
    const { chapter: data } = await api.getChapter(storyId, chapter);
    const sid = sceneId(kind, chapter);
    const scene = data.content_delta?.scenes?.find((s) => s.id === sid);
    const candidates = [
      scene?.content,
      ...(data.content_delta?.scenes ?? []).map((s) => s.content),
      data.content,
    ].filter((v): v is string => Boolean(v && String(v).trim()));

    let bubbles: EpistolaryBubble[] | null = null;
    let nodes: BranchNode[] | null = null;
    let cast: EpistolaryCastMember[] | undefined;
    let scenes: EpistolaryScene[] | undefined;

    for (const raw of candidates) {
      const parsed = parsePayload(kind, raw);
      if (!parsed) continue;
      if (kind === 'epistolary') {
        if (Array.isArray(parsed)) continue;
        const epi = parsed as ParsedEpistolary;
        if (epi.bubbles?.length || epi.scenes?.length) {
          bubbles = epi.bubbles ?? flattenEpistolaryScenes(epi.scenes ?? []);
          cast = epi.cast;
          scenes = epi.scenes;
          break;
        }
      } else if (Array.isArray(parsed) && parsed.length > 0) {
        nodes = parsed as BranchNode[];
        break;
      }
    }

    const ts = Date.parse(data.last_saved_at || data.updated_at || '') || 0;
    return {
      title: data.title || fallbackTitle,
      data: kind === 'epistolary' ? (bubbles ?? []) : (nodes ?? []),
      cast,
      scenes,
      updated_at: ts,
    };
  } catch {
    return null;
  }
}

function pickNewer<T>(
  cloud: { title: string; data: T; updated_at: number } | null,
  local: { title: string; data: T; updated_at: number } | null,
  fallbackTitle: string,
  defaultData: T,
): AlternateEditorLoadResult<T> {
  if (cloud && local) {
    if (cloud.updated_at >= local.updated_at) {
      return { title: cloud.title, data: cloud.data, updated_at: cloud.updated_at, source: 'cloud' };
    }
    return { title: local.title, data: local.data, updated_at: local.updated_at, source: 'local' };
  }
  if (cloud) return { title: cloud.title, data: cloud.data, updated_at: cloud.updated_at, source: 'cloud' };
  if (local) return { title: local.title, data: local.data, updated_at: local.updated_at, source: 'local' };
  return { title: fallbackTitle, data: defaultData, updated_at: 0, source: 'default' };
}

export async function loadEpistolaryMerged(
  storyId: string,
  chapter: number,
  fallbackTitle: string,
  defaultBubbles: EpistolaryBubble[],
  defaultCast: EpistolaryCastMember[] = DEFAULT_EPISTOLARY_CAST,
): Promise<EpistolaryLoadResult> {
  const localRaw = loadEpistolaryDraft(storyId, chapter);
  const cloud = await loadFromCloud('epistolary', storyId, chapter, fallbackTitle);

  type Bundle = {
    title: string;
    bubbles: EpistolaryBubble[];
    cast?: EpistolaryCastMember[];
    scenes?: EpistolaryScene[];
    updated_at: number;
  };

  const local: Bundle | null = localRaw
    ? {
        title: localRaw.title,
        bubbles: localRaw.bubbles,
        cast: localRaw.cast,
        scenes: localRaw.scenes,
        updated_at: localRaw.updated_at,
      }
    : null;

  const cloudBundle: Bundle | null = cloud
    ? {
        title: cloud.title,
        bubbles: cloud.data as EpistolaryBubble[],
        cast: cloud.cast,
        scenes: cloud.scenes,
        updated_at: cloud.updated_at,
      }
    : null;

  let chosen: Bundle;
  let source: EpistolaryLoadResult['source'] = 'default';

  if (cloudBundle && local) {
    if (cloudBundle.updated_at >= local.updated_at) {
      chosen = cloudBundle;
      source = 'cloud';
    } else {
      chosen = local;
      source = 'local';
    }
  } else if (cloudBundle) {
    chosen = cloudBundle;
    source = 'cloud';
  } else if (local) {
    chosen = local;
    source = 'local';
  } else {
    chosen = {
      title: fallbackTitle,
      bubbles: defaultBubbles,
      cast: defaultCast,
      scenes: undefined,
      updated_at: 0,
    };
  }

  let scenes = normalizeEpistolaryScenes(chosen.scenes, chosen.bubbles);
  if (source !== 'default' && flattenEpistolaryScenes(scenes).length === 0 && defaultBubbles.length && source !== 'cloud') {
    scenes = normalizeEpistolaryScenes(undefined, defaultBubbles);
  }

  let cast =
    chosen.cast?.length
      ? chosen.cast
      : inferCastFromBubbles(flattenEpistolaryScenes(scenes));
  if (!cast.length) cast = defaultCast.map((c) => ({ ...c }));

  scenes = linkScenesToCast(scenes, cast);
  const data = flattenEpistolaryScenes(scenes);

  return {
    title: chosen.title || fallbackTitle,
    data,
    scenes,
    cast,
    updated_at: chosen.updated_at,
    source,
  };
}

export async function loadBranchingMerged(
  storyId: string,
  chapter: number,
  fallbackTitle: string,
  defaultNodes: BranchNode[],
): Promise<AlternateEditorLoadResult<BranchNode[]>> {
  const localRaw = loadBranchingDraft(storyId, chapter);
  const local = localRaw
    ? { title: localRaw.title, data: localRaw.nodes, updated_at: localRaw.updated_at }
    : null;
  const cloud = await loadFromCloud('branching', storyId, chapter, fallbackTitle);
  const cloudTyped = cloud
    ? { title: cloud.title, data: cloud.data as BranchNode[], updated_at: cloud.updated_at }
    : null;
  const result = pickNewer(cloudTyped, local, fallbackTitle, defaultNodes);
  if (result.source === 'default') return result;
  if (result.data.length === 0 && defaultNodes.length > 0 && result.source !== 'cloud') {
    return { ...result, data: defaultNodes };
  }
  return result;
}

export async function saveEpistolaryCloud(
  storyId: string,
  chapter: number,
  draft: {
    title: string;
    bubbles?: EpistolaryBubble[];
    cast?: EpistolaryCastMember[];
    scenes?: EpistolaryScene[];
  },
): Promise<{ saved: boolean; updated_at: number }> {
  const scenes = normalizeEpistolaryScenes(draft.scenes, draft.bubbles);
  const cast = draft.cast ?? [];
  const bubbles = flattenEpistolaryScenes(scenes);
  const content = serializeEpistolary(scenes, cast);
  const sid = sceneId('epistolary', chapter);

  // Map story scenes into content_delta for chapter scene list in CMS
  const deltaScenes = [
    { id: sid, title: draft.title, content },
    ...scenes.map((s) => ({
      id: s.id,
      title: s.title,
      content: JSON.stringify({ kind: 'epistolary-scene', bubbles: s.bubbles }),
    })),
  ];

  const result = await api.saveDraft(storyId, {
    chapter_number: chapter,
    title: draft.title,
    content,
    content_delta: { scenes: deltaScenes },
  });
  const ts = Date.parse(result.draft.last_saved_at || result.draft.updated_at || '') || Date.now();
  saveEpistolaryDraft(storyId, chapter, { title: draft.title, bubbles, cast, scenes }, ts);
  return { saved: result.saved, updated_at: ts };
}

export async function publishEpistolaryChapter(
  storyId: string,
  chapter: number,
  draft: {
    title: string;
    cast: EpistolaryCastMember[];
    scenes: EpistolaryScene[];
  },
): Promise<{ published: boolean; updated_at: number }> {
  const scenes = normalizeEpistolaryScenes(draft.scenes, undefined);
  const bubbles = flattenEpistolaryScenes(scenes);
  if (!bubbles.some((b) => b.text.trim())) {
    throw new Error('Add at least one message before publishing');
  }
  const content = serializeEpistolary(scenes, draft.cast);
  const sid = sceneId('epistolary', chapter);
  const deltaScenes = [
    { id: sid, title: draft.title, content },
    ...scenes.map((s) => ({
      id: s.id,
      title: s.title,
      content: JSON.stringify({ kind: 'epistolary-scene', bubbles: s.bubbles }),
    })),
  ];

  await api.publishChapter(storyId, {
    chapter_number: chapter,
    title: draft.title,
    content,
    content_delta: { scenes: deltaScenes },
  });

  const ts = Date.now();
  saveEpistolaryDraft(
    storyId,
    chapter,
    { title: draft.title, bubbles, cast: draft.cast, scenes },
    ts,
  );
  return { published: true, updated_at: ts };
}

export async function saveBranchingCloud(
  storyId: string,
  chapter: number,
  draft: { title: string; nodes: BranchNode[] },
): Promise<{ saved: boolean; updated_at: number }> {
  const content = serializeBranching(draft.nodes);
  const sid = sceneId('branching', chapter);
  const result = await api.saveDraft(storyId, {
    chapter_number: chapter,
    title: draft.title,
    content,
    content_delta: {
      scenes: [{ id: sid, title: draft.title, content }],
    },
  });
  const ts = Date.parse(result.draft.last_saved_at || result.draft.updated_at || '') || Date.now();
  saveBranchingDraft(storyId, chapter, draft, ts);
  return { saved: result.saved, updated_at: ts };
}
