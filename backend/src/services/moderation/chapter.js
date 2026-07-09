import { supabase } from '../../lib/supabase.js';
import { moderateContent, riskScoreFromResult } from './gateway.js';

const HARD_BLOCK_PATTERNS = [
  /\b(child\s*porn|minor\s*sexual)\b/i,
];

export function hasHardBlockViolation(content) {
  return HARD_BLOCK_PATTERNS.some((p) => p.test(content || ''));
}

export async function moderateChapter(chapterId, content, creatorId) {
  if (hasHardBlockViolation(content)) {
    await supabase.from('chapters').update({
      status: 'unpublished',
      moderation_status: 'rejected_banned',
      moderation_reason: 'Hard block violation',
    }).eq('id', chapterId);

    await supabase.from('creators').update({
      is_banned: true,
      ban_reason: 'Hard block violation',
    }).eq('id', creatorId);

    return { status: 'rejected_banned', flaggedReason: 'Hard block violation' };
  }

  const moderation = await moderateContent(content);
  const riskScore = riskScoreFromResult(moderation);

  if (!moderation.isSafe) {
    await supabase.from('moderation_queue').insert({
      chapter_id: chapterId,
      creator_id: creatorId,
      status: 'pending',
      reason: moderation.flaggedReason || 'Content flagged for review',
      toxicity_score: riskScore,
    });

    await supabase.from('chapters').update({
      status: 'pending_review',
      moderation_status: 'pending',
    }).eq('id', chapterId);

    return {
      status: 'pending_review',
      flaggedReason: moderation.flaggedReason,
      source: moderation.source,
      risk_score: riskScore,
    };
  }

  await supabase.from('chapters').update({
    status: 'published',
    moderation_status: 'approved',
    published_at: new Date().toISOString(),
  }).eq('id', chapterId);

  return {
    status: 'approved',
    source: moderation.source,
    risk_score: riskScore,
  };
}

/** Pre-approve content for a future publish — keeps status `scheduled`, never publishes here. */
export async function moderateChapterForSchedule(chapterId, content, creatorId, scheduledPublishAt) {
  if (hasHardBlockViolation(content)) {
    await supabase.from('chapters').update({
      status: 'unpublished',
      moderation_status: 'rejected_banned',
      moderation_reason: 'Hard block violation',
      scheduled_publish_at: null,
    }).eq('id', chapterId);

    await supabase.from('creators').update({
      is_banned: true,
      ban_reason: 'Hard block violation',
    }).eq('id', creatorId);

    return { status: 'rejected_banned', userMessage: 'This content cannot be published on Katha.' };
  }

  const moderation = await moderateContent(content);
  const riskScore = riskScoreFromResult(moderation);

  await supabase.from('moderation_events').insert({
    chapter_id: chapterId,
    creator_id: creatorId,
    toxicity_score: riskScore,
    moderation_source: moderation.source,
  });

  if (!moderation.isSafe) {
    await supabase.from('moderation_queue').insert({
      chapter_id: chapterId,
      creator_id: creatorId,
      status: 'pending',
      reason: moderation.flaggedReason || 'Content flagged for review',
      toxicity_score: riskScore,
    });

    await supabase.from('chapters').update({
      status: 'draft',
      moderation_status: null,
      scheduled_publish_at: null,
    }).eq('id', chapterId);

    return {
      status: 'rejected',
      userMessage: "We couldn't schedule this chapter. Please review your content and try again.",
    };
  }

  await supabase.from('chapters').update({
    status: 'scheduled',
    moderation_status: 'approved',
    scheduled_publish_at: scheduledPublishAt,
    published_at: null,
  }).eq('id', chapterId);

  return {
    status: 'approved',
    source: moderation.source,
    risk_score: riskScore,
  };
}