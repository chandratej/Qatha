import { phoneticToTelugu } from './phonetic';

function fold(text: string): string {
  return text.trim().toLocaleLowerCase('en');
}

/** Roman keystrokes → Telugu variants for matching scene titles. */
function queryVariants(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const variants = new Set<string>([fold(trimmed)]);

  trimmed.split(/\s+/).forEach((word) => {
    if (/^[a-zA-Z.\-']+$/.test(word)) {
      variants.add(fold(phoneticToTelugu(word)));
    }
  });

  if (/^[a-zA-Z.\-'\s]+$/.test(trimmed)) {
    const converted = trimmed
      .split(/\s+/)
      .map((word) => (/^[a-zA-Z.\-']+$/.test(word) ? phoneticToTelugu(word) : word))
      .join(' ');
    variants.add(fold(converted));
  }

  return [...variants].filter(Boolean);
}

/** Match scene title against English or Telugu search (incl. phonetic roman input). */
export function sceneTitleMatchesQuery(title: string, query: string): boolean {
  const q = query.trim();
  if (!q) return true;

  const titleFolded = fold(title);
  return queryVariants(q).some((variant) => titleFolded.includes(variant));
}