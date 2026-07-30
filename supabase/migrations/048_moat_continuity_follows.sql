-- Moat completion: story continuity (timeline + relationships) + author follows RLS
-- Safe to re-run (IF NOT EXISTS).

-- ── Story timeline events (plot chronology) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.story_plot_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_number INT,
  label TEXT NOT NULL CHECK (char_length(label) BETWEEN 1 AND 200),
  body TEXT,
  when_label TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_story_plot_events_story
  ON public.story_plot_events(story_id, sort_order);

ALTER TABLE public.story_plot_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS story_plot_events_owner ON public.story_plot_events;
CREATE POLICY story_plot_events_owner ON public.story_plot_events
  FOR ALL USING (
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

-- ── Character relationships ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.story_character_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  from_character_id UUID NOT NULL REFERENCES public.story_characters(id) ON DELETE CASCADE,
  to_character_id UUID NOT NULL REFERENCES public.story_characters(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL DEFAULT 'related',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT story_char_rel_distinct CHECK (from_character_id <> to_character_id)
);

CREATE INDEX IF NOT EXISTS idx_story_char_rel_story
  ON public.story_character_relationships(story_id);

ALTER TABLE public.story_character_relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS story_char_rel_owner ON public.story_character_relationships;
CREATE POLICY story_char_rel_owner ON public.story_character_relationships
  FOR ALL USING (
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

-- ── Author follows RLS (table may already exist from 014) ────────────────
ALTER TABLE public.author_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS author_follows_select ON public.author_follows;
CREATE POLICY author_follows_select ON public.author_follows
  FOR SELECT USING (follower_id = auth.uid() OR author_id = auth.uid());

DROP POLICY IF EXISTS author_follows_insert ON public.author_follows;
CREATE POLICY author_follows_insert ON public.author_follows
  FOR INSERT WITH CHECK (follower_id = auth.uid());

DROP POLICY IF EXISTS author_follows_delete ON public.author_follows;
CREATE POLICY author_follows_delete ON public.author_follows
  FOR DELETE USING (follower_id = auth.uid());

-- ── Durable analytics events (creator + reader funnel) ───────────────────
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event TEXT NOT NULL,
  story_id UUID REFERENCES public.stories(id) ON DELETE SET NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_story_time
  ON public.analytics_events(story_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_event
  ON public.analytics_events(event, created_at DESC);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS analytics_events_insert ON public.analytics_events;
CREATE POLICY analytics_events_insert ON public.analytics_events
  FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS analytics_events_select_own ON public.analytics_events;
CREATE POLICY analytics_events_select_own ON public.analytics_events
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = story_id AND s.author_id = auth.uid()
    )
  );
