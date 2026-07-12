-- Wave 3c — Story bible (Vol_03-05/06) + async collaboration tasks (Vol_04-CW-D2)
-- Literary Council: canonical characters + lore increase switching cost and AI RAG readiness.

CREATE TABLE IF NOT EXISTS public.story_characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bio TEXT,
  arc_summary TEXT,
  traits JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_story_characters_story ON public.story_characters(story_id);

CREATE TABLE IF NOT EXISTS public.story_lore_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'other'
    CHECK (category IN ('location', 'culture', 'history', 'rule', 'glossary', 'other')),
  title TEXT NOT NULL,
  body TEXT,
  glossary_term TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_story_lore_story ON public.story_lore_entries(story_id);

CREATE TABLE IF NOT EXISTS public.story_collaboration_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done')),
  assignee_label TEXT,
  due_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_story_tasks_story ON public.story_collaboration_tasks(story_id);

-- RLS — story members with read/edit per role (service role bypass)
ALTER TABLE public.story_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_lore_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_collaboration_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS story_characters_member ON public.story_characters;
CREATE POLICY story_characters_member ON public.story_characters
  FOR ALL USING (
    story_id IN (SELECT story_id FROM public.story_members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    story_id IN (
      SELECT story_id FROM public.story_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'co_author', 'editor')
    )
  );

DROP POLICY IF EXISTS story_lore_member ON public.story_lore_entries;
CREATE POLICY story_lore_member ON public.story_lore_entries
  FOR ALL USING (
    story_id IN (SELECT story_id FROM public.story_members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    story_id IN (
      SELECT story_id FROM public.story_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'co_author', 'editor')
    )
  );

DROP POLICY IF EXISTS story_tasks_member ON public.story_collaboration_tasks;
CREATE POLICY story_tasks_member ON public.story_collaboration_tasks
  FOR ALL USING (
    story_id IN (SELECT story_id FROM public.story_members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    story_id IN (
      SELECT story_id FROM public.story_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'co_author', 'editor')
    )
  );

DROP POLICY IF EXISTS story_bible_service ON public.story_characters;
CREATE POLICY story_bible_service ON public.story_characters
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS story_lore_service ON public.story_lore_entries;
CREATE POLICY story_lore_service ON public.story_lore_entries
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS story_tasks_service ON public.story_collaboration_tasks;
CREATE POLICY story_tasks_service ON public.story_collaboration_tasks
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');