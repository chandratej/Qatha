/**
 * Wave C (C7): Mark interim Node routes superseded by Supabase direct + Edge Functions.
 * CMS clients should use creator-cms supabaseData.ts when VITE_USE_SUPABASE_DIRECT is enabled.
 */

const CMS_DEPRECATED_PATHS = [
  { prefix: '/api/creators', migrate: 'Supabase RLS + get_creator_dashboard RPC' },
  { prefix: '/api/moderation', migrate: 'Supabase RLS + review-chapter Edge Function' },
  { prefix: '/api/upload', migrate: 'Supabase Storage story-covers bucket' },
  { prefix: '/api/engagement/creator-milestones', migrate: 'Supabase creator_milestones RLS' },
];

const CHAPTER_WRITE_PATTERN = /^\/api\/chapters\/[^/]+\/(draft|publish)$/;

export function deprecationHeaders() {
  return (req, res, next) => {
    const path = req.originalUrl?.split('?')[0] || req.path;
    const match = CMS_DEPRECATED_PATHS.find((r) => path.startsWith(r.prefix))
      || (CHAPTER_WRITE_PATTERN.test(path) ? { migrate: 'Supabase chapter_drafts RLS + publish-chapter EF' } : null)
      || (path === '/api/subscriptions/webhook' ? { migrate: 'payment-webhook Edge Function' } : null);

    if (match) {
      res.setHeader('Deprecation', 'true');
      res.setHeader('X-Katha-Migrate-To', match.migrate);
      if (process.env.LOG_DEPRECATED_ROUTES === 'true') {
        console.warn(`[Deprecated CMS route] ${req.method} ${path} → ${match.migrate}`);
      }
    }
    next();
  };
}