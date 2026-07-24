import { supabase } from '../lib/supabase.js';

import { publishDueScheduledChapters } from './scheduledPublish.js';
import { recomputeAllStoryTrust } from './storyTrustBatch.js';

export function scheduleNotifications(cron) {
  cron.schedule('0 10 * * 0', notifyTrendingStories);
  cron.schedule('0 9 * * *', notifyExpiringSubscriptions);
  cron.schedule('0 * * * *', notifyScheduledReleases);
  cron.schedule('0 20 * * *', notifyStreakReminders); // 8 PM daily trigger
  cron.schedule('* * * * *', publishDueScheduledChapters);
  // LRC-11-D7 — review SLA email queue scaffold (hourly; delivery deferred Lean Playbook)
  cron.schedule('15 * * * *', async () => {
    try {
      const { runReviewSlaEmailWorker } = await import('../workers/reviewSlaEmailWorker.js');
      await runReviewSlaEmailWorker();
    } catch (e) {
      console.warn('[reviewSlaEmailWorker] cron failed:', e.message);
    }
  });
  // DEC-021: Story Trust SPI batch — 02:15 UTC daily + every 6h catch-up for stale rows
  cron.schedule('15 2 * * *', () => recomputeAllStoryTrust({ onlyStale: false }));
  cron.schedule('20 */6 * * *', () => recomputeAllStoryTrust({ onlyStale: true }));
  // Req 3.7: auto-finalize any moderation appeal whose bounded window expired unanswered —
  // hourly, since the appeal window itself is measured in days (CONTENT_MODERATION_APPEAL_DAYS).
  cron.schedule('40 * * * *', async () => {
    try {
      const { expireAllUnappealedWindows } = await import('./moderationEscrowStore.js');
      const result = await expireAllUnappealedWindows();
      if (result.expired > 0) console.log('[moderationEscrow] auto-expired unanswered appeals:', result);
    } catch (e) {
      console.warn('[moderationEscrow] expiry sweep failed:', e.message);
    }
  });
}

/**
 * Remote push is NOT wired for MVP1 (P1-16). This logs only — do not market push delivery.
 * Wire FCM/CPaaS later and flip a feature flag before promising notifications externally.
 */
async function sendPush(token, title, body) {
  if (!token) return;
  if (process.env.PUSH_DELIVERY_ENABLED === 'true') {
    // Future: call edge function / CPaaS here
    console.log(`[Push:enabled-stub] ${title}: ${body} → ${token.slice(0, 8)}...`);
    return;
  }
  console.log(`[Push:disabled] would send "${title}" (set PUSH_DELIVERY_ENABLED=true when CPaaS ready)`);
}

export async function notifyNewChapter(storyId, chapterId) {
  const { data: chapter } = await supabase
    .from('chapters')
    .select('title, chapter_number')
    .eq('id', chapterId)
    .single();

  const { data: story } = await supabase
    .from('stories')
    .select('title')
    .eq('id', storyId)
    .single();

  const { data: readers } = await supabase
    .from('reading_progress')
    .select('user_id')
    .eq('story_id', storyId)
    .order('last_read_at', { ascending: false })
    .limit(500);

  for (const reader of readers || []) {
    const { data: user } = await supabase
      .from('profiles')
      .select('fcm_token, notification_preferences')
      .eq('id', reader.user_id)
      .single();

    if (!user?.notification_preferences?.new_chapters) continue;

    await sendPush(
      user.fcm_token,
      `New chapter from ${story?.title}`,
      chapter?.title || `Chapter ${chapter?.chapter_number}`
    );
  }
}

async function notifyExpiringSubscriptions() {
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const { data: subs } = await supabase
    .from('subscriptions')
    .select('user_id, ends_at')
    .eq('status', 'active')
    .lte('ends_at', threeDaysFromNow.toISOString());

  for (const sub of subs || []) {
    const { data: user } = await supabase
      .from('profiles')
      .select('fcm_token, notification_preferences')
      .eq('id', sub.user_id)
      .single();

    if (!user?.notification_preferences?.subscription_reminders) continue;

    await sendPush(
      user.fcm_token,
      'Subscription expiring',
      'Your subscription expires in 3 days. Renew to keep reading.'
    );
  }
}

async function notifyTrendingStories() {
  const { data: stories } = await supabase
    .from('stories')
    .select('id, title, genre, views_this_week')
    .order('views_this_week', { ascending: false })
    .limit(20);

  const { data: users } = await supabase
    .from('profiles')
    .select('id, favorite_genre, fcm_token, notification_preferences')
    .not('favorite_genre', 'is', null);

  for (const user of users || []) {
    if (!user.notification_preferences?.weekly_trending) continue;

    const trending = (stories || []).find((s) => s.genre === user.favorite_genre);
    if (!trending) continue;

    await sendPush(
      user.fcm_token,
      `${trending.title} is trending!`,
      `${trending.views_this_week} new readers this week`
    );
  }
}

async function notifyScheduledReleases() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hourFromNow = (now.getHours() + 1) % 24;

  const { data: stories } = await supabase
    .from('stories')
    .select('id, title, release_day_of_week, release_time_of_day')
    .eq('release_schedule', 'weekly')
    .eq('release_day_of_week', dayOfWeek);

  for (const story of stories || []) {
    if (!story.release_time_of_day) continue;
    const releaseHour = parseInt(story.release_time_of_day.split(':')[0], 10);
    if (releaseHour !== hourFromNow) continue;

    const { data: readers } = await supabase
      .from('reading_progress')
      .select('user_id')
      .eq('story_id', story.id)
      .limit(100);

    for (const reader of readers || []) {
      const { data: user } = await supabase
        .from('profiles')
        .select('fcm_token')
        .eq('id', reader.user_id)
        .single();

      await sendPush(
        user?.fcm_token,
        `New chapter from ${story.title}!`,
        'Next chapter releases in 1 hour'
      );
    }
  }
}

async function notifyStreakReminders() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];

  // Find users who read yesterday but haven't read today
  const { data: streaks } = await supabase
    .from('reading_streaks')
    .select('user_id, current_streak, last_read_date')
    .eq('last_read_date', yesterdayStr)
    .gt('current_streak', 0);

  for (const streak of streaks || []) {
    const { data: user } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('id', streak.user_id)
      .single();

    if (!user?.fcm_token) continue;

    await sendPush(
      user.fcm_token,
      'Keep your streak alive! 🔥',
      `You're on a ${streak.current_streak}-day reading streak. Read a chapter now to keep it going!`
    );
  }
}