-- 044 pricing / founding author + payment idempotency (safe apply — run after 02 succeeds)
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
