-- Migration 008: katha-ecosystem-architecture_V2.md compliance
-- §4 RLS index discipline, §6 subscription policy, §4 search-ready chapters

-- ---------------------------------------------------------------------------
-- §6: Subscriptions — client SELECT-only; writes via payment-webhook EF only
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscriptions' AND policyname = 'subscriptions_own_read'
  ) THEN
    CREATE POLICY subscriptions_own_read ON public.subscriptions
      FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscriptions' AND policyname = 'subscriptions_service_write'
  ) THEN
    CREATE POLICY subscriptions_service_write ON public.subscriptions
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Live subscription check for paywall RLS (uses ends_at per schema; V2 "expires_at" intent)
CREATE OR REPLACE FUNCTION public.has_active_subscription(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = p_user_id
      AND s.status = 'active'
      AND (s.ends_at IS NULL OR s.ends_at > NOW())
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_active_subscription(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- §4: Index discipline on RLS-referenced columns
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status_ends
  ON public.subscriptions(user_id, status, ends_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscriptions_creator_source
  ON public.subscriptions(creator_id_source) WHERE creator_id_source IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_earnings_ledger_creator_month
  ON public.earnings_ledger(creator_id, month DESC);

CREATE INDEX IF NOT EXISTS idx_user_devices_user_last_seen
  ON public.user_devices(user_id, last_seen DESC);

CREATE INDEX IF NOT EXISTS idx_chapter_drafts_creator_story
  ON public.chapter_drafts(creator_id, story_id);

CREATE INDEX IF NOT EXISTS idx_stories_author
  ON public.stories(author_id);

-- Cross-story search readiness (§4 data-model decision)
CREATE INDEX IF NOT EXISTS idx_chapters_title_trgm
  ON public.chapters USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_chapters_content_trgm
  ON public.chapters USING gin (content gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Profiles: allow creator self-registration upsert path
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_own_insert'
  ) THEN
    CREATE POLICY profiles_own_insert ON public.profiles
      FOR INSERT WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Creator analytics events (replaces Node /api/analytics/events for CMS)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_time
  ON public.analytics_events(user_id, created_at DESC);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY analytics_events_own_insert ON public.analytics_events
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY analytics_events_service_read ON public.analytics_events
  FOR SELECT USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- §11: Deprecate breakable streak gamification — table retained for migration safety
-- ---------------------------------------------------------------------------

COMMENT ON TABLE public.reading_streaks IS
  'DEPRECATED per architecture V2 §11 — breakable streaks rejected. Do not surface in UI.';