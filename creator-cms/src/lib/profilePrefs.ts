const KEY = 'katha_creator_profile';

export interface CreatorProfilePrefs {
  penName: string;
  tagline: string;
  bio: string;
  genres: string[];
  website: string;
  twitter: string;
}

const DEFAULTS: CreatorProfilePrefs = {
  penName: '',
  tagline: '',
  bio: '',
  genres: [],
  website: '',
  twitter: '',
};

export function loadCreatorProfile(displayName = 'Creator'): CreatorProfilePrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS, penName: displayName };
    return { ...DEFAULTS, penName: displayName, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS, penName: displayName };
  }
}

export function saveCreatorProfile(prefs: Partial<CreatorProfilePrefs>) {
  const current = loadCreatorProfile(prefs.penName);
  const next = { ...current, ...prefs };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}