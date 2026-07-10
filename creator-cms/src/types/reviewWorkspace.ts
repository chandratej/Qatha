/** Review workspace — literary council craft surface */

export const REVIEW_CATEGORIES = [
  'plot', 'character', 'dialogue', 'grammar', 'emotion', 'logic', 'continuity',
  'formatting', 'pacing', 'scene_transition', 'world_building', 'reader_engagement',
  'hook', 'ending', 'cliffhanger', 'foreshadowing', 'consistency', 'theme',
  'cultural_authenticity', 'language', 'readability',
] as const;

export type ReviewCategoryId = (typeof REVIEW_CATEGORIES)[number];

export type CommentPriority = 'low' | 'medium' | 'high' | 'critical';
export type CommentStatus = 'open' | 'resolved' | 'pinned';
export type CommentKind = 'comment' | 'suggestion' | 'question';

export interface TextSelectionAnchor {
  chapterNum: number;
  sceneId: string;
  paragraphIndex: number;
  sentenceIndex?: number;
  startOffset: number;
  endOffset: number;
  selectedText: string;
}

export interface TrackChangeRecord {
  id: string;
  chapterNum: number;
  paragraphIndex: number;
  kind: 'insertion' | 'deletion' | 'replacement';
  originalText: string;
  suggestedText: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface ReviewComment {
  id: string;
  kind: CommentKind;
  chapterNum: number;
  sceneId?: string;
  paragraphIndex: number;
  sentenceIndex?: number;
  category: ReviewCategoryId;
  priority: CommentPriority;
  reason: string;
  recommendation: string;
  expectedImpact: string;
  reviewerConfidence: number;
  evidence?: string;
  relatedCommentIds: string[];
  status: CommentStatus;
  selectedText?: string;
  anchor?: TextSelectionAnchor;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewChecklistItem {
  id: string;
  label: string;
  category?: ReviewCategoryId;
  completed: boolean;
  autoComplete: boolean;
}

export interface ReviewSummaryDraft {
  overallReview: string;
  strengths: string;
  weaknesses: string;
  recommendation: string;
  decision: 'accept' | 'minor_revision' | 'major_revision' | 'reject' | '';
  visibleToAuthor: boolean;
  internalNotes: string;
}

export interface ReviewWorkspaceMetrics {
  timeSpentMinutes: number;
  commentsCount: number;
  suggestionsCount: number;
  questionsCount: number;
  criticalCount: number;
  openCount: number;
  resolvedCount: number;
}

export interface ReviewWorkspacePrefs {
  focusMode: boolean;
  distractionFree: boolean;
  readingRuler: boolean;
  splitReview: boolean;
  showTrackChanges: boolean;
  zoom: 90 | 100 | 110 | 125;
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;
  bottomPanelCollapsed: boolean;
}

export interface ReviewWorkspaceDraft {
  assignmentId: string;
  requestId: string;
  startedAt: string;
  lastSavedAt: string;
  currentChapter: number;
  currentSceneId?: string;
  chaptersReviewed: number[];
  comments: ReviewComment[];
  trackChanges: TrackChangeRecord[];
  checklist: ReviewChecklistItem[];
  summary: ReviewSummaryDraft;
  metrics: ReviewWorkspaceMetrics;
  prefs: ReviewWorkspacePrefs;
}

export interface BlindManuscriptScene {
  id: string;
  index: number;
  title: string;
  paragraphs: BlindManuscriptParagraph[];
  wordCount: number;
  estimatedMinutes: number;
}

export interface BlindManuscriptChapter {
  num: number;
  label: string;
  scenes: BlindManuscriptScene[];
  paragraphs: BlindManuscriptParagraph[];
  wordCount: number;
  estimatedMinutes: number;
}

export interface BlindManuscriptParagraph {
  id: string;
  index: number;
  sceneId: string;
  sceneTitle?: string;
  html: string;
  plainText: string;
}

export interface BlindManuscript {
  label: string;
  genre: string;
  reviewType: string;
  wordCount: number;
  estimatedReadingMinutes: number;
  trustLevel: string;
  reviewFee: number;
  mode: 'volunteer' | 'paid';
  deadline: string;
  chapters: BlindManuscriptChapter[];
}

export interface ReviewerProfileSnapshot {
  rqi: number;
  potentialRqi: number;
  councilLevel: string;
  expertise: string[];
  acceptanceRate: number;
  reviewStreak: number;
  badges: string[];
}

export interface StoryIntelligenceSnapshot {
  sqi: number;
  categoryScores: Record<string, number>;
  readerEngagement: number;
  completionPrediction: number;
  reviewReadiness: number;
  strengths: string[];
  weaknesses: string[];
  improvementOpportunities: string[];
}