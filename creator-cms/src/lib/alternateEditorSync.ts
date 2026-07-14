import { api } from './api';
import {
  loadEpistolaryDraft,
  saveEpistolaryDraft,
  loadBranchingDraft,
  saveBranchingDraft,
  type AlternateEditorKind,
  type EpistolaryBubble,
  type BranchNode,
} from './alternateEditorCache';

const SCENE_PREFIX: Record<AlternateEditorKind, string> = {
  epistolary: 'katha-epistolary',
  branching: 'katha-branching',
};

interface CloudPayload {
  kind: AlternateEditorKind;
  bubbles?: EpistolaryBubble[];
  nodes?: BranchNode[];
}

export interface AlternateEditorLoadResult<T> {
  title: string;
  data: T;
  updated_at: number;
  source: 'cloud' | 'local' | 'default';
}

function sceneId(kind: AlternateEditorKind, chapter: number): string {
  return `${SCENE_PREFIX[kind]}-${chapter}`;
}

function serializePayload(kind: AlternateEditorKind, data: EpistolaryBubble[] | BranchNode[]): string {
  const payload: CloudPayload =
    kind === 'epistolary'
      ? { kind, bubbles: data as EpistolaryBubble[] }
      : { kind, nodes: data as BranchNode[] };
  return JSON.stringify(payload);
}

function parsePayload(kind: AlternateEditorKind, raw: string): EpistolaryBubble[] | BranchNode[] | null {
  if (!raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as CloudPayload;
    if (parsed.kind === 'epistolary' && kind === 'epistolary' && Array.isArray(parsed.bubbles)) {
      return parsed.bubbles;
    }
    if (parsed.kind === 'branching' && kind === 'branching' && Array.isArray(parsed.nodes)) {
      return parsed.nodes;
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
): Promise<{ title: string; data: EpistolaryBubble[] | BranchNode[]; updated_at: number } | null> {
  try {
    const { chapter: data } = await api.getChapter(storyId, chapter);
    const sid = sceneId(kind, chapter);
    const scene = data.content_delta?.scenes?.find((s) => s.id === sid);
    const raw = scene?.content ?? data.content ?? '';
    const parsed = parsePayload(kind, raw);
    const ts = Date.parse(data.last_saved_at || data.updated_at || '') || 0;
    return {
      title: data.title || fallbackTitle,
      data: parsed ?? (kind === 'epistolary' ? [] : []),
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
): Promise<AlternateEditorLoadResult<EpistolaryBubble[]>> {
  const localRaw = loadEpistolaryDraft(storyId, chapter);
  const local = localRaw
    ? { title: localRaw.title, data: localRaw.bubbles, updated_at: localRaw.updated_at }
    : null;
  const cloud = await loadFromCloud('epistolary', storyId, chapter, fallbackTitle);
  const cloudTyped = cloud
    ? { title: cloud.title, data: cloud.data as EpistolaryBubble[], updated_at: cloud.updated_at }
    : null;
  const localTyped = local
    ? { title: local.title, data: local.data, updated_at: local.updated_at }
    : null;
  const result = pickNewer(cloudTyped, localTyped, fallbackTitle, defaultBubbles);
  if (result.source === 'default') return result;
  if (result.data.length === 0 && defaultBubbles.length > 0 && result.source !== 'cloud') {
    return { ...result, data: defaultBubbles };
  }
  return result;
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
  const localTyped = local
    ? { title: local.title, data: local.data, updated_at: local.updated_at }
    : null;
  const result = pickNewer(cloudTyped, localTyped, fallbackTitle, defaultNodes);
  if (result.source === 'default') return result;
  if (result.data.length === 0 && defaultNodes.length > 0 && result.source !== 'cloud') {
    return { ...result, data: defaultNodes };
  }
  return result;
}

export async function saveEpistolaryCloud(
  storyId: string,
  chapter: number,
  draft: { title: string; bubbles: EpistolaryBubble[] },
): Promise<{ saved: boolean; updated_at: number }> {
  const content = serializePayload('epistolary', draft.bubbles);
  const sid = sceneId('epistolary', chapter);
  const result = await api.saveDraft(storyId, {
    chapter_number: chapter,
    title: draft.title,
    content,
    content_delta: {
      scenes: [{ id: sid, title: draft.title, content }],
    },
  });
  const ts = Date.parse(result.draft.last_saved_at || result.draft.updated_at || '') || Date.now();
  saveEpistolaryDraft(storyId, chapter, draft, ts);
  return { saved: result.saved, updated_at: ts };
}

export async function saveBranchingCloud(
  storyId: string,
  chapter: number,
  draft: { title: string; nodes: BranchNode[] },
): Promise<{ saved: boolean; updated_at: number }> {
  const content = serializePayload('branching', draft.nodes);
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