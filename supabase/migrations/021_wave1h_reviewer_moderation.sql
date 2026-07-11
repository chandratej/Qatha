-- Migration 021: Reviewer motivation moderation gate (Wave 1h)
-- Legal & Trust Council: human review before pool availability
-- Literary Council: pending_moderation between training and certified

ALTER TABLE public.reviewer_profiles
  DROP CONSTRAINT IF EXISTS reviewer_profiles_onboarding_status_check;

ALTER TABLE public.reviewer_profiles
  ADD CONSTRAINT reviewer_profiles_onboarding_status_check
  CHECK (onboarding_status IN (
    'not_applied', 'applied', 'training', 'pending_moderation', 'certified', 'suspended'
  ));

ALTER TABLE public.reviewer_profiles
  ADD COLUMN IF NOT EXISTS moderation_notes TEXT,
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;

-- Moderators may read all profiles for application review
DROP POLICY IF EXISTS reviewer_profiles_moderator_read ON public.reviewer_profiles;
CREATE POLICY reviewer_profiles_moderator_read ON public.reviewer_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('moderator', 'admin')
    )
  );