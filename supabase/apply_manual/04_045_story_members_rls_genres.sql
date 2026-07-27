-- Migration 045: Fix story_members infinite RLS recursion + ensure full genre enum
--
-- Root cause of "Infinite recursion detected in policy for relation story_members":
-- story_members_manage_owner FOR ALL USING (...) self-queries story_members,
-- so any policy evaluation re-enters the same policy (classic Supabase RLS loop).
-- Story creation fails because trg_story_owner_member inserts into story_members
-- under the invoker's RLS.
--
-- Fix:
-- 1) SECURITY DEFINER helpers that read membership/authorship without RLS recursion
-- 2) Non-self-referential policies on story_members
-- 3) Owner-bootstrap trigger runs as SECURITY DEFINER (always can insert owner row)
-- 4) Idempotent genre_type enum expansion (migration 014 may be missing in some envs)

SET search_path TO public, extensions;

-- ---------------------------------------------------------------------------
-- Helpers (bypass RLS via SECURITY DEFINER; locked search_path)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_story_author(p_story_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.stories s
    WHERE s.id = p_story_id
      AND s.author_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_story_member(p_story_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.story_members sm
    WHERE sm.story_id = p_story_id
      AND sm.user_id = auth.uid()
      AND (sm.expires_at IS NULL OR sm.expires_at > NOW())
  );
$$;

CREATE OR REPLACE FUNCTION public.is_story_owner_member(p_story_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.story_members sm
    WHERE sm.story_id = p_story_id
      AND sm.user_id = auth.uid()
      AND sm.role = 'owner'
      AND (sm.expires_at IS NULL OR sm.expires_at > NOW())
  );
$$;

REVOKE ALL ON FUNCTION public.is_story_author(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_story_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_story_owner_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_story_author(uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_story_member(uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_story_owner_member(uuid) TO authenticated, anon, service_role;

-- ---------------------------------------------------------------------------
-- Owner bootstrap — never blocked by story_members RLS
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.ensure_story_owner_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.story_members (story_id, user_id, role, granted_by)
  VALUES (NEW.id, NEW.author_id, 'owner', NEW.author_id)
  ON CONFLICT (story_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_story_owner_member ON public.stories;
CREATE TRIGGER trg_story_owner_member
  AFTER INSERT ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.ensure_story_owner_member();

-- ---------------------------------------------------------------------------
-- story_members RLS — no self-subqueries
-- ---------------------------------------------------------------------------

ALTER TABLE public.story_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS story_members_select ON public.story_members;
DROP POLICY IF EXISTS story_members_manage_owner ON public.story_members;
DROP POLICY IF EXISTS story_members_insert ON public.story_members;
DROP POLICY IF EXISTS story_members_update ON public.story_members;
DROP POLICY IF EXISTS story_members_delete ON public.story_members;
DROP POLICY IF EXISTS story_members_service ON public.story_members;

-- Members see their own row; authors see full roster for their stories
CREATE POLICY story_members_select ON public.story_members
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_story_author(story_id)
  );

-- Authors (and existing owners) can add collaborators
CREATE POLICY story_members_insert ON public.story_members
  FOR INSERT
  WITH CHECK (
    public.is_story_author(story_id)
    OR public.is_story_owner_member(story_id)
    OR (
      -- First owner row for brand-new story (trigger path is SECURITY DEFINER,
      -- but keep a safe client path: only self-as-owner on own story)
      user_id = auth.uid()
      AND role = 'owner'
      AND public.is_story_author(story_id)
    )
  );

CREATE POLICY story_members_update ON public.story_members
  FOR UPDATE
  USING (
    public.is_story_author(story_id)
    OR public.is_story_owner_member(story_id)
  )
  WITH CHECK (
    public.is_story_author(story_id)
    OR public.is_story_owner_member(story_id)
  );

CREATE POLICY story_members_delete ON public.story_members
  FOR DELETE
  USING (
    public.is_story_author(story_id)
    OR public.is_story_owner_member(story_id)
  );

CREATE POLICY story_members_service ON public.story_members
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- Genre enum — ensure full PRD catalog exists (idempotent)
-- Initial schema only had romance / family_drama / suspense.
-- ---------------------------------------------------------------------------

DO $$ BEGIN ALTER TYPE genre_type ADD VALUE IF NOT EXISTS 'horror'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE genre_type ADD VALUE IF NOT EXISTS 'thriller'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE genre_type ADD VALUE IF NOT EXISTS 'mystery'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE genre_type ADD VALUE IF NOT EXISTS 'comedy'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE genre_type ADD VALUE IF NOT EXISTS 'drama'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE genre_type ADD VALUE IF NOT EXISTS 'historical'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE genre_type ADD VALUE IF NOT EXISTS 'mythology'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE genre_type ADD VALUE IF NOT EXISTS 'fantasy'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE genre_type ADD VALUE IF NOT EXISTS 'sci_fi'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE genre_type ADD VALUE IF NOT EXISTS 'adventure'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE genre_type ADD VALUE IF NOT EXISTS 'literary'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE genre_type ADD VALUE IF NOT EXISTS 'crime'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE genre_type ADD VALUE IF NOT EXISTS 'slice_of_life'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
