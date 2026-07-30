/** Story bible entities — Vol_03-05 Character Manager + Vol_03-06 World Builder */

export const LORE_CATEGORIES = [
  'location',
  'culture',
  'history',
  'rule',
  'glossary',
  'other',
] as const;

export type LoreCategory = (typeof LORE_CATEGORIES)[number];

export interface StoryCharacter {
  id: string;
  story_id: string;
  name: string;
  bio?: string | null;
  arc_summary?: string | null;
  traits?: string[];
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface StoryLoreEntry {
  id: string;
  story_id: string;
  category: LoreCategory;
  title: string;
  body?: string | null;
  glossary_term?: string | null;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface StoryCollaborationTask {
  id: string;
  story_id: string;
  title: string;
  status: 'open' | 'done';
  assignee_label?: string | null;
  due_at?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StoryMemberSummary {
  id: string;
  story_id: string;
  user_id: string;
  role: string;
  created_at?: string;
}

/** Vol_03-05-D2 — character presence in a chapter scene */
export interface SceneCharacterLink {
  id: string;
  story_id: string;
  chapter_number: number;
  scene_id: string;
  character_id: string;
  created_at?: string;
}

/** Plot chronology — continuous novel moat (timeline is expensive to rebuild). */
export interface StoryPlotEvent {
  id: string;
  story_id: string;
  chapter_number?: number | null;
  label: string;
  body?: string | null;
  when_label?: string | null;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export const RELATION_TYPES = [
  'family',
  'ally',
  'rival',
  'lover',
  'mentor',
  'enemy',
  'related',
] as const;

export type RelationType = (typeof RELATION_TYPES)[number];

export interface StoryCharacterRelationship {
  id: string;
  story_id: string;
  from_character_id: string;
  to_character_id: string;
  relation_type: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}