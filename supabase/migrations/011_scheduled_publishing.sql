-- Scheduled chapter publishing: creators pick a future datetime for auto-publish

ALTER TYPE chapter_status ADD VALUE IF NOT EXISTS 'scheduled';

ALTER TABLE public.chapters
  ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_chapters_scheduled_publish
  ON public.chapters (scheduled_publish_at)
  WHERE scheduled_publish_at IS NOT NULL;