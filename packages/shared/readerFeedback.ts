/** Reader feedback — Vol_07-01 (distinct from peer reviewer feedback) */

export const READER_FEEDBACK_TYPES = [
  'written_review',
  'inline_chapter',
  'reaction',
  'content_issue',
  'accessibility',
  'translation',
  'spoiler_report',
  'suggestion',
] as const;
export type ReaderFeedbackType = (typeof READER_FEEDBACK_TYPES)[number];

export const READER_FEEDBACK_STATUSES = ['pending', 'published', 'resolved', 'archived'] as const;
export type ReaderFeedbackStatus = (typeof READER_FEEDBACK_STATUSES)[number];

export interface ReaderFeedback {
  id: string;
  story_id: string;
  chapter_number?: number | null;
  reader_id?: string | null;
  feedback_type: ReaderFeedbackType | string;
  body: string;
  status: ReaderFeedbackStatus | string;
  created_at?: string;
  updated_at?: string;
}