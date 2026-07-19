-- 041: MVP-1 legal consent + Telugu-aware public search helpers

-- Creator / reader consent records (DPDP — versioned, timestamped)
CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  -- e.g. dpdp_privacy_v1 | creator_agreement_v1 | marketing_optional
  policy_version TEXT NOT NULL,
  accepted BOOLEAN NOT NULL DEFAULT true,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_hash TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (user_id, consent_type, policy_version)
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user
  ON public.user_consents (user_id, accepted_at DESC);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dpdp_consent_version TEXT,
  ADD COLUMN IF NOT EXISTS dpdp_consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS creator_agreement_version TEXT,
  ADD COLUMN IF NOT EXISTS creator_agreement_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS grievance_contact_seen_at TIMESTAMPTZ;

-- Beta-reader structured feedback (pre-publish optional; also usable post-publish)
CREATE TABLE IF NOT EXISTS public.beta_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_number INT NOT NULL,
  invite_id UUID,
  reviewer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_email TEXT,
  category TEXT NOT NULL CHECK (category IN ('typo', 'pacing', 'confusion', 'praise', 'other')),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_beta_feedback_story
  ON public.beta_feedback (story_id, chapter_number, created_at DESC);

-- Public search: trigram already on chapters; add story title/description search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS search_document TEXT;

UPDATE public.stories
SET search_document = coalesce(title, '') || ' ' || coalesce(description, '')
WHERE search_document IS NULL;

CREATE OR REPLACE FUNCTION public.stories_search_document_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_document := coalesce(NEW.title, '') || ' ' || coalesce(NEW.description, '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stories_search_document ON public.stories;
CREATE TRIGGER trg_stories_search_document
  BEFORE INSERT OR UPDATE OF title, description ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.stories_search_document_trigger();

CREATE INDEX IF NOT EXISTS idx_stories_search_trgm
  ON public.stories USING gin (search_document gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_stories_title_trgm
  ON public.stories USING gin (title gin_trgm_ops);

-- RPC: public story search (Telugu + English substring/trigram — no English-only stemming)
CREATE OR REPLACE FUNCTION public.search_public_stories(q text, lim int DEFAULT 20)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  genre text,
  cover_url text,
  chapter_count int,
  total_readers int,
  rank real
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    s.id,
    s.title,
    s.description,
    s.genre,
    s.cover_url,
    s.chapter_count,
    s.total_readers,
    greatest(
      similarity(coalesce(s.search_document, ''), q),
      similarity(coalesce(s.title, ''), q)
    )::real AS rank
  FROM public.stories s
  WHERE s.is_published = true
    AND (
      s.search_document ILIKE '%' || q || '%'
      OR s.title ILIKE '%' || q || '%'
      OR similarity(coalesce(s.search_document, ''), q) > 0.08
    )
  ORDER BY rank DESC NULLS LAST, s.total_readers DESC NULLS LAST
  LIMIT greatest(1, least(lim, 50));
$$;

GRANT EXECUTE ON FUNCTION public.search_public_stories(text, int) TO anon, authenticated, service_role;
