-- Story Versioning System (MVP1) — storage-agnostic domain, document table as default adapter
-- Domain concepts: Version, VersionSnapshot, VersionTimeline (immutable history; restore = new version)

CREATE TABLE IF NOT EXISTS public.story_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_id TEXT,
  version_number INT NOT NULL CHECK (version_number > 0),
  version_name TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version_type TEXT NOT NULL CHECK (version_type IN ('AutoCheckpoint', 'Manual', 'Publish', 'Draft')),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Restored', 'Archived')),
  restored_from_id UUID REFERENCES public.story_versions(id) ON DELETE SET NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  word_count INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_story_versions_story_chapter_time
  ON public.story_versions(story_id, chapter_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_story_versions_story_number
  ON public.story_versions(story_id, chapter_id, version_number DESC);

CREATE INDEX IF NOT EXISTS idx_story_versions_status
  ON public.story_versions(story_id, status);

ALTER TABLE public.story_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS story_versions_creator_all ON public.story_versions;
CREATE POLICY story_versions_creator_all ON public.story_versions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = story_id AND s.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = story_id AND s.author_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS story_versions_service ON public.story_versions;
CREATE POLICY story_versions_service ON public.story_versions
  FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE public.story_versions IS
  'Story version history (immutable). Restore creates a new row; never mutates prior content. Storage adapter may be replaced without API change.';
