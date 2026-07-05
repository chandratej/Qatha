-- Katha MVP Schema v1.0
-- Aligned with Katha_MVP_Architecture_Review_Betterments.md (Gaps 1-10)
-- Revenue split: 60% creator / 40% platform (see RESEARCH_DEVIATION_LOG.md DEV-003)

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enums
CREATE TYPE user_role AS ENUM ('reader', 'creator', 'admin');
CREATE TYPE subscription_status AS ENUM ('free', 'trial', 'active', 'grace_period', 'paused', 'cancelled');
CREATE TYPE release_schedule AS ENUM ('weekly', 'biweekly', 'irregular', 'complete');
CREATE TYPE genre_type AS ENUM ('romance', 'family_drama', 'suspense');
CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'needs_revision', 'rejected', 'rejected_banned');
CREATE TYPE chapter_status AS ENUM ('draft', 'pending_review', 'published', 'unpublished', 'removed');

-- Users (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE,
  display_name TEXT,
  role user_role NOT NULL DEFAULT 'reader',
  subscription_status subscription_status NOT NULL DEFAULT 'free',
  favorite_genre genre_type,
  fcm_token TEXT,
  font_size SMALLINT NOT NULL DEFAULT 2 CHECK (font_size BETWEEN 1 AND 3),
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  trial_ends_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  razorpay_customer_id TEXT,
  razorpay_subscription_id TEXT,
  notification_preferences JSONB NOT NULL DEFAULT '{
    "new_chapters": true,
    "subscription_reminders": true,
    "weekly_trending": true,
    "promotional": false
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Creators
CREATE TABLE public.creators (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  pen_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  earnings_this_month DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_earnings DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_subscribers INT NOT NULL DEFAULT 0,
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  ban_reason TEXT,
  payout_upi TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stories
CREATE TABLE public.stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 100),
  description TEXT CHECK (char_length(description) <= 300),
  genre genre_type NOT NULL,
  cover_url TEXT,
  release_schedule release_schedule NOT NULL DEFAULT 'irregular',
  release_day_of_week SMALLINT CHECK (release_day_of_week BETWEEN 0 AND 6),
  release_time_of_day TIME,
  views_this_week INT NOT NULL DEFAULT 0,
  total_readers INT NOT NULL DEFAULT 0,
  chapter_count INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stories_genre ON public.stories(genre);
CREATE INDEX idx_stories_trending ON public.stories(genre, views_this_week DESC);
CREATE INDEX idx_stories_new ON public.stories(genre, created_at DESC);

-- Chapters
CREATE TABLE public.chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_number INT NOT NULL CHECK (chapter_number > 0),
  title TEXT CHECK (char_length(title) BETWEEN 0 AND 60),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 50000),
  content_delta JSONB,
  status chapter_status NOT NULL DEFAULT 'draft',
  moderation_status moderation_status,
  moderation_reason TEXT,
  view_count INT NOT NULL DEFAULT 0,
  estimated_read_time_minutes INT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(story_id, chapter_number)
);

CREATE INDEX idx_chapters_story ON public.chapters(story_id, chapter_number);

-- Chapter drafts (auto-save)
CREATE TABLE public.chapter_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_number INT,
  title TEXT,
  content TEXT,
  content_delta JSONB,
  last_saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(creator_id, story_id, chapter_number)
);

-- Reading progress
CREATE TABLE public.reading_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  scroll_position_pct SMALLINT NOT NULL DEFAULT 0 CHECK (scroll_position_pct BETWEEN 0 AND 100),
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, chapter_id)
);

CREATE INDEX idx_reading_progress_user ON public.reading_progress(user_id, last_read_at DESC);
CREATE INDEX idx_reading_progress_story ON public.reading_progress(story_id, user_id);

-- Subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  story_id_source UUID REFERENCES public.stories(id),
  creator_id_source UUID REFERENCES public.creators(id),
  razorpay_subscription_id TEXT,
  razorpay_payment_id TEXT,
  amount_paise INT NOT NULL DEFAULT 9900,
  status subscription_status NOT NULL DEFAULT 'active',
  creator_share_pct SMALLINT NOT NULL DEFAULT 60,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Moderation queue
CREATE TABLE public.moderation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.creators(id),
  status moderation_status NOT NULL DEFAULT 'pending',
  reason TEXT,
  toxicity_score DECIMAL(4, 3),
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Creator earnings ledger
CREATE TABLE public.earnings_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.creators(id),
  subscription_id UUID REFERENCES public.subscriptions(id),
  amount DECIMAL(12, 2) NOT NULL,
  month DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Functions

CREATE OR REPLACE FUNCTION calculate_read_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.estimated_read_time_minutes := GREATEST(1, ROUND(char_length(NEW.content) / 1000.0));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_chapter_read_time
BEFORE INSERT OR UPDATE OF content ON public.chapters
FOR EACH ROW EXECUTE FUNCTION calculate_read_time();

CREATE OR REPLACE FUNCTION increment_story_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.stories
  SET views_this_week = views_this_week + 1,
      total_readers = (
        SELECT COUNT(DISTINCT user_id) FROM public.reading_progress
        WHERE story_id = NEW.story_id
      )
  WHERE id = NEW.story_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_reading_progress_insert
AFTER INSERT ON public.reading_progress
FOR EACH ROW EXECUTE FUNCTION increment_story_views();

CREATE OR REPLACE FUNCTION increment_chapter_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chapters SET view_count = view_count + 1 WHERE id = NEW.chapter_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_chapter_view
AFTER INSERT ON public.reading_progress
FOR EACH ROW EXECUTE FUNCTION increment_chapter_views();

CREATE OR REPLACE FUNCTION update_story_chapter_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.stories SET chapter_count = (
    SELECT COUNT(*) FROM public.chapters
    WHERE story_id = COALESCE(NEW.story_id, OLD.story_id)
    AND status = 'published'
  ) WHERE id = COALESCE(NEW.story_id, OLD.story_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_chapter_publish
AFTER INSERT OR UPDATE OR DELETE ON public.chapters
FOR EACH ROW EXECUTE FUNCTION update_story_chapter_count();

-- Analytics view
CREATE VIEW public.chapter_analytics AS
SELECT
  c.id AS chapter_id,
  c.story_id,
  c.chapter_number,
  c.title,
  COUNT(rp.id) AS total_views,
  ROUND(100.0 * SUM(CASE WHEN rp.is_completed THEN 1 ELSE 0 END) / NULLIF(COUNT(rp.id), 0), 1) AS completion_rate,
  ROUND(AVG(rp.scroll_position_pct), 1) AS avg_scroll_pct
FROM public.chapters c
LEFT JOIN public.reading_progress rp ON rp.chapter_id = c.id
WHERE c.status = 'published'
GROUP BY c.id;

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;

-- Profiles: users read/update own
CREATE POLICY profiles_select ON public.profiles FOR SELECT USING (true);
CREATE POLICY profiles_update ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Stories: published visible to all
CREATE POLICY stories_public_read ON public.stories FOR SELECT
  USING (is_published = true OR author_id = auth.uid());
CREATE POLICY stories_creator_write ON public.stories FOR ALL
  USING (author_id = auth.uid());

-- Chapters: published visible; creators manage own
CREATE POLICY chapters_public_read ON public.chapters FOR SELECT
  USING (
    status = 'published'
    OR story_id IN (SELECT id FROM public.stories WHERE author_id = auth.uid())
  );
CREATE POLICY chapters_creator_write ON public.chapters FOR ALL
  USING (story_id IN (SELECT id FROM public.stories WHERE author_id = auth.uid()));

-- Reading progress: own data only
CREATE POLICY progress_own ON public.reading_progress FOR ALL
  USING (user_id = auth.uid());

-- Creators: public read, own update
CREATE POLICY creators_public_read ON public.creators FOR SELECT USING (NOT is_banned);
CREATE POLICY creators_own_update ON public.creators FOR UPDATE USING (id = auth.uid());