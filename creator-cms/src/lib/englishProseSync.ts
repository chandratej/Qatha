import { api } from './api';
import { loadEnglishProse, saveEnglishProse, type EnglishProseDraft } from './englishProseCache';

function htmlToProse(html: string): string {
  if (!html.trim()) return '';
  const temp = document.createElement('div');
  temp.innerHTML = html;
  const blocks = Array.from(temp.querySelectorAll('p'))
    .map((p) => (p.textContent || '').trim())
    .filter(Boolean);
  if (blocks.length > 0) return blocks.join('\n\n');
  return (temp.textContent || '').trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function proseToHtml(prose: string): string {
  const paragraphs = prose.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length === 0) return '<p></p>';
  return paragraphs
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export interface EnglishProseLoadResult {
  title: string;
  prose: string;
  updated_at: number;
  source: 'cloud' | 'local' | 'default';
}

export async function loadEnglishProseMerged(
  storyId: string,
  chapter: number,
  fallbackTitle: string,
): Promise<EnglishProseLoadResult> {
  const local = loadEnglishProse(storyId, chapter);
  let cloud: { title: string; prose: string; updated_at: number } | null = null;

  try {
    const { chapter: data } = await api.getChapter(storyId, chapter);
    const sceneContent = data.content_delta?.scenes?.map((s) => s.content).join('') ?? '';
    const raw = sceneContent || data.content || '';
    const prose = htmlToProse(raw);
    const ts = Date.parse(data.last_saved_at || data.updated_at || '') || 0;
    cloud = {
      title: data.title || fallbackTitle,
      prose,
      updated_at: ts,
    };
  } catch {
    cloud = null;
  }

  if (cloud && local) {
    if (cloud.updated_at >= local.updated_at) {
      return { ...cloud, source: 'cloud' };
    }
    return { title: local.title, prose: local.prose, updated_at: local.updated_at, source: 'local' };
  }
  if (cloud) return { ...cloud, source: 'cloud' };
  if (local) {
    return { title: local.title, prose: local.prose, updated_at: local.updated_at, source: 'local' };
  }
  return { title: fallbackTitle, prose: '', updated_at: 0, source: 'default' };
}

export async function saveEnglishProseCloud(
  storyId: string,
  chapter: number,
  draft: Pick<EnglishProseDraft, 'title' | 'prose'>,
): Promise<{ saved: boolean; updated_at: number }> {
  const html = proseToHtml(draft.prose);
  const result = await api.saveDraft(storyId, {
    chapter_number: chapter,
    title: draft.title,
    content: html,
    content_delta: {
      scenes: [{ id: `en-scene-${chapter}`, title: draft.title, content: html }],
    },
  });
  const ts = Date.parse(result.draft.last_saved_at || result.draft.updated_at || '') || Date.now();
  saveEnglishProse(storyId, chapter, { title: draft.title, prose: draft.prose }, ts);
  return { saved: result.saved, updated_at: ts };
}