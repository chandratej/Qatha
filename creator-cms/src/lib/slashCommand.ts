/** Parse slash trigger line text (after leading whitespace) into filter string. */
export function parseSlashLine(lineText: string): { match: boolean; filter: string } {
  const match = lineText.match(/^\s*\/([^\s/]*)$/u);
  if (!match) return { match: false, filter: '' };
  return { match: true, filter: match[1] ?? '' };
}

export function commandMatchesPrefix(
  cmd: { id: string; label: string; desc?: string; group: string; keywords?: string[] },
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const fields = [cmd.id, cmd.label, cmd.desc, cmd.group, ...(cmd.keywords ?? [])]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());
  return fields.some((field) => field.startsWith(q));
}