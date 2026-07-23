-- CLI migration runner resets search_path per-file; uuid-ossp/pg_trgm live in extensions.
SET search_path TO public, extensions;

-- 044: Commission/payout/pricing model — billing cycles + founding-author cohort tracking.
-- See Worklog/23 JUL 2026/katha-commission-payout-pricing-model-prompt.md

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT NOT NULL DEFAULT 'monthly'
    CHECK (billing_cycle IN ('monthly', 'quarterly', 'annual')),
  ADD COLUMN IF NOT EXISTS reference_net_amount_paise INT;

COMMENT ON COLUMN public.subscriptions.reference_net_amount_paise IS
  'Store-cut absorption Option 1 (DEC-028) — the fixed reference amount creator_share_pct was '
  'computed against for this subscription, independent of actual rail fees incurred.';

-- Founding-author cohort — time-boxed/capped, per Req 4 (replaces the rejected lifetime
-- Apex +5% proposal). scope: per_author carries to the creator's future stories too;
-- per_story applies to the story that earned enrollment only.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS founding_cohort_enrolled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS founding_cohort_scope TEXT CHECK (founding_cohort_scope IN ('per_author', 'per_story')),
  ADD COLUMN IF NOT EXISTS founding_cohort_acceleration_ends_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_founding_cohort
  ON public.profiles (founding_cohort_enrolled_at)
  WHERE founding_cohort_enrolled_at IS NOT NULL;
