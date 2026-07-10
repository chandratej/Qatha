/** PRD §4 — Fixed genres (14) + legacy MVP aliases */

export const PRD_GENRES = [
  { id: 'romance', label: 'Romance', labelTelugu: 'ప్రేమ కథలు' },
  { id: 'horror', label: 'Horror', labelTelugu: 'భయానకం' },
  { id: 'thriller', label: 'Thriller', labelTelugu: 'థ్రిల్లర్' },
  { id: 'mystery', label: 'Mystery', labelTelugu: 'రహస్యం' },
  { id: 'comedy', label: 'Comedy', labelTelugu: 'హాస్యం' },
  { id: 'drama', label: 'Drama', labelTelugu: 'నాటకం' },
  { id: 'historical', label: 'Historical', labelTelugu: 'చారిత్రకం' },
  { id: 'mythology', label: 'Mythology', labelTelugu: 'పురాణం' },
  { id: 'fantasy', label: 'Fantasy', labelTelugu: 'ఫాంటసీ' },
  { id: 'sci_fi', label: 'Sci-Fi', labelTelugu: 'సై-ఫై' },
  { id: 'adventure', label: 'Adventure', labelTelugu: 'సాహసం' },
  { id: 'literary', label: 'Literary', labelTelugu: 'సాహిత్యం' },
  { id: 'crime', label: 'Crime', labelTelugu: 'నేరం' },
  { id: 'slice_of_life', label: 'Slice of Life', labelTelugu: 'జీవిత చిత్రం' },
  /** Legacy MVP genre — maps to drama */
  { id: 'family_drama', label: 'Family Drama', labelTelugu: 'కుటుంబ నాటకం', mapsTo: 'drama' },
  /** Legacy MVP genre — maps to thriller */
  { id: 'suspense', label: 'Suspense', labelTelugu: 'సస్పెన్స్', mapsTo: 'thriller' },
] as const;

export type GenreId = (typeof PRD_GENRES)[number]['id'];

export function genreLabel(id: string): string {
  return PRD_GENRES.find((g) => g.id === id)?.label ?? id;
}

/** Reader discover weights — romance-led Telugu market */
export const GENRE_DISCOVER_WEIGHTS: Record<string, number> = {
  romance: 0.22,
  family_drama: 0.12,
  drama: 0.12,
  suspense: 0.08,
  thriller: 0.08,
  mythology: 0.08,
  historical: 0.06,
  comedy: 0.05,
  fantasy: 0.05,
  horror: 0.04,
  mystery: 0.04,
  literary: 0.03,
  slice_of_life: 0.03,
};