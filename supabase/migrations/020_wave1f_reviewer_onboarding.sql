-- Migration 020: Reviewer onboarding persistence (Vol_05 + Vol_01-02)
-- Literary Council: certification gate before pool availability
-- Legal & Trust: motivation retained for future moderation audit

ALTER TABLE public.reviewer_profiles
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT NOT NULL DEFAULT 'not_applied'
    CHECK (onboarding_status IN ('not_applied', 'applied', 'training', 'certified', 'suspended')),
  ADD COLUMN IF NOT EXISTS languages TEXT[] NOT NULL DEFAULT '{telugu}',
  ADD COLUMN IF NOT EXISTS motivation TEXT,
  ADD COLUMN IF NOT EXISTS certified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ;