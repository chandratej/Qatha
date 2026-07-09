-- Trojan Horse gateway: shareable chapter links, micro-unlock transactions, Route splits.
-- Platform fee default 40% (platform keeps); 60% routed to creator linked account at capture.

-- ---------------------------------------------------------------------------
-- Shareable URLs
-- ---------------------------------------------------------------------------
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_stories_slug
  ON public.stories (slug)
  WHERE slug IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Creator payment rail (Razorpay Route linked account — no manual UPI payout)
-- ---------------------------------------------------------------------------
ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS razorpay_linked_account_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_route_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (razorpay_route_status IN ('pending', 'activated', 'suspended', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_creators_razorpay_account
  ON public.creators (razorpay_linked_account_id)
  WHERE razorpay_linked_account_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Per-chapter micro-transaction pricing
-- ---------------------------------------------------------------------------
ALTER TABLE public.chapters
  ADD COLUMN IF NOT EXISTS unlock_price_paise INT NOT NULL DEFAULT 1900
    CHECK (unlock_price_paise BETWEEN 100 AND 99900),
  ADD COLUMN IF NOT EXISTS teaser_paragraphs SMALLINT NOT NULL DEFAULT 3
    CHECK (teaser_paragraphs BETWEEN 1 AND 10);

-- ---------------------------------------------------------------------------
-- Transactions — immutable financial record (total, platform fee, creator payout)
-- ---------------------------------------------------------------------------
CREATE TYPE transaction_status AS ENUM (
  'created',
  'authorized',
  'captured',
  'failed',
  'refunded'
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE RESTRICT,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE RESTRICT,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE RESTRICT,
  total_amount_paise INT NOT NULL CHECK (total_amount_paise > 0),
  platform_fee_paise INT NOT NULL CHECK (platform_fee_paise >= 0),
  creator_payout_paise INT NOT NULL CHECK (creator_payout_paise >= 0),
  platform_fee_pct SMALLINT NOT NULL DEFAULT 40
    CHECK (platform_fee_pct BETWEEN 0 AND 100),
  currency TEXT NOT NULL DEFAULT 'INR',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_transfer_id TEXT,
  status transaction_status NOT NULL DEFAULT 'created',
  idempotency_key TEXT NOT NULL,
  failure_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  captured_at TIMESTAMPTZ,
  CONSTRAINT transactions_amount_split CHECK (
    platform_fee_paise + creator_payout_paise = total_amount_paise
  ),
  CONSTRAINT transactions_idempotency_unique UNIQUE (idempotency_key)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_razorpay_payment
  ON public.transactions (razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_reader
  ON public.transactions (reader_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_creator
  ON public.transactions (creator_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_chapter
  ON public.transactions (chapter_id);

-- ---------------------------------------------------------------------------
-- Chapter unlocks — entitlement after captured transaction
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chapter_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE RESTRICT,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chapter_unlocks_unique UNIQUE (reader_id, chapter_id)
);

CREATE INDEX IF NOT EXISTS idx_chapter_unlocks_reader
  ON public.chapter_unlocks (reader_id, chapter_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY transactions_reader_own ON public.transactions
  FOR SELECT USING (reader_id = auth.uid());

CREATE POLICY transactions_creator_read ON public.transactions
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY chapter_unlocks_reader_own ON public.chapter_unlocks
  FOR SELECT USING (reader_id = auth.uid());

-- Service role inserts transactions/unlocks via API after payment capture.

-- ---------------------------------------------------------------------------
-- Helper: public chapter teaser for OG + SSR (no full content leak)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_chapter_teaser(
  p_story_slug TEXT,
  p_chapter_number INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_story RECORD;
  v_chapter RECORD;
  v_paragraphs TEXT[];
  v_teaser TEXT;
BEGIN
  SELECT s.id, s.title, s.description, s.cover_url, s.slug, c.pen_name AS author_name
  INTO v_story
  FROM stories s
  JOIN creators c ON c.id = s.author_id
  WHERE s.slug = p_story_slug AND s.is_published = TRUE;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT ch.id, ch.title, ch.content, ch.chapter_number, ch.unlock_price_paise, ch.teaser_paragraphs
  INTO v_chapter
  FROM chapters ch
  WHERE ch.story_id = v_story.id
    AND ch.chapter_number = p_chapter_number
    AND ch.status = 'published';

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_paragraphs := regexp_split_to_array(trim(v_chapter.content), E'\\n\\n+');
  v_teaser := array_to_string(v_paragraphs[1:LEAST(v_chapter.teaser_paragraphs, array_length(v_paragraphs, 1))], E'\n\n');

  RETURN jsonb_build_object(
    'story', jsonb_build_object(
      'id', v_story.id,
      'title', v_story.title,
      'description', v_story.description,
      'cover_url', v_story.cover_url,
      'slug', v_story.slug,
      'author_name', v_story.author_name
    ),
    'chapter', jsonb_build_object(
      'id', v_chapter.id,
      'number', v_chapter.chapter_number,
      'title', v_chapter.title,
      'teaser_text', v_teaser,
      'first_paragraph', COALESCE(v_paragraphs[1], ''),
      'unlock_price_paise', v_chapter.unlock_price_paise,
      'teaser_paragraphs', v_chapter.teaser_paragraphs,
      'is_locked', TRUE
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_chapter_teaser(TEXT, INT) TO anon, authenticated;