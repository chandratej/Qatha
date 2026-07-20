-- CLI migration runner resets search_path per-file; uuid-ossp/pg_trgm live in extensions.
SET search_path TO public, extensions;

-- Wave 4b — Reader feedback inbox (Vol_07-01-D1)
-- Trust & Safety: separate reader UGC from peer reviewer schema.

CREATE TABLE IF NOT EXISTS public.reader_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_number INT CHECK (chapter_number IS NULL OR chapter_number > 0),
  reader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  feedback_type TEXT NOT NULL DEFAULT 'written_review'
    CHECK (feedback_type IN (
      'written_review', 'inline_chapter', 'reaction', 'content_issue',
      'accessibility', 'translation', 'spoiler_report', 'suggestion'
    )),
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('pending', 'published', 'resolved', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reader_feedback_story ON public.reader_feedback(story_id, created_at DESC);

ALTER TABLE public.reader_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY reader_feedback_story_read ON public.reader_feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.story_members sm
      WHERE sm.story_id = reader_feedback.story_id
        AND sm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = reader_feedback.story_id AND s.author_id = auth.uid()
    )
  );

CREATE POLICY reader_feedback_story_update ON public.reader_feedback
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = reader_feedback.story_id AND s.author_id = auth.uid()
    )
  );