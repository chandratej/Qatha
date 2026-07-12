-- Migration 034: Agreement consent + review analytics events (Wave 7)
-- Legal & Trust: agreement version audit (LRC-02-D8, Foundations §1.1)
-- Data Council: reproducible analytics from DB (LRC-17-D3)

ALTER TABLE public.reviewer_profiles
  ADD COLUMN IF NOT EXISTS agreement_version TEXT,
  ADD COLUMN IF NOT EXISTS agreement_accepted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.review_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  request_id UUID REFERENCES public.peer_review_requests(id) ON DELETE SET NULL,
  assignment_id UUID REFERENCES public.peer_review_assignments(id) ON DELETE SET NULL,
  actor_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_analytics_events_type
  ON public.review_analytics_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_review_analytics_events_request
  ON public.review_analytics_events (request_id)
  WHERE request_id IS NOT NULL;