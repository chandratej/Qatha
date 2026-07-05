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