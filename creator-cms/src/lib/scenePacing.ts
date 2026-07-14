/** Per-scene pacing vs typical serialized scene length (V3 §6). */

export type ScenePacing = 'short' | 'on-pace' | 'long';

export const DEFAULT_SCENE_WORD_TARGET = 400;

import { countWordsInHtml } from './wordCount';

export function getSceneWordCount(html: string, locale = 'en'): number {
  return countWordsInHtml(html, locale);
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