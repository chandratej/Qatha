-- Migration 047: external_safe schema for external-LLM / human-export workflows
-- Master Workflow Part 2.2 + Part 3 standing rule.
-- See EXTERNAL_DATA_SAFETY.md

SET search_path TO public, extensions;

CREATE SCHEMA IF NOT EXISTS external_safe;

COMMENT ON SCHEMA external_safe IS
  'Masked/aggregated views only. Safe for human-reviewed export to external AI tools.';

-- Deny default PUBLIC / PostgREST client access
REVOKE ALL ON SCHEMA external_safe FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON SCHEMA external_safe FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON SCHEMA external_safe FROM authenticated;
  END IF;
END $$;

-- creators_masked — no email/phone/legal/UPI/PAN/ban status
CREATE OR REPLACE VIEW external_safe.creators_masked AS
SELECT
  c.id,
  c.pen_name,
  c.created_at,
  (
    SELECT count(*)::int FROM public.stories s WHERE s.author_id = c.id
  ) AS story_count,
  (
    SELECT coalesce(sum(s.chapter_count), 0)::int FROM public.stories s WHERE s.author_id = c.id
  ) AS chapter_count_sum,
  (
    SELECT coalesce(sum(s.total_readers), 0)::bigint FROM public.stories s WHERE s.author_id = c.id
  ) AS total_readers_sum
FROM public.creators c;

COMMENT ON VIEW external_safe.creators_masked IS
  'Creator aggregates only. Drops contact/KYC/payout fields and is_banned.';

-- earnings_summary — monthly aggregates only
CREATE OR REPLACE VIEW external_safe.earnings_summary AS
SELECT
  date_trunc('month', el.month::timestamp)::date AS month_bucket,
  count(*)::int AS ledger_rows,
  count(DISTINCT el.creator_id)::int AS creators_with_rows,
  coalesce(sum(el.amount), 0)::numeric AS amount_sum,
  coalesce(avg(el.amount), 0)::numeric AS amount_avg
FROM public.earnings_ledger el
GROUP BY 1;

COMMENT ON VIEW external_safe.earnings_summary IS
  'Monthly aggregate earnings only. Never exposes creator_id or UPI/bank details.';

-- content_stats — published stories only (unpublished titles are not external-safe)
CREATE OR REPLACE VIEW external_safe.content_stats AS
SELECT
  s.id AS story_id,
  s.title,
  s.genre::text AS genre,
  s.chapter_count,
  s.total_readers,
  s.is_published,
  s.created_at,
  length(coalesce(s.description, '')) AS description_len
FROM public.stories s
WHERE s.is_published = true;

COMMENT ON VIEW external_safe.content_stats IS
  'Published story metadata + aggregate reads only. No reader IDs, device data, or draft titles.';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'external_export_ro') THEN
    CREATE ROLE external_export_ro NOLOGIN;
  END IF;
END $$;

-- NOLOGIN: privilege container only. Humans use SQL editor or a login role
-- that has been GRANTed external_export_ro. Never automate prod→LLM.

COMMENT ON ROLE external_export_ro IS
  'NOLOGIN privilege role for human-reviewed exports for external LLM sessions. '
  'Grant to a login role: GRANT external_export_ro TO <your_login>; '
  'Never automate prod→LLM. SELECT only on external_safe views.';

GRANT USAGE ON SCHEMA external_safe TO external_export_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA external_safe TO external_export_ro;
ALTER DEFAULT PRIVILEGES IN SCHEMA external_safe
  GRANT SELECT ON TABLES TO external_export_ro;

REVOKE ALL ON ALL TABLES IN SCHEMA external_safe FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON ALL TABLES IN SCHEMA external_safe FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON ALL TABLES IN SCHEMA external_safe FROM authenticated;
  END IF;
END $$;
GRANT SELECT ON ALL TABLES IN SCHEMA external_safe TO external_export_ro;
