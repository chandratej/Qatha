-- 040: Reader content hygiene
-- 1) Reading time from word-ish plain text (not raw char_length / 1000)
-- 2) Scrub known film-IP phrases from published story descriptions

CREATE OR REPLACE FUNCTION calculate_read_time()
RETURNS TRIGGER AS $$
DECLARE
  plain text;
  words int;
BEGIN
  -- Strip tags roughly, then count whitespace-separated tokens.
  plain := regexp_replace(coalesce(NEW.content, ''), '<[^>]+>', ' ', 'gi');
  plain := regexp_replace(plain, '&nbsp;', ' ', 'gi');
  plain := regexp_replace(plain, '\s+', ' ', 'g');
  plain := btrim(plain);

  IF plain = '' THEN
    words := 0;
  ELSE
    words := array_length(regexp_split_to_array(plain, '\s+'), 1);
  END IF;

  -- ~180 wpm Telugu long-form (matches gateway + backend publish helpers)
  NEW.estimated_read_time_minutes := GREATEST(1, ROUND(words / 180.0));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recompute for existing published chapters so list rows stop showing "1 min"
-- when the body is a real manuscript.
UPDATE public.chapters
SET content = content
WHERE status = 'published' AND content IS NOT NULL;

-- Remove known copyrighted film / celebrity IP from reader-facing descriptions.
UPDATE public.stories
SET description = regexp_replace(
  regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          coalesce(description, ''),
          'S\.?\s*S\.?\s*Rajamouli',
          'a celebrated director',
          'gi'
        ),
        'Rajamouli',
        'a celebrated director',
        'gi'
      ),
      'Allu\s*Arjun',
      'a star performer',
      'gi'
    ),
    '\yRRR\y',
    'an epic period drama',
    'g'
  ),
  'రౌద్రం\s*రణం\s*రుధిరం',
  'ఒక ఇతిహాస కథ',
  'g'
)
WHERE description IS NOT NULL
  AND (
    description ~* 'Rajamouli'
    OR description ~ '\yRRR\y'
    OR description ~ 'రౌద్రం\s*రణం\s*రుధిరం'
    OR description ~* 'Allu\s*Arjun'
  );
