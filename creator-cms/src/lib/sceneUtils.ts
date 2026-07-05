import type { SceneBlock } from '../components/Editor/SceneSidebar';

const SCENE_BREAK = '<hr class="scene-break" data-scene-break="true" />';

export function aggregateScenesToHtml(scenes: SceneBlock[]): string {
  return scenes
    .map((s) => s.content || '')
    .filter(Boolean)
    .join(SCENE_BREAK);
}

export function scenesFromChapterPayload(chapter: {
  content?: string;
  content_delta?: { scenes?: SceneBlock[] } | null;
  title?: string;
}): SceneBlock[] {
  if (chapter.content_delta?.scenes?.length) {
    return chapter.content_delta.scenes;
  }

  if (chapter.content) {
    const parts = chapter.content.split(/<hr[^>]*data-scene-break[^>]*\/?>/i);
    if (parts.length > 1) {
      return parts.map((html, i) => ({
        id: `scene-${i + 1}`,
        title: `Scene ${i + 1}`,
        content: html.trim(),
      }));
    }
    return [{ id: 'scene-1', title: 'Opening Scene', content: chapter.content }];
  }

  return [{ id: 'scene-1', title: 'Opening Scene', content: '<p>Start writing…</p>' }];
}

export function scenesToContentDelta(scenes: SceneBlock[]) {
  return { scenes };
}