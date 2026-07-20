-- CLI migration runner resets search_path per-file; uuid-ossp/pg_trgm live in extensions.
SET search_path TO public, extensions;

-- Migration 032: Wave 3 — revision rounds, reputation events, moderation cases
-- LRC-08-D4, LRC-10-D4, LRC-13-D6, LRC-12-D3

ALTER TABLE public.peer_review_requests
  ADD COLUMN IF NOT EXISTS revision_round INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revision_notes TEXT,
  ADD COLUMN IF NOT EXISTS last_resubmitted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.reputation_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  delta_rqi NUMERIC(6,2) NOT NULL DEFAULT 0,
  reason TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reputation_events_profile ON public.reputation_events(profile_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.moderation_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_type TEXT NOT NULL CHECK (case_type IN ('review_dispute', 'reviewer_conduct', 'appeal', 'fraud_flag')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  request_id UUID REFERENCES public.peer_review_requests(id) ON DELETE SET NULL,
  reason TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_moderation_cases_status ON public.moderation_cases(status, created_at DESC);

ALTER TABLE public.reputation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reputation_events_self ON public.reputation_events;
CREATE POLICY reputation_events_self ON public.reputation_events
  FOR SELECT USING (profile_id = auth.uid());

DROP POLICY IF EXISTS reputation_events_service ON public.reputation_events;
CREATE POLICY reputation_events_service ON public.reputation_events
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS moderation_cases_service ON public.moderation_cases;
CREATE POLICY moderation_cases_service ON public.moderation_cases
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS moderation_cases_reporter ON public.moderation_cases;
CREATE POLICY moderation_cases_reporter ON public.moderation_cases
  FOR SELECT USING (reporter_id = auth.uid());