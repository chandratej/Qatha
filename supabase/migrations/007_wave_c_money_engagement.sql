-- Migration 007: Wave C — money layer, milestone triggers, dashboard RPC (C1–C4)

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