-- Migration 005: Wave A foundation — phonetic corrections, platform config, user devices,
-- earnings/moderation RLS, chapter_drafts policies, storage bucket for story covers.
-- Aligns with Backend_services_backlog.md Wave A (A2–A7).

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
  ('launch_offer', '{"mode":"immediate","trial_days":0,"subscription_gate_chapter":6,"founding_limit":null}'::jsonb)
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