-- Migration 018: RLS for Wave 1 tables + backfill story owners

-- Backfill owners for existing stories (idempotent)
INSERT INTO public.story_members (story_id, user_id, role, granted_by)
SELECT s.id, s.author_id, 'owner', s.author_id
FROM public.stories s
ON CONFLICT (story_id, user_id) DO NOTHING;

-- story_members RLS
ALTER TABLE public.story_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS story_members_select ON public.story_members;
CREATE POLICY story_members_select ON public.story_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR story_id IN (SELECT id FROM public.stories WHERE author_id = auth.uid())
  );

DROP POLICY IF EXISTS story_members_manage_owner ON public.story_members;
CREATE POLICY story_members_manage_owner ON public.story_members
  FOR ALL USING (
    story_id IN (
      SELECT story_id FROM public.story_members sm
      WHERE sm.user_id = auth.uid() AND sm.role = 'owner'
    )
    OR story_id IN (SELECT id FROM public.stories WHERE author_id = auth.uid())
  )
  WITH CHECK (
    story_id IN (SELECT id FROM public.stories WHERE author_id = auth.uid())
    OR granted_by = auth.uid()
  );

-- peer_review_assignments RLS (reviewers see own slot via service role; authors via request)
ALTER TABLE public.peer_review_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS peer_review_assignments_author ON public.peer_review_assignments;
CREATE POLICY peer_review_assignments_author ON public.peer_review_assignments
  FOR SELECT USING (
    request_id IN (
      SELECT id FROM public.peer_review_requests WHERE author_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS peer_review_assignments_service ON public.peer_review_assignments;
CREATE POLICY peer_review_assignments_service ON public.peer_review_assignments
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- peer_review_requests — author owns their requests
ALTER TABLE public.peer_review_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS peer_review_requests_author ON public.peer_review_requests;
CREATE POLICY peer_review_requests_author ON public.peer_review_requests
  FOR ALL USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS peer_review_requests_service ON public.peer_review_requests;
CREATE POLICY peer_review_requests_service ON public.peer_review_requests
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- notifications — own feed only
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_own ON public.notifications;
CREATE POLICY notifications_own ON public.notifications
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_service ON public.notifications;
CREATE POLICY notifications_service ON public.notifications
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- state_transition_logs — read via service; insert via service
ALTER TABLE public.state_transition_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS state_transition_logs_service ON public.state_transition_logs;
CREATE POLICY state_transition_logs_service ON public.state_transition_logs
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- tags — public read, moderated write
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tags_public_read ON public.tags;
CREATE POLICY tags_public_read ON public.tags
  FOR SELECT USING (true);

DROP POLICY IF EXISTS tags_service_write ON public.tags;
CREATE POLICY tags_service_write ON public.tags
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- tag_requests — requester sees own
ALTER TABLE public.tag_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tag_requests_own ON public.tag_requests;
CREATE POLICY tag_requests_own ON public.tag_requests
  FOR ALL USING (requester_id = auth.uid())
  WITH CHECK (requester_id = auth.uid());

DROP POLICY IF EXISTS tag_requests_moderator ON public.tag_requests;
CREATE POLICY tag_requests_moderator ON public.tag_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('moderator', 'admin'))
  );

-- events platform tables (migration 014) — enable RLS where missing
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS events_public_read ON public.events;
CREATE POLICY events_public_read ON public.events
  FOR SELECT USING (status IN ('registration_open', 'submissions_open', 'published', 'judging'));

DROP POLICY IF EXISTS events_organizer_write ON public.events;
CREATE POLICY events_organizer_write ON public.events
  FOR ALL USING (organizer_id = auth.uid())
  WITH CHECK (organizer_id = auth.uid());

DROP POLICY IF EXISTS events_service ON public.events;
CREATE POLICY events_service ON public.events
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_registrations_own ON public.event_registrations;
CREATE POLICY event_registrations_own ON public.event_registrations
  FOR ALL USING (participant_id = auth.uid())
  WITH CHECK (participant_id = auth.uid());

DROP POLICY IF EXISTS event_registrations_organizer_read ON public.event_registrations;
CREATE POLICY event_registrations_organizer_read ON public.event_registrations
  FOR SELECT USING (
    event_id IN (SELECT id FROM public.events WHERE organizer_id = auth.uid())
  );

DROP POLICY IF EXISTS event_registrations_service ON public.event_registrations;
CREATE POLICY event_registrations_service ON public.event_registrations
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');