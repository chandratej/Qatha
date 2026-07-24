-- 043 FIXED — previous 02 failed because public.content_reports already exists
-- from migration 014 with a DIFFERENT schema (target_type/target_id, not story_id).
-- This renames the legacy table, then creates the story-report + escrow objects.
SET search_path TO public, extensions;

-- Widen moderation_cases.case_type for content_report / copyright_claim
ALTER TABLE public.moderation_cases DROP CONSTRAINT IF EXISTS moderation_cases_case_type_check;
ALTER TABLE public.moderation_cases ADD CONSTRAINT moderation_cases_case_type_check
  CHECK (case_type IN (
    'review_dispute', 'reviewer_conduct', 'appeal', 'fraud_flag',
    'content_report', 'copyright_claim', 'content_report_appeal'
  ));

-- Rename legacy 014 governance reports if present (no story_id column)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'content_reports'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'content_reports' AND column_name = 'target_type'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'content_reports' AND column_name = 'story_id'
  ) THEN
    ALTER TABLE public.content_reports RENAME TO content_reports_legacy_014;
    RAISE NOTICE 'Renamed legacy content_reports -> content_reports_legacy_014';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('hate_controversial', 'copyright')),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (story_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_content_reports_story
  ON public.content_reports (story_id, created_at DESC);

ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS content_reports_service ON public.content_reports;
CREATE POLICY content_reports_service ON public.content_reports
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
DROP POLICY IF EXISTS content_reports_reporter_read ON public.content_reports;
CREATE POLICY content_reports_reporter_read ON public.content_reports
  FOR SELECT USING (reporter_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.story_moderation_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  moderation_case_id UUID REFERENCES public.moderation_cases(id) ON DELETE SET NULL,
  path TEXT NOT NULL CHECK (path IN ('hate_controversial', 'copyright')),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'appeal_pending', 'cleared', 'confirmed_violation', 'archived')),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verdict_at TIMESTAMPTZ,
  verdict_notes TEXT,
  appeal_deadline_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_story_moderation_windows_story
  ON public.story_moderation_windows (story_id, opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_story_moderation_windows_open
  ON public.story_moderation_windows (status) WHERE status IN ('open', 'appeal_pending');

ALTER TABLE public.story_moderation_windows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS story_moderation_windows_service ON public.story_moderation_windows;
CREATE POLICY story_moderation_windows_service ON public.story_moderation_windows
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE TABLE IF NOT EXISTS public.copyright_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderation_window_id UUID NOT NULL REFERENCES public.story_moderation_windows(id) ON DELETE CASCADE,
  claimant_contact TEXT NOT NULL,
  original_work_description TEXT NOT NULL,
  infringing_content_description TEXT NOT NULL,
  response_window_days INT NOT NULL DEFAULT 14,
  response_deadline_at TIMESTAMPTZ NOT NULL,
  author_notified_at TIMESTAMPTZ,
  author_response TEXT,
  author_response_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.copyright_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS copyright_claims_service ON public.copyright_claims;
CREATE POLICY copyright_claims_service ON public.copyright_claims
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE TABLE IF NOT EXISTS public.story_earnings_escrow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  moderation_window_id UUID NOT NULL REFERENCES public.story_moderation_windows(id) ON DELETE CASCADE,
  amount_inr NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'escrow' CHECK (status IN ('escrow', 'released', 'forfeited')),
  accrual_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  accrual_period_end TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_story_earnings_escrow_story
  ON public.story_earnings_escrow (story_id, status);

ALTER TABLE public.story_earnings_escrow ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS story_earnings_escrow_service ON public.story_earnings_escrow;
CREATE POLICY story_earnings_escrow_service ON public.story_earnings_escrow
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

ALTER TABLE public.reader_feedback
  ADD COLUMN IF NOT EXISTS moderation_flagged BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.reader_feedback
  ADD COLUMN IF NOT EXISTS moderation_reason TEXT;
