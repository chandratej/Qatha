-- Migration 016: Cycle 7 — payout readiness fields + cloud chapter version snapshots

ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS legal_name TEXT;

ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS tax_id TEXT;

ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS payout_verified_at TIMESTAMPTZ;

COMMENT ON COLUMN public.creators.payout_upi IS 'UPI VPA for quarterly creator payouts';
COMMENT ON COLUMN public.creators.tax_id IS 'PAN / tax identifier for payout compliance';
COMMENT ON COLUMN public.creators.legal_name IS 'Legal name matching UPI / bank KYC';

-- Cloud version snapshots (complements IndexedDB 72h local history)
CREATE TABLE IF NOT EXISTS public.chapter_version_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_number INT NOT NULL CHECK (chapter_number > 0),
  scene_id TEXT NOT NULL,
  scene_title TEXT,
  content TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'autosave',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chapter_versions_lookup
  ON public.chapter_version_snapshots(creator_id, story_id, chapter_number, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chapter_versions_scene
  ON public.chapter_version_snapshots(story_id, chapter_number, scene_id, created_at DESC);

ALTER TABLE public.chapter_version_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY chapter_versions_creator_all ON public.chapter_version_snapshots
  FOR ALL USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY chapter_versions_service ON public.chapter_version_snapshots
  FOR ALL USING (auth.role() = 'service_role');

-- Prune helper: keep last 50 snapshots per scene (call from app periodically)
CREATE OR REPLACE FUNCTION public.prune_chapter_versions(
  p_creator_id UUID,
  p_story_id UUID,
  p_chapter_number INT,
  p_scene_id TEXT,
  p_keep INT DEFAULT 50
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted INT;
BEGIN
  WITH ranked AS (
    SELECT id,
      ROW_NUMBER() OVER (ORDER BY created_at DESC) AS rn
    FROM public.chapter_version_snapshots
    WHERE creator_id = p_creator_id
      AND story_id = p_story_id
      AND chapter_number = p_chapter_number
      AND scene_id = p_scene_id
  )
  DELETE FROM public.chapter_version_snapshots v
  USING ranked r
  WHERE v.id = r.id AND r.rn > p_keep;
  GET DIAGNOSTICS deleted = ROW_COUNT;
  RETURN deleted;
END;
$$;
