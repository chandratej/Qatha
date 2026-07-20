-- CLI migration runner resets search_path per-file; uuid-ossp/pg_trgm live in extensions.
SET search_path TO public, extensions;

-- Wave 3d — Scene-character links (Vol_03-05-D2)
-- Literary Council: continuity tracking increases defensibility for serial fiction.

CREATE TABLE IF NOT EXISTS public.story_scene_character_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_number INT NOT NULL CHECK (chapter_number > 0),
  scene_id TEXT NOT NULL,
  character_id UUID NOT NULL REFERENCES public.story_characters(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (story_id, chapter_number, scene_id, character_id)
);

CREATE INDEX IF NOT EXISTS idx_scene_char_links_story_chapter
  ON public.story_scene_character_links(story_id, chapter_number);

ALTER TABLE public.story_scene_character_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS scene_char_links_member ON public.story_scene_character_links;
CREATE POLICY scene_char_links_member ON public.story_scene_character_links
  FOR ALL USING (
    story_id IN (SELECT story_id FROM public.story_members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    story_id IN (
      SELECT story_id FROM public.story_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'co_author', 'editor')
    )
  );

DROP POLICY IF EXISTS scene_char_links_service ON public.story_scene_character_links;
CREATE POLICY scene_char_links_service ON public.story_scene_character_links
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');