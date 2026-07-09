/** URL slug for Trojan Horse gateway share links */

export function slugifyTitle(title) {
  const ascii = (title || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

  return ascii.length >= 3 ? ascii : '';
}

export async function generateUniqueStorySlug(supabase, title, storyId = null) {
  const base = slugifyTitle(title) || `story-${(storyId || '').replace(/-/g, '').slice(0, 12) || Date.now()}`;
  let slug = base;
  let n = 0;

  while (n < 100) {
    let query = supabase.from('stories').select('id').eq('slug', slug);
    if (storyId) query = query.neq('id', storyId);
    const { data } = await query.maybeSingle();
    if (!data) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }

  return `${base}-${Date.now()}`;
}