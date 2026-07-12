-- Wave 4c — Reader feedback submit path (Vol_07-01 reader-app)
-- Trust & Safety: readers may insert own feedback; creators resolve via existing UPDATE policy.

CREATE POLICY reader_feedback_reader_insert ON public.reader_feedback
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND (reader_id IS NULL OR reader_id = auth.uid())
  );