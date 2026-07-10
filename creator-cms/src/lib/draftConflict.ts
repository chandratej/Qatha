/**
 * DEC-023 / BR local-first — detect local vs cloud draft conflicts.
 * Policy: if both sides differ and both have content, require explicit choice.
 */

export type DraftConflictChoice = 'local' | 'cloud';

export interface DraftSideMeta {
  /** Epoch ms when this side was last written */
  updatedAt: number | null;
  /** Stable fingerprint of title + scene contents */
  fingerprint: string;
  /** True when side has meaningful author content */
  hasContent: boolean;
}

export interface ConflictDecision {
  hasConflict: boolean;
  /** Preferred side when no conflict or when one side empty */
  prefer: DraftConflictChoice;
  reason: 'same' | 'local_only' | 'cloud_only' | 'local_newer' | 'cloud_newer' | 'divergent';
}

export function fingerprintDraft(title: string, scenes: Array<{ id: string; title: string; content: string }>): string {
  return JSON.stringify({
    title: title.trim(),
    scenes: scenes.map((s) => ({ id: s.id, title: s.title, content: s.content })),
  });
}

export function sceneContentEmpty(scenes: Array<{ content: string }>): boolean {
  if (!scenes.length) return true;
  const plain = scenes.map((s) => s.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()).join('');
  return plain.length === 0;
}

/**
 * Compare local cache vs cloud chapter.
 * Divergent fingerprints with content on both sides → hasConflict.
 */
export function resolveDraftConflict(local: DraftSideMeta, cloud: DraftSideMeta): ConflictDecision {
  if (!local.hasContent && !cloud.hasContent) {
    return { hasConflict: false, prefer: 'cloud', reason: 'same' };
  }
  if (local.hasContent && !cloud.hasContent) {
    return { hasConflict: false, prefer: 'local', reason: 'local_only' };
  }
  if (!local.hasContent && cloud.hasContent) {
    return { hasConflict: false, prefer: 'cloud', reason: 'cloud_only' };
  }
  if (local.fingerprint === cloud.fingerprint) {
    return { hasConflict: false, prefer: 'cloud', reason: 'same' };
  }

  const localTs = local.updatedAt ?? 0;
  const cloudTs = cloud.updatedAt ?? 0;
  // Always surface conflict when both sides have different content
  if (localTs === cloudTs) {
    return { hasConflict: true, prefer: 'local', reason: 'divergent' };
  }
  if (localTs > cloudTs) {
    return { hasConflict: true, prefer: 'local', reason: 'local_newer' };
  }
  return { hasConflict: true, prefer: 'cloud', reason: 'cloud_newer' };
}
