-- CLI migration runner resets search_path per-file; uuid-ossp/pg_trgm live in extensions.
SET search_path TO public, extensions;

-- Migration 017: Wave 1 foundation — lifecycle, story RBAC, peer review assignments
-- Decisions: V01-03-D1, V01-04-D1, ARC-01 (partial), V09-04-D1 schema support

-- Creator lifecycle stage (Vol_01-03)
ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT NOT NULL DEFAULT 'registered'
    CHECK (lifecycle_stage IN (
      'registered', 'onboarding', 'first_draft', 'first_publish',
      'active', 'identity_verified', 'dormant', 'churned'
    )),
  ADD COLUMN IF NOT EXISTS creator_persona TEXT NOT NULL DEFAULT 'solo_author'
    CHECK (creator_persona IN ('solo_author', 'reviewer'));

CREATE INDEX IF NOT EXISTS idx_creators_lifecycle_stage ON public.creators(lifecycle_stage);

-- Story-scoped RBAC (Vol_01-04)
DO $$ BEGIN CREATE TYPE story_member_role AS ENUM (
  'owner', 'co_author', 'editor', 'proofreader', 'beta_reader',
  'reviewer', 'moderator_delegate', 'viewer'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.story_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role story_member_role NOT NULL DEFAULT 'viewer',
  granted_by UUID REFERENCES public.profiles(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(story_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_story_members_story ON public.story_members(story_id);
CREATE INDEX IF NOT EXISTS idx_story_members_user ON public.story_members(user_id);

-- Auto-owner on story creation
CREATE OR REPLACE FUNCTION public.ensure_story_owner_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.story_members (story_id, user_id, role, granted_by)
  VALUES (NEW.id, NEW.author_id, 'owner', NEW.author_id)
  ON CONFLICT (story_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_story_owner_member ON public.stories;
CREATE TRIGGER trg_story_owner_member
  AFTER INSERT ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.ensure_story_owner_member();

-- Peer review assignment workflow (extends migration 014)
ALTER TABLE public.peer_review_requests
  ADD COLUMN IF NOT EXISTS story_title TEXT,
  ADD COLUMN IF NOT EXISTS story_genre TEXT,
  ADD COLUMN IF NOT EXISTS structured_comments JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS public.peer_review_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.peer_review_requests(id) ON DELETE CASCADE,
  reviewer_slot TEXT NOT NULL,
  reviewer_id UUID REFERENCES public.reviewer_profiles(id) ON DELETE SET NULL,
  matching_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'invited'
    CHECK (status IN ('invited', 'accepted', 'in_review', 'submitted', 'validated', 'paid_out', 'declined', 'cancelled')),
  manuscript_label TEXT,
  professional_role TEXT,
  story_genre TEXT,
  mode TEXT NOT NULL DEFAULT 'paid' CHECK (mode IN ('volunteer', 'paid')),
  payout_inr NUMERIC(10,2) NOT NULL DEFAULT 0,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  priority TEXT DEFAULT 'standard',
  review_summary JSONB,
  structured_comments JSONB NOT NULL DEFAULT '[]',
  UNIQUE(request_id, reviewer_slot)
);

CREATE INDEX IF NOT EXISTS idx_peer_review_assignments_request ON public.peer_review_assignments(request_id);
CREATE INDEX IF NOT EXISTS idx_peer_review_assignments_slot ON public.peer_review_assignments(reviewer_slot);

-- State transition audit (Vol_09-04-D3 partial)
CREATE TABLE IF NOT EXISTS public.state_transition_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  from_state TEXT,
  to_state TEXT NOT NULL,
  event_name TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_state_transition_entity ON public.state_transition_logs(entity_type, entity_id);

-- In-app notifications MVP table (Vol_02-03-P4-D1 partial)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  domain TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'informational',
  title TEXT NOT NULL,
  body TEXT,
  action_url TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read_at);