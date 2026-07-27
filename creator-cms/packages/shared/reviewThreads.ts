/** Collaboration thread mentions — LRC-06-D5 / LRC-09-D3 */

export const THREAD_MENTION_AUTHOR = '@Author';
export const THREAD_MENTION_REVIEWER = '@Reviewer';

const MENTION_PATTERN = /@(Author|Reviewer)\b/gi;

export type ThreadMentionTarget = 'author' | 'reviewer';

export function parseThreadMentions(body: string): ThreadMentionTarget[] {
  const targets = new Set<ThreadMentionTarget>();
  const text = String(body || '');
  let match: RegExpExecArray | null;
  const re = new RegExp(MENTION_PATTERN.source, MENTION_PATTERN.flags);
  while ((match = re.exec(text)) !== null) {
    const token = match[1]?.toLowerCase();
    if (token === 'author') targets.add('author');
    if (token === 'reviewer') targets.add('reviewer');
  }
  return [...targets];
}

/** Default notify target when no explicit @mention — counterparty of reply role. */
export function defaultThreadNotifyTarget(role: 'author' | 'reviewer'): ThreadMentionTarget {
  return role === 'author' ? 'reviewer' : 'author';
}

export function resolveThreadNotifyTargets(
  body: string,
  role: 'author' | 'reviewer',
): ThreadMentionTarget[] {
  const explicit = parseThreadMentions(body);
  if (explicit.length) return explicit;
  return [defaultThreadNotifyTarget(role)];
}