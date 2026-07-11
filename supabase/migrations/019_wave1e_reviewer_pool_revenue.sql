-- Migration 019: Wave 1e — reviewer pool matching fields, RLS, event revenue audit
-- Council: Literary (pool quality), Creator Economy (auditable escrow), Security (RLS), Operations (SLA notifications table ready)

-- Reviewer pool matching columns (extends migration 014)
ALTER TABLE public.reviewer_profiles
  ADD COLUMN IF NOT EXISTS pool_slot TEXT,
  ADD COLUMN IF NOT EXISTS genre_expertise TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS professional_role TEXT DEFAULT 'community_reviewer',
  ADD COLUMN IF NOT EXISTS council_level TEXT DEFAULT 'certified_reviewer',
  ADD COLUMN IF NOT EXISTS rqi NUMERIC(5,2) NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS conduct_score NUMERIC(5,2) NOT NULL DEFAULT 80,
  ADD COLUMN IF NOT EXISTS story_trust_level TEXT DEFAULT 'emerging';

CREATE INDEX IF NOT EXISTS idx_reviewer_profiles_available ON public.reviewer_profiles(is_available) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_reviewer_profiles_slot ON public.reviewer_profiles(pool_slot);

-- reviewer_profiles RLS — authors browse available (anonymized); reviewers manage own
ALTER TABLE public.reviewer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reviewer_profiles_browse ON public.reviewer_profiles;
CREATE POLICY reviewer_profiles_browse ON public.reviewer_profiles
  FOR SELECT USING (is_available = true OR id = auth.uid());

DROP POLICY IF EXISTS reviewer_profiles_own ON public.reviewer_profiles;
CREATE POLICY reviewer_profiles_own ON public.reviewer_profiles
  FOR ALL USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS reviewer_profiles_service ON public.reviewer_profiles;
CREATE POLICY reviewer_profiles_service ON public.reviewer_profiles
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- event_transactions — auditable revenue ledger (Creator Economy Council)
ALTER TABLE public.event_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_transactions_organizer ON public.event_transactions;
CREATE POLICY event_transactions_organizer ON public.event_transactions
  FOR SELECT USING (
    event_id IN (SELECT id FROM public.events WHERE organizer_id = auth.uid())
  );

DROP POLICY IF EXISTS event_transactions_service ON public.event_transactions;
CREATE POLICY event_transactions_service ON public.event_transactions
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- event_escrow_accounts — organizer read
ALTER TABLE public.event_escrow_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_escrow_organizer ON public.event_escrow_accounts;
CREATE POLICY event_escrow_organizer ON public.event_escrow_accounts
  FOR SELECT USING (
    event_id IN (SELECT id FROM public.events WHERE organizer_id = auth.uid())
  );

DROP POLICY IF EXISTS event_escrow_service ON public.event_escrow_accounts;
CREATE POLICY event_escrow_service ON public.event_escrow_accounts
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');