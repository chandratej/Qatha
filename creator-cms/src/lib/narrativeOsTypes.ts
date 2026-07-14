/** Writing workflow phases — bottom nav drives a single active mode. */
export type WritingPhase = 'think' | 'structure' | 'write' | 'refine' | 'publish';

export const WRITING_PHASES: WritingPhase[] = ['think', 'structure', 'write', 'refine', 'publish'];

/** Narrative format modes — scene-level visual canvas (not separate data models). */
export type NarrativeFormat = 'novel' | 'chat' | 'letter' | 'choice';

export const NARRATIVE_FORMAT_LABELS: Record<NarrativeFormat, string> = {
  novel: 'Novel',
  chat: 'Chat Fiction',
  letter: 'Epistolary',
  choice: 'Interactive',
};

export const NARRATIVE_FORMAT_SPINE: Record<NarrativeFormat, string> = {
  novel: 'mode-novel',
  chat: 'mode-chat',
  letter: 'mode-letter',
  choice: 'mode-choice',
};

/** Clean interface for AI companion — real intelligence plugs in later. */
export interface CompanionSuggestion {
  id: string;
  title: string;
  body: string;
  actions?: { label: string; primary?: boolean; onClick?: () => void }[];
}

/** Momentum data for arrival screen — only shown when backed by real data. */
export interface ArrivalMomentum {
  storyTitle: string;
  lastSceneTitle?: string;
  wordCountYesterday?: number;
  progressPercent?: number;
}