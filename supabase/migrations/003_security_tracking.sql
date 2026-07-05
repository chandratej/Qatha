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