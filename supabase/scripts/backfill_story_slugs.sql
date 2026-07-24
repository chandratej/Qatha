-- Backfill slugs + chapter_count for stories that have published chapters.
-- Run in Supabase SQL Editor after migrations 012 (slug column) + publish path fixes.
-- Gateway teaser requires slug + is_published.

SET search_path TO public, extensions;

-- Accurate chapter counts from published chapters
WITH counts AS (
  SELECT story_id, COUNT(*)::int AS n
  FROM public.chapters
  WHERE status = 'published'
  GROUP BY story_id
)
UPDATE public.stories s
SET
  chapter_count = c.n,
  is_published = true
FROM counts c
WHERE s.id = c.story_id
  AND (s.chapter_count IS DISTINCT FROM c.n OR s.is_published IS DISTINCT FROM true);

-- Slug for published stories missing one (ASCII slugify; Telugu titles may get story-<uuid>)
UPDATE public.stories s
SET slug = lower(
  regexp_replace(
    regexp_replace(
      coalesce(nullif(trim(s.title), ''), 'story'),
      '[^a-zA-Z0-9\s-]', '', 'g'
    ),
    '[\s_]+', '-', 'g'
  )
)
WHERE s.is_published = true
  AND (s.slug IS NULL OR s.slug = '')
  AND EXISTS (
    SELECT 1 FROM public.chapters c
    WHERE c.story_id = s.id AND c.status = 'published'
  );

-- Ensure uniqueness: append short id when collisions remain
UPDATE public.stories s
SET slug = left(s.slug, 60) || '-' || left(replace(s.id::text, '-', ''), 8)
WHERE s.slug IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.stories o
    WHERE o.slug = s.slug AND o.id <> s.id
  );
