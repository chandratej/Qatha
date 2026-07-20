-- CLI migration runner resets search_path per-file; uuid-ossp/pg_trgm live in extensions.
SET search_path TO public, extensions;

-- Wave 10 — Creator community feed (posts + love reactions)

CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'chapter_share'
    CHECK (post_type IN ('chapter_share', 'milestone', 'discussion')),
  body TEXT NOT NULL CHECK (char_length(body) >= 1 AND char_length(body) <= 500),
  story_id UUID REFERENCES public.stories(id) ON DELETE SET NULL,
  story_title TEXT,
  chapter_number INT CHECK (chapter_number IS NULL OR chapter_number > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_posts_created
  ON public.community_posts(created_at DESC);

CREATE TABLE IF NOT EXISTS public.community_post_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'love' CHECK (reaction_type = 'love'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_community_reactions_post
  ON public.community_post_reactions(post_id);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY community_posts_read ON public.community_posts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY community_posts_insert ON public.community_posts
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY community_reactions_read ON public.community_post_reactions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY community_reactions_insert ON public.community_post_reactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY community_reactions_delete ON public.community_post_reactions
  FOR DELETE USING (user_id = auth.uid());