/** True when scene HTML has user-visible text (not placeholder-only). */
export function sceneHasContent(html: string | undefined): boolean {
  if (!html) return false;
  const div = document.createElement('div');
  div.innerHTML = html;
  const text = (div.textContent || '').replace(/\s+/g, ' ').trim();
  if (!text) return false;
  if (text === 'Start writing…' || text === 'Start writing...') return false;
  return true;
}