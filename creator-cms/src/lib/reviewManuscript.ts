import type { PeerReviewRequest, ReviewerAssignment } from '../types/platform';
import type {
  BlindManuscript,
  BlindManuscriptChapter,
  BlindManuscriptParagraph,
  BlindManuscriptScene,
} from '../types/reviewWorkspace';
import { getOrInitDemoData, loadChapterScenes } from './demoStorage';
import { PROFESSIONAL_REVIEW_ROLES, GENRE_SPECIALIZATIONS } from './platformConstants';
import { computeStoryQualityIndex, demoSqiFromTrust } from '../business/storyQualityIndex';

/**
 * Review Studio language decision (do not silently reverse):
 * Katha supports BOTH Telugu and English manuscripts. The review-language
 * selector controls note-writing language independently. Demo seeds ship as
 * bilingual pair (demo-valley-te + demo-valley-en) so TE UI + EN manuscript
 * is intentional, not a bug. Genre tag in chrome calibrates feedback tone.
 */
const FALLBACK_SCENES_EN: Array<{ id: string; title: string; paragraphs: string[] }> = [
  {
    id: 'scene-opening',
    title: 'Scene 1 — Monsoon Warning',
    paragraphs: [
      'The village slept beneath a sky bruised with monsoon clouds. Somewhere beyond the ridge, drums echoed — not celebration, but warning.',
      'She pressed her palm against the doorframe, feeling the grain of aged teak. Every house in the valley had been built by the same hands, and those hands were now clenched into fists.',
    ],
  },
  {
    id: 'scene-confrontation',
    title: 'Scene 2 — The Unspoken Past',
    paragraphs: [
      '"You cannot ask me to forget," he said, not raising his voice. "Memory is the only weapon we were ever given."',
      'The letter arrived without a seal. That alone told her everything: whoever wrote it feared being traced more than being ignored.',
    ],
  },
  {
    id: 'scene-decision',
    title: 'Scene 3 — First Light',
    paragraphs: [
      'By dawn the river would rise. They had until first light to decide whether courage was a virtue or a luxury.',
      'She folded the letter once, then twice, as if compressing the choice into something small enough to carry.',
    ],
  },
];

const FALLBACK_SCENES_TE: Array<{ id: string; title: string; paragraphs: string[] }> = [
  {
    id: 'scene-opening',
    title: 'దృశ్యం 1 — వర్షపు హెచ్చరిక',
    paragraphs: [
      'గ్రామం మేఘాలతో గాయపడిన ఆకాశం కింద నిద్రపోయింది. కొండ వెనుక ఎక్కడో డ్రమ్ములు మోగాయి — ఉత్సవం కాదు, హెచ్చరిక.',
      'ఆమె తలుపు చట్రంపై చేతులు అదిమి, పాత టేకు మొక్క యొక్క గీతలను అనుభవించింది. లోయలోని ప్రతి ఇల్లు అదే చేతులతో కట్టబడింది — ఇప్పుడు ఆ చేతులు ముష్టులుగా మారాయి.',
    ],
  },
  {
    id: 'scene-confrontation',
    title: 'దృశ్యం 2 — చెప్పని గతం',
    paragraphs: [
      '"నన్ను మరచిపోమని అడగవద్దు," అతను గొంతు పెంచకుండా అన్నాడు. "జ్ఞాపకం మాకు ఇచ్చిన ఏకైక ఆయుధం."',
      'లేఖ ముద్ర లేకుండా వచ్చింది. అది చాలు: రాసినవారు విస్మరించబడటం కంటే గుర్తించబడటానికి భయపడ్డారు.',
    ],
  },
  {
    id: 'scene-decision',
    title: 'దృశ్యం 3 — మొదటి వెలుగు',
    paragraphs: [
      'తెల్లవారే సరికి నది పొంగుతుంది. ధైర్యం గుణమా విలాసమా అని నిర్ణయించుకోవడానికి వారికి మొదటి వెలుగు వరకే సమయం.',
      'ఆమె లేఖను ఒకసారి మడిచింది, మళ్లీ ఒకసారి — ఎంపికను మోయగలిగేంత చిన్నదిగా చేసినట్లు.',
    ],
  },
];

function htmlToPlain(html: string): string {
  const el = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (!el) return html.replace(/<[^>]+>/g, ' ').trim();
  el.innerHTML = html;
  return (el.textContent || '').trim();
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function buildParagraph(
  sceneId: string,
  sceneTitle: string | undefined,
  index: number,
  plain: string,
): BlindManuscriptParagraph {
  return {
    id: `p-${sceneId}-${index}`,
    index,
    sceneId,
    sceneTitle,
    html: `<p>${plain}</p>`,
    plainText: plain,
  };
}

function buildSceneFromChunks(
  scene: { id: string; title: string; chunks: string[] },
  sceneIndex: number,
  startParagraphIndex: number,
): { scene: BlindManuscriptScene; nextIndex: number } {
  const paragraphs: BlindManuscriptParagraph[] = [];
  let idx = startParagraphIndex;
  for (let i = 0; i < scene.chunks.length; i++) {
    const plain = scene.chunks[i]!.trim();
    if (!plain) continue;
    paragraphs.push(buildParagraph(scene.id, i === 0 ? scene.title : undefined, idx, plain));
    idx += 1;
  }
  const wordCount = paragraphs.reduce((s, p) => s + countWords(p.plainText), 0);
  return {
    scene: {
      id: scene.id,
      index: sceneIndex,
      title: scene.title,
      paragraphs,
      wordCount,
      estimatedMinutes: Math.max(1, Math.round(wordCount / 220)),
    },
    nextIndex: idx,
  };
}

function buildScenesFromEditor(
  scenes: Array<{ id: string; title: string; content: string }>,
): BlindManuscriptScene[] {
  let paragraphIndex = 0;
  const built: BlindManuscriptScene[] = [];
  scenes.forEach((scene, sceneIndex) => {
    const plain = htmlToPlain(scene.content);
    if (!plain) return;
    const chunks = plain.split(/\n\n+/).filter(Boolean);
    const { scene: builtScene, nextIndex } = buildSceneFromChunks(
      { id: scene.id, title: scene.title || `Scene ${sceneIndex + 1}`, chunks },
      sceneIndex,
      paragraphIndex,
    );
    if (builtScene.paragraphs.length) {
      built.push(builtScene);
      paragraphIndex = nextIndex;
    }
  });
  return built;
}

function fallbackScenes(language: 'te' | 'en' = 'en'): BlindManuscriptScene[] {
  const source = language === 'te' ? FALLBACK_SCENES_TE : FALLBACK_SCENES_EN;
  let paragraphIndex = 0;
  const built: BlindManuscriptScene[] = [];
  source.forEach((scene, sceneIndex) => {
    const { scene: builtScene, nextIndex } = buildSceneFromChunks(
      { id: scene.id, title: scene.title, chunks: scene.paragraphs },
      sceneIndex,
      paragraphIndex,
    );
    built.push(builtScene);
    paragraphIndex = nextIndex;
  });
  return built;
}

function flattenParagraphs(scenes: BlindManuscriptScene[]): BlindManuscriptParagraph[] {
  return scenes.flatMap((s) => s.paragraphs);
}

function demoLanguageForStory(storyId: string): 'te' | 'en' {
  if (storyId === 'demo-valley-te') return 'te';
  if (storyId.includes('-te') || /[\u0C00-\u0C7F]/.test(storyId)) return 'te';
  return 'en';
}

function buildChapter(
  num: number,
  storyId: string,
  fallbackWords: number,
  language: 'te' | 'en',
): BlindManuscriptChapter {
  const editorScenes = loadChapterScenes(storyId, num);
  const scenes = editorScenes?.length
    ? buildScenesFromEditor(editorScenes)
    : fallbackScenes(language);
  const paragraphs = flattenParagraphs(scenes);
  const wordCount = paragraphs.reduce((s, p) => s + countWords(p.plainText), 0) || fallbackWords;
  return {
    num,
    label: language === 'te' ? `అధ్యాయం ${num}` : `Chapter ${num}`,
    scenes,
    paragraphs,
    wordCount,
    estimatedMinutes: Math.max(3, Math.round(wordCount / 220)),
  };
}

export function loadBlindManuscript(
  request: PeerReviewRequest,
  assignment: ReviewerAssignment,
): BlindManuscript {
  // Prefer original demo ids; map legacy IP id to bilingual valley demo.
  const rawId = request.story_id || 'demo-valley-te';
  const storyId = rawId === 'demo-rrr' ? 'demo-valley-en' : rawId;
  const language = demoLanguageForStory(storyId);
  const demo = getOrInitDemoData(storyId);
  const chapterNums = demo.seasons.flatMap((s) => s.chapterNums).slice(0, 6);
  const nums = chapterNums.length ? chapterNums : [1, 2, 3];

  const chapters = nums.map((n) => {
    const stats = demo.chapterWordCounts[n] || 800;
    return buildChapter(n, storyId, stats, language);
  });

  const wordCount = chapters.reduce((s, c) => s + c.wordCount, 0);
  const roleLabel =
    PROFESSIONAL_REVIEW_ROLES.find((r) => r.id === assignment.professional_role)?.label
    ?? assignment.professional_role;
  const genreLabel =
    GENRE_SPECIALIZATIONS.find((g) => g.id === assignment.story_genre)?.label
    ?? assignment.story_genre;

  const base = request.created_at ? new Date(request.created_at) : new Date();
  const deadline = Number.isNaN(base.getTime()) ? new Date() : base;
  deadline.setDate(deadline.getDate() + 14);

  return {
    label: assignment.manuscript_label,
    genre: genreLabel,
    reviewType: roleLabel,
    wordCount,
    estimatedReadingMinutes: Math.max(15, Math.round(wordCount / 220)),
    trustLevel: 'Emerging Author',
    reviewFee: assignment.mode === 'paid' ? assignment.payout_inr : 0,
    mode: assignment.mode,
    deadline: deadline.toISOString(),
    chapters,
  };
}

export function buildStoryIntelligence(request: PeerReviewRequest) {
  const scores = demoSqiFromTrust(1200);
  const sqi = request.sqi_before ?? computeStoryQualityIndex(scores);
  return {
    sqi,
    categoryScores: scores as Record<string, number>,
    readerEngagement: Math.round((scores.reader_retention ?? 60) * 0.9),
    completionPrediction: 68,
    reviewReadiness: 72,
    strengths: ['Strong opening hook', 'Vivid sensory detail', 'Distinct character voices'],
    weaknesses: ['Pacing sags mid-chapter', 'Dialogue tags occasionally redundant'],
    improvementOpportunities: ['Tighten scene transitions', 'Clarify protagonist motivation in Ch. 2'],
  };
}