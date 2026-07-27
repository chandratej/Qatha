/** PRD §7 — Contest framework roadmap */

export const CONTEST_ROADMAP = [
  { id: 'debut_season', label: 'Katha Debut Season', phase: 'launch', status: 'active' },
  { id: 'monthly_genre_contest', label: 'Monthly Genre Contest', phase: 'recurring', status: 'active' },
  { id: 'festival_contest', label: 'Festival Contest', phase: 'recurring', status: 'active' },
  { id: 'weekly_short_story_collection', label: 'Weekly Short Story Collection', phase: 'recurring', status: 'planned' },
  { id: 'monthly_short_story_collection', label: 'Monthly Short Story Collection', phase: 'recurring', status: 'planned' },
  { id: 'hundred_day_serialization', label: '100-Day Serialization', phase: 'advanced', status: 'planned' },
  { id: 'reader_choice_ending', label: "Reader's Choice Ending", phase: 'advanced', status: 'planned' },
  { id: 'adaptation_challenge', label: 'Adaptation / IP Contest', phase: 'advanced', status: 'planned' },
] as const;

export const CONTEST_REWARDS = [
  { id: 'cash', label: 'Cash' },
  { id: 'story_badge', label: 'Story Badge' },
  { id: 'promotion', label: 'Promotion' },
  { id: 'publishing_deal', label: 'Publishing Deal' },
  { id: 'adaptation_opportunity', label: 'Adaptation Opportunity' },
] as const;