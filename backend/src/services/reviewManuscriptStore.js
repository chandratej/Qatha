/**
 * Blind manuscript loader for Review Studio — LRC-05-D7 Wave 2a
 * Literary Council: reviewers read real published chapters, not demo-only fallback.
 * Security: no author identity in response; manuscript_label only.
 */

import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { getSeedChapters } from '../data/seed.js';

function htmlToPlain(html) {
  if (!html) return '';
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function buildParagraph(sceneId, sceneTitle, index, plain) {
  return {
    id: `p-${sceneId}-${index}`,
    index,
    sceneId,
    sceneTitle,
    html: `<p>${plain}</p>`,
    plainText: plain,
  };
}

function buildScenesFromPlain(plain) {
  const chunks = plain.split(/\n\n+/).filter(Boolean);
  if (!chunks.length && plain) chunks.push(plain);
  const sceneId = 'scene-1';
  const paragraphs = chunks.map((chunk, i) =>
    buildParagraph(sceneId, i === 0 ? 'Opening' : undefined, i, chunk.trim()),
  );
  const wordCount = paragraphs.reduce((s, p) => s + countWords(p.plainText), 0);
  return [{
    id: sceneId,
    index: 0,
    title: 'Opening',
    paragraphs,
    wordCount,
    estimatedMinutes: Math.max(1, Math.round(wordCount / 220)),
  }];
}

function buildChapter(num, title, content) {
  const plain = htmlToPlain(content);
  const scenes = buildScenesFromPlain(plain);
  const paragraphs = scenes.flatMap((s) => s.paragraphs);
  const wordCount = paragraphs.reduce((s, p) => s + countWords(p.plainText), 0);
  return {
    num,
    label: title || `Chapter ${num}`,
    scenes,
    paragraphs,
    wordCount,
    estimatedMinutes: Math.max(3, Math.round(wordCount / 220)),
  };
}

async function loadPublishedChapters(storyId) {
  if (isMockMode()) {
    const seed = getSeedChapters(storyId);
    if (seed?.length) {
      return seed
        .filter((c) => c.status === 'published' || !c.status)
        .sort((a, b) => a.chapter_number - b.chapter_number)
        .map((c) => ({
          chapter_number: c.chapter_number,
          title: c.title,
          content: c.content,
        }));
    }
    return [{
      chapter_number: 1,
      title: 'Chapter 1',
      content: '<p>The village slept beneath a sky bruised with monsoon clouds.</p>',
    }];
  }

  const { data, error } = await supabase
    .from('chapters')
    .select('chapter_number, title, content')
    .eq('story_id', storyId)
    .eq('status', 'published')
    .order('chapter_number', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function loadBlindManuscriptForAssignment(assignment, request) {
  const rows = await loadPublishedChapters(request.story_id);
  const chapters = rows.length
    ? rows.map((r) => buildChapter(r.chapter_number, r.title, r.content))
    : [buildChapter(1, 'Chapter 1', '')];

  const wordCount = chapters.reduce((s, c) => s + c.wordCount, 0);
  const deadline = assignment.due_at
    || (() => {
      const d = new Date(request.created_at);
      d.setDate(d.getDate() + 7);
      return d.toISOString();
    })();

  return {
    label: assignment.manuscript_label,
    genre: assignment.story_genre,
    reviewType: assignment.professional_role,
    wordCount,
    estimatedReadingMinutes: Math.max(15, Math.round(wordCount / 220)),
    trustLevel: 'Emerging Author',
    reviewFee: assignment.mode === 'paid' ? Number(assignment.payout_inr) : 0,
    mode: assignment.mode,
    deadline,
    chapters,
    source: rows.length ? 'published_chapters' : 'fallback',
  };
}