-- Wave 3f — Media library (Vol_03-08) + contributor attribution (Vol_04-CA-D1)
-- Legal Council: attribution metadata before monetization; DAM for publishing center.

CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.profiles(id),
  url TEXT NOT NULL,
  filename TEXT,
  mime_type TEXT,
  asset_type TEXT NOT NULL DEFAULT 'illustration'
    CHECK (asset_type IN ('cover', 'illustration', 'reference', 'other')),
  attribution TEXT,
  license TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_story ON public.media_assets(story_id);

CREATE TABLE IF NOT EXISTS public.story_contributor_attributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role story_member_role NOT NULL,
  display_name TEXT,
  attribution_order INT NOT NULL DEFAULT 0,
  revenue_share_bps INT NOT NULL DEFAULT 0 CHECK (revenue_share_bps >= 0 AND revenue_share_bps <= 10000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (story_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_story_attributions_story ON public.story_contributor_attributions(story_id);

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_contributor_attributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS media_assets_member ON public.media_assets;
CREATE POLICY media_assets_member ON public.media_assets
  FOR ALL USING (
    story_id IN (SELECT story_id FROM public.story_members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    story_id IN (
      SELECT story_id FROM public.story_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'co_author', 'editor')
    )
  );

DROP POLICY IF EXISTS media_assets_service ON public.media_assets;
CREATE POLICY media_assets_service ON public.media_assets
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS story_attributions_member ON public.story_contributor_attributions;
CREATE POLICY story_attributions_member ON public.story_contributor_attributions
  FOR ALL USING (
    story_id IN (SELECT story_id FROM public.story_members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    story_id IN (
      SELECT story_id FROM public.story_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

DROP POLICY IF EXISTS story_attributions_service ON public.story_contributor_attributions;
CREATE POLICY story_attributions_service ON public.story_contributor_attributions
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');