-- Katha: combined database bootstrap
-- Generated: 2026-07-07 00:44
-- Paste into Supabase Dashboard -> SQL Editor -> Run

-- ============================================================
-- 001_initial_schema.sql
-- ============================================================
-- Katha MVP Schema v1.0
-- Aligned with Katha_MVP_Architecture_Review_Betterments.md (Gaps 1-10)
-- Revenue split: 60% creator / 40% platform (see RESEARCH_DEVIATION_LOG.md DEV-003)

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enums
CREATE TYPE user_role AS ENUM ('reader', 'creator', 'admin');
CREATE TYPE subscription_status AS ENUM ('free', 'trial', 'active', 'grace_period', 'paused', 'cancelled');
CREATE TYPE release_schedule AS ENUM ('weekly', 'biweekly', 'irregular', 'complete');
CREATE TYPE genre_type AS ENUM ('romance', 'family_drama', 'suspense');
CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'needs_revision', 'rejected', 'rejected_banned');
CREATE TYPE chapter_status AS ENUM ('draft', 'pending_review', 'published', 'unpublished', 'removed', 'scheduled');

-- Users (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE,
  display_name TEXT,
  role user_role NOT NULL DEFAULT 'reader',
  subscription_status subscription_status NOT NULL DEFAULT 'free',
  favorite_genre genre_type,
  fcm_token TEXT,
  font_size SMALLINT NOT NULL DEFAULT 2 CHECK (font_size BETWEEN 1 AND 3),
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  trial_ends_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  razorpay_customer_id TEXT,
  razorpay_subscription_id TEXT,
  notification_preferences JSONB NOT NULL DEFAULT '{
    "new_chapters": true,
    "subscription_reminders": true,
    "weekly_trending": true,
    "promotional": false
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Creators
CREATE TABLE public.creators (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  pen_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  earnings_this_month DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_earnings DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_subscribers INT NOT NULL DEFAULT 0,
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  ban_reason TEXT,
  payout_upi TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stories
CREATE TABLE public.stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 100),
  description TEXT CHECK (char_length(description) <= 300),
  genre genre_type NOT NULL,
  cover_url TEXT,
  release_schedule release_schedule NOT NULL DEFAULT 'irregular',
  release_day_of_week SMALLINT CHECK (release_day_of_week BETWEEN 0 AND 6),
  release_time_of_day TIME,
  views_this_week INT NOT NULL DEFAULT 0,
  total_readers INT NOT NULL DEFAULT 0,
  chapter_count INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stories_genre ON public.stories(genre);
CREATE INDEX idx_stories_trending ON public.stories(genre, views_this_week DESC);
CREATE INDEX idx_stories_new ON public.stories(genre, created_at DESC);

-- Chapters
CREATE TABLE public.chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_number INT NOT NULL CHECK (chapter_number > 0),
  title TEXT CHECK (char_length(title) BETWEEN 0 AND 60),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 50000),
  content_delta JSONB,
  status chapter_status NOT NULL DEFAULT 'draft',
  moderation_status moderation_status,
  moderation_reason TEXT,
  view_count INT NOT NULL DEFAULT 0,
  estimated_read_time_minutes INT,
  published_at TIMESTAMPTZ,
  scheduled_publish_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(story_id, chapter_number)
);

CREATE INDEX idx_chapters_story ON public.chapters(story_id, chapter_number);
CREATE INDEX idx_chapters_scheduled_publish ON public.chapters(scheduled_publish_at) WHERE status = 'scheduled';

-- Chapter drafts (auto-save)
CREATE TABLE public.chapter_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_number INT,
  title TEXT,
  content TEXT,
  content_delta JSONB,
  last_saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(creator_id, story_id, chapter_number)
);

-- Reading progress
CREATE TABLE public.reading_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  scroll_position_pct SMALLINT NOT NULL DEFAULT 0 CHECK (scroll_position_pct BETWEEN 0 AND 100),
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, chapter_id)
);

CREATE INDEX idx_reading_progress_user ON public.reading_progress(user_id, last_read_at DESC);
CREATE INDEX idx_reading_progress_story ON public.reading_progress(story_id, user_id);

-- Subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  story_id_source UUID REFERENCES public.stories(id),
  creator_id_source UUID REFERENCES public.creators(id),
  razorpay_subscription_id TEXT,
  razorpay_payment_id TEXT,
  amount_paise INT NOT NULL DEFAULT 9900,
  status subscription_status NOT NULL DEFAULT 'active',
  creator_share_pct SMALLINT NOT NULL DEFAULT 60,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Moderation queue
CREATE TABLE public.moderation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.creators(id),
  status moderation_status NOT NULL DEFAULT 'pending',
  reason TEXT,
  toxicity_score DECIMAL(4, 3),
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Creator earnings ledger
CREATE TABLE public.earnings_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.creators(id),
  subscription_id UUID REFERENCES public.subscriptions(id),
  amount DECIMAL(12, 2) NOT NULL,
  month DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Functions

CREATE OR REPLACE FUNCTION calculate_read_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.estimated_read_time_minutes := GREATEST(1, ROUND(char_length(NEW.content) / 1000.0));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_chapter_read_time
BEFORE INSERT OR UPDATE OF content ON public.chapters
FOR EACH ROW EXECUTE FUNCTION calculate_read_time();

CREATE OR REPLACE FUNCTION increment_story_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.stories
  SET views_this_week = views_this_week + 1,
      total_readers = (
        SELECT COUNT(DISTINCT user_id) FROM public.reading_progress
        WHERE story_id = NEW.story_id
      )
  WHERE id = NEW.story_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_reading_progress_insert
AFTER INSERT ON public.reading_progress
FOR EACH ROW EXECUTE FUNCTION increment_story_views();

CREATE OR REPLACE FUNCTION increment_chapter_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chapters SET view_count = view_count + 1 WHERE id = NEW.chapter_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_chapter_view
AFTER INSERT ON public.reading_progress
FOR EACH ROW EXECUTE FUNCTION increment_chapter_views();

CREATE OR REPLACE FUNCTION update_story_chapter_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.stories SET chapter_count = (
    SELECT COUNT(*) FROM public.chapters
    WHERE story_id = COALESCE(NEW.story_id, OLD.story_id)
    AND status = 'published'
  ) WHERE id = COALESCE(NEW.story_id, OLD.story_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_chapter_publish
AFTER INSERT OR UPDATE OR DELETE ON public.chapters
FOR EACH ROW EXECUTE FUNCTION update_story_chapter_count();

-- Analytics view
CREATE VIEW public.chapter_analytics AS
SELECT
  c.id AS chapter_id,
  c.story_id,
  c.chapter_number,
  c.title,
  COUNT(rp.id) AS total_views,
  ROUND(100.0 * SUM(CASE WHEN rp.is_completed THEN 1 ELSE 0 END) / NULLIF(COUNT(rp.id), 0), 1) AS completion_rate,
  ROUND(AVG(rp.scroll_position_pct), 1) AS avg_scroll_pct
FROM public.chapters c
LEFT JOIN public.reading_progress rp ON rp.chapter_id = c.id
WHERE c.status = 'published'
GROUP BY c.id;

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;

-- Profiles: users read/update own
CREATE POLICY profiles_select ON public.profiles FOR SELECT USING (true);
CREATE POLICY profiles_update ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Stories: published visible to all
CREATE POLICY stories_public_read ON public.stories FOR SELECT
  USING (is_published = true OR author_id = auth.uid());
CREATE POLICY stories_creator_write ON public.stories FOR ALL
  USING (author_id = auth.uid());

-- Chapters: published visible; creators manage own
CREATE POLICY chapters_public_read ON public.chapters FOR SELECT
  USING (
    status = 'published'
    OR story_id IN (SELECT id FROM public.stories WHERE author_id = auth.uid())
  );
CREATE POLICY chapters_creator_write ON public.chapters FOR ALL
  USING (story_id IN (SELECT id FROM public.stories WHERE author_id = auth.uid()));

-- Reading progress: own data only
CREATE POLICY progress_own ON public.reading_progress FOR ALL
  USING (user_id = auth.uid());

-- Creators: public read, own update
CREATE POLICY creators_public_read ON public.creators FOR SELECT USING (NOT is_banned);
CREATE POLICY creators_own_update ON public.creators FOR UPDATE USING (id = auth.uid());

-- ============================================================
-- 002_waitlist.sql
-- ============================================================
-- Waitlist signups from landing page (Phase 1 Gate #1 tracking)
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT,
  phone TEXT,
  source TEXT DEFAULT 'landing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_waitlist_created ON public.waitlist(created_at DESC);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY waitlist_insert ON public.waitlist FOR INSERT WITH CHECK (true);

-- ============================================================
-- 003_security_tracking.sql
-- ============================================================
-- Migration 003: Security & Observability Tables (per Katha_Production_Transition_Technical_Blueprint)
-- Adds rate limiting, OTP attempt tracking, webhook idempotency, FCM token lifecycle, cache invalidations.
-- Non-breaking additive migration. Existing mock paths simulate these for dev.

CREATE TABLE IF NOT EXISTS public.otp_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_hash TEXT NOT NULL,
  device_fingerprint TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_requests_phone_time ON public.otp_requests(phone_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otp_requests_recent ON public.otp_requests(created_at);

CREATE TABLE IF NOT EXISTS public.otp_failures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_hash TEXT NOT NULL,
  error_code TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_failures_phone ON public.otp_failures(phone_hash, created_at DESC);

CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id TEXT NOT NULL UNIQUE,
  event TEXT,
  payload JSONB,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_event ON public.webhook_logs(event);

CREATE TABLE IF NOT EXISTS public.fcm_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  fcm_token TEXT NOT NULL,
  device_fingerprint TEXT,
  last_refreshed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, fcm_token)
);

CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user ON public.fcm_tokens(user_id);

CREATE TABLE IF NOT EXISTS public.cache_invalidations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT,
  invalidated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cache_inval_user ON public.cache_invalidations(user_id, invalidated_at DESC);

-- Optional: Add content_hash column to chapters for cache versioning (blueprint Gap 4)
ALTER TABLE public.chapters
  ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- Optional: Enhance reading_progress for better resume (character offset + pct fallback)
ALTER TABLE public.reading_progress
  ADD COLUMN IF NOT EXISTS last_read_char_offset INT,
  ADD COLUMN IF NOT EXISTS content_hash_at_read TEXT;

-- Note: RLS policies can be added in future when moving fully off header-based mock auth.
COMMENT ON TABLE public.otp_requests IS 'Rate limiting and session binding for OTP (blueprint Phase 1.2)';
COMMENT ON TABLE public.webhook_logs IS 'Idempotency + audit for Razorpay webhooks (blueprint Gap 2)';
COMMENT ON TABLE public.fcm_tokens IS 'FCM token lifecycle management (blueprint Phase 2.1)';

-- ============================================================
-- 004_engagement_mechanics.sql
-- ============================================================
-- Migration: 004_engagement_mechanics.sql
-- Enables the Hooked Model via streaks and milestones

-- 1. Reading Streaks Table
CREATE TABLE public.reading_streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_read_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- RLS for reading_streaks
ALTER TABLE public.reading_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own reading streaks"
    ON public.reading_streaks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage streaks"
    ON public.reading_streaks FOR ALL
    USING (auth.role() = 'service_role');

-- 2. Creator Milestones Table
CREATE TABLE public.creator_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    milestone_type TEXT NOT NULL, -- e.g., 'FIRST_READER', '100_READERS', '1K_INR'
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged BOOLEAN DEFAULT FALSE, -- To trigger UI modals once
    metadata JSONB, -- Context, e.g., which story got the first reader
    UNIQUE(creator_id, milestone_type)
);

-- RLS for creator_milestones
ALTER TABLE public.creator_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can view their own milestones"
    ON public.creator_milestones FOR SELECT
    USING (auth.uid() = creator_id);

CREATE POLICY "Creators can acknowledge milestones"
    ON public.creator_milestones FOR UPDATE
    USING (auth.uid() = creator_id)
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Service role can manage milestones"
    ON public.creator_milestones FOR ALL
    USING (auth.role() = 'service_role');

-- Trigger to update timestamp
CREATE OR REPLACE FUNCTION update_reading_streaks_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reading_streaks_modtime
    BEFORE UPDATE ON public.reading_streaks
    FOR EACH ROW
    EXECUTE FUNCTION update_reading_streaks_modtime();


-- ============================================================
-- 005_wave_a_foundation.sql
-- ============================================================
-- Migration 005: Wave A foundation â€” phonetic corrections, platform config, user devices,
-- earnings/moderation RLS, chapter_drafts policies, storage bucket for story covers.
-- Aligns with Backend_services_backlog.md Wave A (A2â€“A7).

-- Extend role enum for moderator access (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'moderator'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'moderator';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Phonetic corrections (per-creator dictionary, Priority 3)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.phonetic_corrections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  phonetic_input TEXT NOT NULL CHECK (char_length(phonetic_input) BETWEEN 1 AND 120),
  corrected_telugu TEXT NOT NULL CHECK (char_length(corrected_telugu) BETWEEN 1 AND 200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(creator_id, phonetic_input)
);

CREATE INDEX IF NOT EXISTS idx_phonetic_corrections_creator
  ON public.phonetic_corrections(creator_id);

ALTER TABLE public.phonetic_corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY phonetic_corrections_select ON public.phonetic_corrections
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY phonetic_corrections_insert ON public.phonetic_corrections
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY phonetic_corrections_update ON public.phonetic_corrections
  FOR UPDATE USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());

CREATE POLICY phonetic_corrections_delete ON public.phonetic_corrections
  FOR DELETE USING (creator_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Platform config (revenue split, launch offer)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY platform_config_public_read ON public.platform_config
  FOR SELECT USING (true);

-- Writes restricted to service role (seed via migration / admin tooling)
CREATE POLICY platform_config_service_write ON public.platform_config
  FOR ALL USING (auth.role() = 'service_role');

INSERT INTO public.platform_config (key, value) VALUES
  ('revenue_split', '{"creator_share_pct":60,"platform_share_pct":40,"subscription_price_inr":99,"subscription_price_paise":9900,"currency":"INR"}'::jsonb),
  ('launch_offer', '{"mode":"immediate","trial_days":0,"subscription_gate_chapter":6,"founding_limit":null}'::jsonb),
  ('phone', '{"country_code":"91","national_length":10,"mobile_leading_pattern":"[6-9]","example_e164":"+919876543210","whatsapp_business_number":"919876543210","region_label":"Indian"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- User devices (2-device limit support, Wave C register-device EF)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  session_id TEXT,
  device_label TEXT,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_user_devices_user ON public.user_devices(user_id, last_seen DESC);

ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_devices_own ON public.user_devices
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY user_devices_service ON public.user_devices
  FOR ALL USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- Missing RLS policies from 001 (chapter_drafts, moderation_queue, earnings)
-- ---------------------------------------------------------------------------
CREATE POLICY chapter_drafts_creator ON public.chapter_drafts
  FOR ALL USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());

CREATE POLICY moderation_queue_moderator_read ON public.moderation_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY moderation_queue_moderator_write ON public.moderation_queue
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'moderator')
    )
  );

ALTER TABLE public.earnings_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY earnings_ledger_creator_read ON public.earnings_ledger
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY earnings_ledger_service_write ON public.earnings_ledger
  FOR ALL USING (auth.role() = 'service_role');

-- Creators can insert own profile row on onboarding
CREATE POLICY creators_own_insert ON public.creators
  FOR INSERT WITH CHECK (id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage: story-covers bucket (SVC-MEDIA-01/02)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'story-covers',
  'story-covers',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY story_covers_public_read ON storage.objects
  FOR SELECT USING (bucket_id = 'story-covers');

CREATE POLICY story_covers_creator_upload ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'story-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY story_covers_creator_update ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'story-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY story_covers_creator_delete ON storage.objects
  FOR DELETE USING (
    bucket_id = 'story-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- 006_wave_b_analytics_rpc.sql
-- ============================================================
-- Migration 006: Wave B analytics RPC (B7) + moderator chapter review support (B5/B6)

-- RPC: creator-scoped story analytics (wraps chapter_analytics view)
CREATE OR REPLACE FUNCTION public.get_story_analytics(p_story_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author UUID;
  v_story RECORD;
  v_chapters JSON;
  v_subscribers BIGINT;
BEGIN
  SELECT author_id INTO v_author FROM public.stories WHERE id = p_story_id;
  IF v_author IS NULL OR v_author <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT id, title INTO v_story FROM public.stories WHERE id = p_story_id;

  SELECT COALESCE(json_agg(
    json_build_object(
      'chapter_number', ca.chapter_number,
      'total_views', COALESCE(ca.total_views, 0),
      'completion_rate', COALESCE(ca.completion_rate, 0),
      'avg_scroll_pct', COALESCE(ca.avg_scroll_pct, 0)
    ) ORDER BY ca.chapter_number
  ), '[]'::json)
  INTO v_chapters
  FROM public.chapter_analytics ca
  WHERE ca.story_id = p_story_id;

  SELECT COUNT(*) INTO v_subscribers
  FROM public.subscriptions
  WHERE story_id_source = p_story_id;

  RETURN json_build_object(
    'story', json_build_object('id', v_story.id, 'title', v_story.title),
    'chapters', v_chapters,
    'subscribers_gained', v_subscribers
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_story_analytics(UUID) TO authenticated;

-- Allow moderators to update chapters they are reviewing (EF also uses service_role)
CREATE POLICY chapters_moderator_update ON public.chapters
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY moderation_queue_moderator_insert ON public.moderation_queue
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'moderator')
    )
    OR creator_id = auth.uid()
  );

-- ============================================================
-- 007_wave_c_money_engagement.sql
-- ============================================================
-- Migration 007: Wave C â€” money layer, milestone triggers, dashboard RPC (C1â€“C4)

-- Per-story earnings attribution
ALTER TABLE public.earnings_ledger
  ADD COLUMN IF NOT EXISTS story_id UUID REFERENCES public.stories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_earnings_ledger_creator_month
  ON public.earnings_ledger(creator_id, month DESC);

CREATE INDEX IF NOT EXISTS idx_earnings_ledger_story
  ON public.earnings_ledger(story_id) WHERE story_id IS NOT NULL;

-- Wallets (SELECT-only for creators; writes via Edge Functions)
CREATE TABLE IF NOT EXISTS public.wallets (
  creator_id UUID PRIMARY KEY REFERENCES public.creators(id) ON DELETE CASCADE,
  balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
  pending_payout DECIMAL(12, 2) NOT NULL DEFAULT 0,
  last_payout_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY wallets_creator_read ON public.wallets
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY wallets_service_write ON public.wallets
  FOR ALL USING (auth.role() = 'service_role');

-- Moderation observability (C8)
CREATE TABLE IF NOT EXISTS public.moderation_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  creator_id UUID REFERENCES public.creators(id) ON DELETE SET NULL,
  toxicity_score DECIMAL(4, 3),
  moderation_source TEXT NOT NULL DEFAULT 'heuristic',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.moderation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY moderation_events_service ON public.moderation_events
  FOR ALL USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- Milestone triggers (C4)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.award_creator_milestone(
  p_creator_id UUID,
  p_milestone_type TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_creator_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.creator_milestones (creator_id, milestone_type, metadata)
  VALUES (p_creator_id, p_milestone_type, p_metadata)
  ON CONFLICT (creator_id, milestone_type) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_milestone_first_reader()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_id UUID;
  v_distinct_readers INT;
BEGIN
  SELECT author_id INTO v_author_id FROM public.stories WHERE id = NEW.story_id;
  IF v_author_id IS NULL THEN RETURN NEW; END IF;

  SELECT COUNT(DISTINCT user_id) INTO v_distinct_readers
  FROM public.reading_progress
  WHERE story_id = NEW.story_id;

  IF v_distinct_readers = 1 THEN
    PERFORM public.award_creator_milestone(
      v_author_id,
      'FIRST_READER',
      jsonb_build_object('story_id', NEW.story_id, 'reader_id', NEW.user_id)
    );
  END IF;

  IF v_distinct_readers = 100 THEN
    PERFORM public.award_creator_milestone(
      v_author_id,
      '100_READERS',
      jsonb_build_object('story_id', NEW.story_id, 'reader_count', v_distinct_readers)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_reading_progress_milestone ON public.reading_progress;
CREATE TRIGGER on_reading_progress_milestone
  AFTER INSERT ON public.reading_progress
  FOR EACH ROW EXECUTE FUNCTION public.trigger_milestone_first_reader();

CREATE OR REPLACE FUNCTION public.trigger_milestone_first_subscriber()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prior_count INT;
BEGIN
  IF NEW.creator_id_source IS NULL OR NEW.status <> 'active' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_prior_count
  FROM public.subscriptions
  WHERE creator_id_source = NEW.creator_id_source
    AND status = 'active'
    AND id <> NEW.id;

  IF v_prior_count = 0 THEN
    PERFORM public.award_creator_milestone(
      NEW.creator_id_source,
      'FIRST_SUBSCRIBER',
      jsonb_build_object(
        'story_id', NEW.story_id_source,
        'subscription_id', NEW.id,
        'user_id', NEW.user_id
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_subscription_milestone ON public.subscriptions;
CREATE TRIGGER on_subscription_milestone
  AFTER INSERT ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.trigger_milestone_first_subscriber();

-- ---------------------------------------------------------------------------
-- Dashboard RPC (C3)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_creator_dashboard()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creator_id UUID := auth.uid();
  v_month_start DATE;
  v_earnings_this_month DECIMAL(12, 2);
  v_total_earnings DECIMAL(12, 2);
  v_total_subscribers INT;
  v_revenue JSONB;
  v_creator_share INT;
  v_platform_share INT;
  v_sub_price_inr INT;
  v_this_week INT;
  v_last_week INT;
  v_wow_growth INT;
  v_payout_date DATE;
  v_result JSON;
BEGIN
  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_month_start := date_trunc('month', CURRENT_DATE)::DATE;

  SELECT COALESCE(SUM(amount), 0) INTO v_earnings_this_month
  FROM public.earnings_ledger
  WHERE creator_id = v_creator_id AND month >= v_month_start;

  SELECT COALESCE(SUM(amount), 0) INTO v_total_earnings
  FROM public.earnings_ledger WHERE creator_id = v_creator_id;

  SELECT COUNT(*)::INT INTO v_total_subscribers
  FROM public.subscriptions
  WHERE creator_id_source = v_creator_id AND status = 'active';

  SELECT value INTO v_revenue FROM public.platform_config WHERE key = 'revenue_split';
  v_creator_share := COALESCE((v_revenue->>'creator_share_pct')::INT, 60);
  v_platform_share := COALESCE((v_revenue->>'platform_share_pct')::INT, 40);
  v_sub_price_inr := COALESCE((v_revenue->>'subscription_price_inr')::INT, 99);

  SELECT COUNT(*)::INT INTO v_this_week
  FROM public.subscriptions
  WHERE creator_id_source = v_creator_id
    AND created_at >= NOW() - INTERVAL '7 days';

  SELECT COUNT(*)::INT INTO v_last_week
  FROM public.subscriptions
  WHERE creator_id_source = v_creator_id
    AND created_at >= NOW() - INTERVAL '14 days'
    AND created_at < NOW() - INTERVAL '7 days';

  IF v_last_week = 0 THEN
    v_wow_growth := CASE WHEN v_this_week > 0 THEN 100 ELSE 0 END;
  ELSE
    v_wow_growth := ROUND(100.0 * (v_this_week - v_last_week) / v_last_week);
  END IF;

  v_payout_date := (date_trunc('month', CURRENT_DATE) + INTERVAL '14 days')::DATE;
  IF EXTRACT(DAY FROM CURRENT_DATE) >= 15 THEN
    v_payout_date := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' + INTERVAL '14 days')::DATE;
  END IF;

  SELECT json_build_object(
    'earnings_this_month', v_earnings_this_month,
    'total_earnings', v_total_earnings,
    'total_subscribers', v_total_subscribers,
    'expected_payout_date', v_payout_date::TEXT,
    'expected_payout_amount', v_earnings_this_month,
    'week_over_week_growth_pct', v_wow_growth,
    'revenue_share_pct', v_creator_share,
    'platform_share_pct', v_platform_share,
    'creator_earnings_per_subscription_inr', ROUND(v_sub_price_inr * v_creator_share / 100.0, 2),
    'payout_schedule', '15th of each month',
    'earnings_by_story', COALESCE((
      SELECT json_agg(row_to_json(t) ORDER BY t.earnings_this_month DESC)
      FROM (
        SELECT
          s.id AS story_id,
          s.title,
          s.total_readers,
          COALESCE(sub_counts.cnt, 0) AS subscribers,
          COALESCE(earn.sum_amount, 0) AS earnings_this_month
        FROM public.stories s
        LEFT JOIN (
          SELECT story_id_source, COUNT(*)::INT AS cnt
          FROM public.subscriptions
          WHERE creator_id_source = v_creator_id AND status = 'active'
          GROUP BY story_id_source
        ) sub_counts ON sub_counts.story_id_source = s.id
        LEFT JOIN (
          SELECT story_id, SUM(amount) AS sum_amount
          FROM public.earnings_ledger
          WHERE creator_id = v_creator_id AND month >= v_month_start
          GROUP BY story_id
        ) earn ON earn.story_id = s.id
        WHERE s.author_id = v_creator_id
      ) t
    ), '[]'::json),
    'stories', COALESCE((
      SELECT json_agg(row_to_json(t) ORDER BY t.views_this_week DESC)
      FROM (
        SELECT
          s.id,
          s.title,
          s.total_readers,
          s.views_this_week,
          s.chapter_count,
          COALESCE(sub_counts.cnt, 0) AS subscribers,
          COALESCE(earn.sum_amount, 0) AS earnings_this_month
        FROM public.stories s
        LEFT JOIN (
          SELECT story_id_source, COUNT(*)::INT AS cnt
          FROM public.subscriptions
          WHERE creator_id_source = v_creator_id AND status = 'active'
          GROUP BY story_id_source
        ) sub_counts ON sub_counts.story_id_source = s.id
        LEFT JOIN (
          SELECT story_id, SUM(amount) AS sum_amount
          FROM public.earnings_ledger
          WHERE creator_id = v_creator_id AND month >= v_month_start
          GROUP BY story_id
        ) earn ON earn.story_id = s.id
        WHERE s.author_id = v_creator_id
      ) t
    ), '[]'::json),
    'subscriber_history', COALESCE((
      SELECT json_agg(row_to_json(t) ORDER BY t.month)
      FROM (
        SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
               COUNT(*)::INT AS count
        FROM public.subscriptions
        WHERE creator_id_source = v_creator_id
        GROUP BY 1
      ) t
    ), '[]'::json)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_creator_dashboard() TO authenticated;

-- ============================================================
-- 008_v2_architecture_compliance.sql
-- ============================================================
-- Migration 008: katha-ecosystem-architecture_V2.md compliance
-- Â§4 RLS index discipline, Â§6 subscription policy, Â§4 search-ready chapters

-- ---------------------------------------------------------------------------
-- Â§6: Subscriptions â€” client SELECT-only; writes via payment-webhook EF only
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
-- Â§4: Index discipline on RLS-referenced columns
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

-- Cross-story search readiness (Â§4 data-model decision)
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
-- Â§11: Deprecate breakable streak gamification â€” table retained for migration safety
-- ---------------------------------------------------------------------------

COMMENT ON TABLE public.reading_streaks IS
  'DEPRECATED per architecture V2 Â§11 â€” breakable streaks rejected. Do not surface in UI.';

-- ============================================================
-- 009_whatsapp_auth.sql
-- ============================================================
-- Migration 009: WhatsApp OTP auth layer (OTP_Decisions_Features.md)
-- Day-1 identity via Google/email; phone verified JIT via WhatsApp OTP at publish/paywall.

-- ---------------------------------------------------------------------------
-- Profiles: unified registration â€” email on Day 1, phone nullable until JIT verify
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_phone_lookup
  ON public.profiles(phone) WHERE phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_email_lookup
  ON public.profiles(email) WHERE email IS NOT NULL;

COMMENT ON COLUMN public.profiles.phone IS 'Set after JIT WhatsApp OTP verification (publish or paywall).';
COMMENT ON COLUMN public.profiles.phone_verified_at IS 'Timestamp of successful WhatsApp OTP verification.';

-- ---------------------------------------------------------------------------
-- WhatsApp inbound messages â€” 24-hour customer service window tracking
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.whatsapp_inbound_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wa_message_id TEXT UNIQUE,
  sender_phone TEXT NOT NULL,
  message_text TEXT NOT NULL,
  intent_type TEXT CHECK (intent_type IN ('claim_toolkit', 'unlock_map', 'other')),
  context_id TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  payload_sent BOOLEAN NOT NULL DEFAULT FALSE,
  nudge_sent_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  window_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_inbound_sender_time
  ON public.whatsapp_inbound_messages(sender_phone, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_inbound_nudge_pending
  ON public.whatsapp_inbound_messages(window_expires_at)
  WHERE nudge_sent_at IS NULL AND converted_at IS NULL AND payload_sent = TRUE;

ALTER TABLE public.whatsapp_inbound_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY whatsapp_inbound_service ON public.whatsapp_inbound_messages
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 010_auth_user_bootstrap.sql
-- ============================================================
-- Migration 010: Auto-create profile row when a new auth.users row is inserted.
-- Ensures Google/email registration always has a profiles record once migrations are applied.

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_display TEXT;
  v_email TEXT;
BEGIN
  v_email := NEW.email;
  v_display := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    CASE WHEN v_email IS NOT NULL THEN split_part(v_email, '@', 1) ELSE NULL END,
    'Reader'
  );

  INSERT INTO public.profiles (id, display_name, role, email)
  VALUES (NEW.id, v_display, 'reader', v_email)
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();


