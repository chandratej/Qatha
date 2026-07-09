import { supabase } from './supabase';

/** Open gateway share link with creator session so authors see full chapter preview. */
export async function openShareLinkAsAuthor(url: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token && session.refresh_token) {
      const hash = new URLSearchParams({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      }).toString();
      window.open(`${url}#${hash}`, '_blank', 'noopener,noreferrer');
      return;
    }
  } catch {
    /* fall through */
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}