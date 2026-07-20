-- CLI migration runner resets search_path per-file; uuid-ossp/pg_trgm live in extensions.
SET search_path TO public, extensions;

-- Migration 033: Wave 5 — advisory AI suggestions audit trail (LRC-07-D3)

CREATE TABLE IF NOT EXISTS public.ai_review_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL,
  request_id UUID NOT NULL REFERENCES public.peer_review_requests(id) ON DELETE CASCADE,
  reviewer_slot TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'craft',
  body TEXT NOT NULL,
  evidence TEXT NOT NULL DEFAULT '',
  confidence NUMERIC(4,3) NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'ignored')),
  provider TEXT NOT NULL DEFAULT 'heuristic' CHECK (provider IN ('heuristic', 'xai')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_review_suggestions_assignment
  ON public.ai_review_suggestions(assignment_id, status, created_at DESC);

ALTER TABLE public.ai_review_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_review_suggestions_service ON public.ai_review_suggestions;
CREATE POLICY ai_review_suggestions_service ON public.ai_review_suggestions
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');