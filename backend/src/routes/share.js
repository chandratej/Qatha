import { Router } from 'express';
import { isMockMode } from '../lib/mockMode.js';
import { getPublicStoryDetail } from '../services/publicCatalog.js';
import { getPublicStoriesForReader, getSeedChapters } from '../data/seed.js';

export const shareRouter = Router();

/** Same host the app's https App Link intent-filter targets — set once a real domain is live. */
export const PUBLIC_WEB_BASE = (process.env.PUBLIC_WEB_BASE || 'https://katha.app').replace(/\/$/, '');
const PLAY_STORE_URL = process.env.PLAY_STORE_URL || '';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** First line / first ~160 chars of the story description — the share-card hook. */
function oneLineHook(description) {
  if (!description) return 'Telugu stories that stay with you.';
  const firstLine = description.split('\n')[0].trim();
  return firstLine.length > 160 ? `${firstLine.slice(0, 157)}...` : firstLine;
}

/**
 * Pure HTML builder — kept separate from the route handler so it's unit-testable
 * without a live Supabase connection. WhatsApp/Telegram's unfurl crawlers only
 * read the og:* tags below; they never execute the redirect script.
 */
export function buildShareHtml({ storyId, chapterNumber, storyTitle, chapterTitle, hook, coverUrl, found }) {
  const canonicalUrl = `${PUBLIC_WEB_BASE}/s/${encodeURIComponent(storyId)}/${chapterNumber}`;

  if (!found) {
    const title = 'కథ — Katha';
    const desc = 'Telugu stories that stay with you. No ads. No coins. ₹99/month.';
    return `<!DOCTYPE html>
<html lang="te"><head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)}</title>
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(desc)}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
<meta name="twitter:card" content="summary" />
</head><body><p>${escapeHtml(desc)} <a href="${escapeHtml(PUBLIC_WEB_BASE)}">${escapeHtml(PUBLIC_WEB_BASE)}</a></p></body></html>`;
  }

  const title = `${storyTitle}${chapterTitle ? ` — ${chapterTitle}` : ` — Chapter ${chapterNumber}`}`;
  const deepLink = `katha://s/${encodeURIComponent(storyId)}/${chapterNumber}`;

  return `<!DOCTYPE html>
<html lang="te"><head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)}</title>
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(hook)}" />
<meta property="og:type" content="article" />
<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
${coverUrl ? `<meta property="og:image" content="${escapeHtml(coverUrl)}" />` : ''}
<meta name="twitter:card" content="${coverUrl ? 'summary_large_image' : 'summary'}" />
<meta name="theme-color" content="#C4A052" />
<style>
  body{font-family:'Outfit',sans-serif;background:#FAF8F5;color:#1A1814;display:flex;flex-direction:column;
    align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:24px;margin:0}
  .cover{width:160px;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.15);margin-bottom:20px}
  a.cta{display:inline-block;margin-top:20px;padding:14px 28px;border-radius:999px;background:#C4A052;
    color:#1A1814;text-decoration:none;font-weight:600}
</style>
</head><body>
${coverUrl ? `<img class="cover" src="${escapeHtml(coverUrl)}" alt="" />` : ''}
<h1 style="font-size:20px;margin:0 0 8px">${escapeHtml(title)}</h1>
<p style="color:#8A847C;max-width:320px">${escapeHtml(hook)}</p>
<a class="cta" href="${escapeHtml(deepLink)}">Read on Katha</a>
${PLAY_STORE_URL ? `<p style="margin-top:16px;font-size:13px"><a href="${escapeHtml(PLAY_STORE_URL)}" style="color:#8A847C">Don't have the app? Get it here</a></p>` : ''}
<script>
  // Real visitors only — WhatsApp/Telegram crawlers never run this. If the app is
  // installed, the https App Link intent-filter (once verified) intercepts this
  // request before a browser ever loads it; this is the fallback for everyone else.
  setTimeout(function () { window.location.href = ${JSON.stringify(deepLink)}; }, 400);
</script>
</body></html>`;
}

shareRouter.get('/:storyId/:chapterNumber', async (req, res, next) => {
  try {
    const { storyId } = req.params;
    const chapterNumber = Number(req.params.chapterNumber);
    if (!Number.isInteger(chapterNumber) || chapterNumber < 1) {
      res.status(404).type('html').send(buildShareHtml({ found: false }));
      return;
    }

    let storyTitle;
    let chapterTitle;
    let hook;
    let coverUrl;
    let found = false;

    if (isMockMode()) {
      const story = getPublicStoriesForReader().find((s) => `${s.id}` === storyId);
      if (story) {
        found = true;
        storyTitle = story.title;
        hook = oneLineHook(story.description);
        coverUrl = story.cover_url;
        const chapter = getSeedChapters(storyId).find((c) => c.chapter_number === chapterNumber);
        chapterTitle = chapter?.title;
      }
    } else {
      const detail = await getPublicStoryDetail(storyId);
      if (detail) {
        const chapter = detail.chapters.find((c) => c.chapter_number === chapterNumber);
        found = true;
        storyTitle = detail.story.title;
        chapterTitle = chapter?.title;
        hook = oneLineHook(detail.story.description);
        coverUrl = detail.story.cover_url;
      }
    }

    res.set('Cache-Control', 'public, max-age=300');
    res.type('html').send(
      buildShareHtml({ storyId, chapterNumber, storyTitle, chapterTitle, hook, coverUrl, found }),
    );
  } catch (err) {
    next(err);
  }
});
