-- Wave 3a — event_submissions RLS (Security Council; migration 014 tables)
-- Legal & Trust: participants own submissions; organizers read for judging prep.

ALTER TABLE public.event_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_submissions_participant ON public.event_submissions;
CREATE POLICY event_submissions_participant ON public.event_submissions
  FOR ALL USING (
    registration_id IN (
      SELECT id FROM public.event_registrations WHERE participant_id = auth.uid()
    )
  )
  WITH CHECK (
    registration_id IN (
      SELECT id FROM public.event_registrations WHERE participant_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS event_submissions_organizer_read ON public.event_submissions;
CREATE POLICY event_submissions_organizer_read ON public.event_submissions
  FOR SELECT USING (
    event_id IN (SELECT id FROM public.events WHERE organizer_id = auth.uid())
  );

DROP POLICY IF EXISTS event_submissions_service ON public.event_submissions;
CREATE POLICY event_submissions_service ON public.event_submissions
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');