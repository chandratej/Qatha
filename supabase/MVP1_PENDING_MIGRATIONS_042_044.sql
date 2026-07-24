-- SAFE PACK 042-044 — prefer running 01, then 02, then 03 separately if one errors

-- ========== supabase\apply_manual\01_042_free_chapter.sql ==========
-- 042 free-chapter threshold (safe apply â€” run alone first)
SET search_path TO public, extensions;

ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS free_chapter_count INT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS free_chapter_count_source TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS free_chapter_cohort TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS ever_reached_performing_at TIMESTAMPTZ;

UPDATE public.stories
  SET free_chapter_count_source = 'auto'
  WHERE free_chapter_count_source IS NULL;

ALTER TABLE public.stories
  ALTER COLUMN free_chapter_count_source SET DEFAULT 'auto';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'stories_free_chapter_count_source_check'
  ) THEN
    ALTER TABLE public.stories
      ADD CONSTRAINT stories_free_chapter_count_source_check
      CHECK (free_chapter_count_source IN ('auto', 'override'));
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'constraint stories_free_chapter_count_source_check: %', SQLERRM;
END $$;

ALTER TABLE public.stories
  ALTER COLUMN free_chapter_count_source SET NOT NULL;

CREATE OR REPLACE FUNCTION public.stamp_story_ever_reached_performing()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trust_level IN ('performing', 'catalyst', 'anchor', 'apex')
     AND NEW.ever_reached_performing_at IS NULL THEN
    NEW.ever_reached_performing_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stamp_story_ever_reached_performing ON public.stories;
CREATE TRIGGER trg_stamp_story_ever_reached_performing
  BEFORE INSERT OR UPDATE OF trust_level ON public.stories
  FOR EACH ROW EXECUTE PROCEDURE public.stamp_story_ever_reached_performing();

UPDATE public.stories
  SET ever_reached_performing_at = now()
  WHERE trust_level IN ('performing', 'catalyst', 'anchor', 'apex')
    AND ever_reached_performing_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_stories_author_ever_performing
  ON public.stories (author_id)
  WHERE ever_reached_performing_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.reader_story_sample_locks (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  free_chapter_count INT NOT NULL,
  free_chapter_source TEXT NOT NULL,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, story_id)
);

ALTER TABLE public.reader_story_sample_locks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reader owns their sample lock" ON public.reader_story_sample_locks;
CREATE POLICY "reader owns their sample lock" ON public.reader_story_sample_locks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS reader_story_sample_locks_service ON public.reader_story_sample_locks;
CREATE POLICY reader_story_sample_locks_service ON public.reader_story_sample_locks
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');


-- ========== supabase\apply_manual\02_043_moderation_escrow.sql ==========
-- 043 moderation escrow / reporting (safe apply â€” run after 01 succeeds)
SET search_path TO public, extensions;

ALTER TABLE public.moderation_cases DROP CONSTRAINT IF EXISTS moderation_cases_case_type_check;
ALTER TABLE public.moderation_cases ADD CONSTRAINT moderation_cases_case_type_check
  CHECK (case_type IN (
    'review_dispute', 'reviewer_conduct', 'appeal', 'fraud_flag',
    'content_report', 'copyright_claim', 'content_report_appeal'
  ));

CREATE TABLE IF NOT EXISTS public.content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('hate_controversial', 'copyright')),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (story_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_content_reports_story ON public.content_reports (story_id, created_at DESC);

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


-- ========== supabase\apply_manual\03_044_pricing_founding.sql ==========
-- 044 pricing / founding author + payment idempotency (safe apply â€” run after 02 succeeds)
SET search_path TO public, extensions;

ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS billing_cycle TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS reference_net_amount_paise INT;

UPDATE public.subscriptions
  SET billing_cycle = 'monthly'
  WHERE billing_cycle IS NULL;

ALTER TABLE public.subscriptions
  ALTER COLUMN billing_cycle SET DEFAULT 'monthly';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_billing_cycle_check'
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_billing_cycle_check
      CHECK (billing_cycle IN ('monthly', 'quarterly', 'annual'));
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'billing_cycle check: %', SQLERRM;
END $$;

ALTER TABLE public.subscriptions
  ALTER COLUMN billing_cycle SET NOT NULL;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS founding_cohort_enrolled_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS founding_cohort_scope TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS founding_cohort_acceleration_ends_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_founding_cohort_scope_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_founding_cohort_scope_check
      CHECK (
        founding_cohort_scope IS NULL
        OR founding_cohort_scope IN ('per_author', 'per_story')
      );
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'founding scope check: %', SQLERRM;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_founding_cohort
  ON public.profiles (founding_cohort_enrolled_at)
  WHERE founding_cohort_enrolled_at IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_razorpay_payment_id
  ON public.subscriptions (razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL;

