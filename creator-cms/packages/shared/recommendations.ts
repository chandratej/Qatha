/** PRD §11 — Rule-based recommendation signals (no AI) */

export const RECOMMENDATION_SIGNALS = [
  { id: 'genres', weight: 0.2, status: 'live' },
  { id: 'tags', weight: 0.15, status: 'planned' },
  { id: 'reading_completion', weight: 0.15, status: 'partial' },
  { id: 'likes', weight: 0.1, status: 'planned' },
  { id: 'bookmarks', weight: 0.1, status: 'planned' },
  { id: 'reading_streak', weight: 0.05, status: 'planned' },
  { id: 'similar_readers', weight: 0.1, status: 'planned' },
  { id: 'trending', weight: 0.15, status: 'live' },
] as const;

export const READER_SYSTEMS = [
  { id: 'home', label: 'Home', status: 'live' },
  { id: 'discover', label: 'Discover', status: 'live' },
  { id: 'genres', label: 'Genres', status: 'partial' },
  { id: 'tags', label: 'Tags', status: 'planned' },
  { id: 'reading_lists', label: 'Reading Lists', status: 'planned' },
  { id: 'bookmarks', label: 'Bookmarks', status: 'planned' },
  { id: 'reading_history', label: 'Reading History', status: 'partial' },
  { id: 'continue_reading', label: 'Continue Reading', status: 'live' },
  { id: 'offline_reading', label: 'Offline Reading', status: 'partial' },
  { id: 'clubs', label: 'Clubs', status: 'planned' },
  { id: 'seasonal_collections', label: 'Seasonal Collections', status: 'planned' },
  { id: 'achievements', label: 'Achievements', status: 'planned' },
  { id: 'follow_authors', label: 'Follow Authors', status: 'planned' },
] as const;