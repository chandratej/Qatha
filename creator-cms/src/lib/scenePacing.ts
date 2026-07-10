/** Per-scene pacing vs typical serialized scene length (V3 §6). */

export type ScenePacing = 'short' | 'on-pace' | 'long';

export const DEFAULT_SCENE_WORD_TARGET = 400;

export function getSceneWordCount(html: string): number {
  if (!html) return 0;
  const div = document.createElement('div');
  div.innerHTML = html;
  const text = (div.textContent || '').trim();
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

export function getScenePacing(wordCount: number, target = DEFAULT_SCENE_WORD_TARGET): ScenePacing {
  if (wordCount < target * 0.55) return 'short';
  if (wordCount > target * 1.45) return 'long';
  return 'on-pace';
}

export function scenePacingLabel(pacing: ScenePacing): string {
  if (pacing === 'short') return 'Running light';
  if (pacing === 'long') return 'Running rich';
  return 'On pace';
}