import type { ReviewCategoryId } from '../types/reviewWorkspace';
import type { ReviewLanguage } from './reviewLanguagePrefs';

export const REVIEW_CATEGORY_LABELS: Record<ReviewCategoryId, string> = {
  plot: 'Plot',
  character: 'Character',
  dialogue: 'Dialogue',
  grammar: 'Grammar',
  emotion: 'Emotion',
  logic: 'Logic',
  continuity: 'Continuity',
  formatting: 'Formatting',
  pacing: 'Pacing',
  scene_transition: 'Scene Transition',
  world_building: 'World Building',
  reader_engagement: 'Reader Engagement',
  hook: 'Hook',
  ending: 'Ending',
  cliffhanger: 'Cliffhanger',
  foreshadowing: 'Foreshadowing',
  consistency: 'Consistency',
  theme: 'Theme',
  cultural_authenticity: 'Cultural Authenticity',
  language: 'Language',
  readability: 'Readability',
};

export const REVIEW_CATEGORY_LABELS_TE: Record<ReviewCategoryId, string> = {
  plot: 'కథానకం',
  character: 'పాత్ర',
  dialogue: 'సంభాషణ',
  grammar: 'వ్యాకరణం',
  emotion: 'భావోద్వేగం',
  logic: 'తార్కికత',
  continuity: 'క్రమశిక్షణ',
  formatting: 'ఆకృతి',
  pacing: 'వేగం',
  scene_transition: 'దృశ్య మార్పు',
  world_building: 'ప్రపంచ నిర్మాణం',
  reader_engagement: 'పాఠకుల ఆకర్షణ',
  hook: 'ఆకర్షణ',
  ending: 'ముగింపు',
  cliffhanger: 'సస్పెన్స్',
  foreshadowing: 'మునుజూపు',
  consistency: 'స్థిరత్వం',
  theme: 'థీమ్',
  cultural_authenticity: 'సాంస్కృతిక ప్రామాణికత',
  language: 'భాష',
  readability: 'చదవడం సౌకర్యం',
};

export const FLOATING_TOOLBAR_ACTIONS = [
  { id: 'comment', label: 'Add Comment', kind: 'comment' as const },
  { id: 'suggest', label: 'Suggest Rewrite', kind: 'suggestion' as const },
  { id: 'critical', label: 'Mark Critical', category: 'plot' as ReviewCategoryId, priority: 'critical' as const },
  { id: 'logic', label: 'Logic Issue', category: 'logic' as ReviewCategoryId },
  { id: 'character', label: 'Character Issue', category: 'character' as ReviewCategoryId },
  { id: 'dialogue', label: 'Dialogue Issue', category: 'dialogue' as ReviewCategoryId },
  { id: 'continuity', label: 'Continuity Issue', category: 'continuity' as ReviewCategoryId },
  { id: 'grammar', label: 'Grammar', category: 'grammar' as ReviewCategoryId },
  { id: 'emotion', label: 'Emotion', category: 'emotion' as ReviewCategoryId },
  { id: 'pacing', label: 'Pacing', category: 'pacing' as ReviewCategoryId },
  { id: 'world', label: 'World Building', category: 'world_building' as ReviewCategoryId },
  { id: 'foreshadowing', label: 'Foreshadowing', category: 'foreshadowing' as ReviewCategoryId },
  { id: 'plot_hole', label: 'Plot Hole', category: 'plot' as ReviewCategoryId, priority: 'critical' as const },
  { id: 'consistency', label: 'Consistency', category: 'consistency' as ReviewCategoryId },
  { id: 'formatting', label: 'Formatting', category: 'formatting' as ReviewCategoryId },
  { id: 'reading', label: 'Reading Experience', category: 'readability' as ReviewCategoryId },
];

export function categoryLabel(id: ReviewCategoryId | string, language: ReviewLanguage = 'english'): string {
  const en = REVIEW_CATEGORY_LABELS[id as ReviewCategoryId] ?? id.replace(/_/g, ' ');
  const te = REVIEW_CATEGORY_LABELS_TE[id as ReviewCategoryId];
  if (language === 'telugu' && te) return te;
  if (language === 'bilingual' && te) return `${te} · ${en}`;
  return en;
}