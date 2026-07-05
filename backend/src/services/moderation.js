import { supabase } from '../lib/supabase.js';

const HARD_BLOCK_PATTERNS = [
  /\b(child\s*porn|minor\s*sexual)\b/i,
];

export async function moderateChapter(chapterId, content, creatorId) {
  for (const pattern of HARD_BLOCK_PATTERNS) {
    if (pattern.test(content)) {
      await supabase.from('chapters').update({
        status: 'unpublished',
        moderation_status: 'rejected_banned',
        moderation_reason: 'Hard block violation',
      }).eq('id', chapterId);

      await supabase.from('creators').update({
        is_banned: true,
        ban_reason: 'Hard block violation',
      }).eq('id', creatorId);

      return { status: 'rejected_banned' };
    }
  }

  let toxicityScore = 0;
  if (process.env.PERSPECTIVE_API_KEY) {
    try {
      toxicityScore = await analyzeWithPerspective(content);
    } catch (e) {
      console.warn('Perspective API unavailable, queuing for manual review');
    }
  }

  if (toxicityScore > 0.7) {
    await supabase.from('moderation_queue').insert({
      chapter_id: chapterId,
      creator_id: creatorId,
      status: 'pending',
      reason: 'High toxicity score',
      toxicity_score: toxicityScore,
    });

    await supabase.from('chapters').update({
      status: 'pending_review',
      moderation_status: 'pending',
    }).eq('id', chapterId);

    return { status: 'pending_review' };
  }

  await supabase.from('chapters').update({
    status: 'published',
    moderation_status: 'approved',
    published_at: new Date().toISOString(),
  }).eq('id', chapterId);

  return { status: 'approved' };
}

async function analyzeWithPerspective(content) {
  const res = await fetch(
    `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${process.env.PERSPECTIVE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        comment: { text: content },
        languages: ['te', 'en'],
        requestedAttributes: { TOXICITY: {} },
      }),
    }
  );
  const data = await res.json();
  return data.attributeScores?.TOXICITY?.summaryScore?.value || 0;
}