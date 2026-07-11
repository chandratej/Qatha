-- Wave 2b — creator in-app notification domain preferences (Vol_02-03 Part 2E)
-- Consumer Psychology + Legal & Trust: per-domain opt-out; DPDP-aligned fatigue control.

ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS in_app_notification_prefs JSONB NOT NULL DEFAULT '{
    "account_security": true,
    "story_creation": true,
    "collaboration": true,
    "reviews": true,
    "publishing": true,
    "reader_engagement": true,
    "community": true,
    "revenue_payments": true,
    "moderation": true,
    "ai_assistant": true,
    "system_platform": true
  }'::jsonb;