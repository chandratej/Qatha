-- Migration 009: WhatsApp OTP auth layer (OTP_Decisions_Features.md)
-- Day-1 identity via Google/email; phone verified JIT via WhatsApp OTP at publish/paywall.

-- ---------------------------------------------------------------------------
-- Profiles: unified registration — email on Day 1, phone nullable until JIT verify
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
-- WhatsApp inbound messages — 24-hour customer service window tracking
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