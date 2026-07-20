-- Migration 014: Product Strategy + Creator Events Platform (Master PRD v0.1)
-- Content architecture, tags, author levels, events, escrow, reviewer marketplace, governance

-- CLI migration runner resets search_path to `public` for this session, but
-- uuid-ossp/pg_trgm live in the `extensions` schema on this project — without
-- this, every uuid_generate_v4() default below fails with "function does not
-- exist". Session-level SET (not LOCAL) so it holds for the rest of the batch.
SET search_path TO public, extensions;

-- ── Extend roles ──
DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'reviewer';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'judge';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'organizer';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'sponsor';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Content metadata enums ──
DO $$ BEGIN CREATE TYPE content_type AS ENUM (
  'novel', 'serialized_story', 'short_story', 'short_story_collection', 'flash_fiction', 'kids_story'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE story_lifecycle_status AS ENUM ('draft', 'ongoing', 'completed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE age_rating AS ENUM ('all_ages', 'teen', 'young_adult', 'mature'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE author_level AS ENUM ('new', 'published', 'verified', 'featured', 'premium', 'katha_original'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE organizer_level AS ENUM ('new_organizer', 'verified_organizer', 'trusted_organizer', 'premier_organizer'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE story_badge AS ENUM ('incubation', 'baseline', 'emergent', 'performing', 'catalyst', 'anchor', 'apex'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Expand genre enum (legacy + PRD)
DO $$ BEGIN ALTER TYPE genre_type ADD VALUE IF NOT EXISTS 'horror'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE genre_type ADD VALUE IF NOT EXISTS 'thriller'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE genre_type ADD VALUE IF NOT EXISTS 'mystery'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE genre_type ADD VALUE IF NOT EXISTS 'comedy'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE genre_type ADD VALUE IF NOT EXISTS 'drama'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE genre_type ADD VALUE IF NOT EXISTS 'historical'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE genre_type ADD VALUE IF NOT EXISTS 'mythology'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE genre_type ADD VALUE IF NOT EXISTS 'fantasy'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE genre_type ADD VALUE IF NOT EXISTS 'sci_fi'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE genre_type ADD VALUE IF NOT EXISTS 'adventure'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE genre_type ADD VALUE IF NOT EXISTS 'literary'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE genre_type ADD VALUE IF NOT EXISTS 'crime'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE genre_type ADD VALUE IF NOT EXISTS 'slice_of_life'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Story metadata extensions ──
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS content_type content_type NOT NULL DEFAULT 'serialized_story',
  ADD COLUMN IF NOT EXISTS secondary_genres genre_type[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS age_rating age_rating NOT NULL DEFAULT 'all_ages',
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'te' CHECK (language IN ('te', 'en')),
  ADD COLUMN IF NOT EXISTS story_status story_lifecycle_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS setting TEXT,
  ADD COLUMN IF NOT EXISTS themes TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS performance_badge story_badge NOT NULL DEFAULT 'incubation';

ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS author_level author_level NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS organizer_level organizer_level NOT NULL DEFAULT 'new_organizer',
  ADD COLUMN IF NOT EXISTS reviewer_reputation_tier TEXT DEFAULT 'bronze',
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- ── Tags ──
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  tag_kind TEXT NOT NULL DEFAULT 'community' CHECK (tag_kind IN ('community', 'mood', 'location')),
  is_official BOOLEAN NOT NULL DEFAULT FALSE,
  usage_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tag_aliases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alias_slug TEXT NOT NULL UNIQUE,
  canonical_tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.tag_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  proposed_label TEXT NOT NULL,
  proposed_slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'merged', 'rejected')),
  moderator_id UUID REFERENCES public.profiles(id),
  merged_into_tag_id UUID REFERENCES public.tags(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.story_tags (
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (story_id, tag_id)
);

-- ── Reader social ──
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, story_id)
);

CREATE TABLE IF NOT EXISTS public.reading_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reading_list_items (
  list_id UUID NOT NULL REFERENCES public.reading_lists(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (list_id, story_id)
);

CREATE TABLE IF NOT EXISTS public.author_follows (
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, author_id)
);

CREATE TABLE IF NOT EXISTS public.reading_clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Governance reports ──
CREATE TABLE IF NOT EXISTS public.content_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('story', 'chapter', 'profile', 'comment', 'event')),
  target_id UUID NOT NULL,
  category TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  threshold_count INT NOT NULL DEFAULT 1,
  moderator_id UUID REFERENCES public.profiles(id),
  appeal_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.governance_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Reviewer marketplace ──
CREATE TABLE IF NOT EXISTS public.reviewer_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  specializations TEXT[] NOT NULL DEFAULT '{}',
  reputation_tier TEXT NOT NULL DEFAULT 'bronze',
  agreement_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  helpfulness_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  avg_response_hours NUMERIC(8,2),
  reviews_completed INT NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.peer_review_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  package_fee_inr INT NOT NULL CHECK (package_fee_inr BETWEEN 149 AND 199),
  mode TEXT NOT NULL DEFAULT 'paid' CHECK (mode IN ('volunteer', 'paid')),
  status TEXT NOT NULL DEFAULT 'pending_payment',
  majority_decision TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.peer_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.peer_review_requests(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.reviewer_profiles(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('accept', 'minor_revision', 'major_revision', 'reject')),
  feedback TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT TRUE,
  payout_inr NUMERIC(10,2),
  submitted_at TIMESTAMPTZ,
  UNIQUE(request_id, reviewer_id)
);

-- ── Creator Events Platform ──
DO $$ BEGIN CREATE TYPE event_type AS ENUM (
  'writing_contest', 'first_chapter_challenge', 'short_story_challenge', 'novel_challenge',
  'flash_fiction_challenge', 'festival_challenge', 'genre_challenge', 'district_challenge',
  'prompt_challenge', 'writing_sprint', 'collaboration_challenge', 'beta_reader_event',
  'editing_challenge', 'translation_challenge', 'publishing_pitch_event'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE judging_model AS ENUM (
  'blind', 'double_blind', 'community_voting', 'hybrid', 'weighted_rubric'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type event_type NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  judging_model judging_model NOT NULL DEFAULT 'weighted_rubric',
  entry_fee_inr INT NOT NULL DEFAULT 0,
  custom_entry_fee_inr INT,
  prize_pool_inr NUMERIC(12,2) NOT NULL DEFAULT 0,
  platform_commission_pct NUMERIC(5,2) NOT NULL DEFAULT 15,
  organizer_commission_pct NUMERIC(5,2) NOT NULL DEFAULT 10,
  tax_pct NUMERIC(5,2) NOT NULL DEFAULT 18,
  eligibility JSONB NOT NULL DEFAULT '{}',
  timeline JSONB NOT NULL DEFAULT '{}',
  rubric JSONB NOT NULL DEFAULT '{}',
  registration_opens_at TIMESTAMPTZ,
  registration_closes_at TIMESTAMPTZ,
  submissions_open_at TIMESTAMPTZ,
  submissions_close_at TIMESTAMPTZ,
  judging_ends_at TIMESTAMPTZ,
  appeal_window_ends_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entry_fee_paid_inr INT NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, participant_id)
);

CREATE TABLE IF NOT EXISTS public.event_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  story_id UUID REFERENCES public.stories(id) ON DELETE SET NULL,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  content TEXT,
  validation_status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ,
  UNIQUE(event_id, registration_id)
);

CREATE TABLE IF NOT EXISTS public.event_judges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_anonymous BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(event_id, judge_id)
);

CREATE TABLE IF NOT EXISTS public.event_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES public.event_submissions(id) ON DELETE CASCADE,
  judge_id UUID REFERENCES public.profiles(id),
  rubric_scores JSONB NOT NULL DEFAULT '{}',
  total_score NUMERIC(6,2) NOT NULL DEFAULT 0,
  community_votes INT NOT NULL DEFAULT 0,
  scored_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_prizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  rank INT NOT NULL,
  label TEXT NOT NULL,
  amount_inr NUMERIC(12,2) NOT NULL DEFAULT 0,
  reward_type TEXT NOT NULL DEFAULT 'cash',
  winner_registration_id UUID REFERENCES public.event_registrations(id)
);

CREATE TABLE IF NOT EXISTS public.event_escrow_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL UNIQUE REFERENCES public.events(id) ON DELETE CASCADE,
  balance_inr NUMERIC(12,2) NOT NULL DEFAULT 0,
  locked BOOLEAN NOT NULL DEFAULT TRUE,
  release_conditions JSONB NOT NULL DEFAULT '[]',
  released_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.event_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES public.event_registrations(id),
  txn_type TEXT NOT NULL CHECK (txn_type IN ('entry_fee', 'commission', 'prize_payout', 'refund')),
  amount_inr NUMERIC(12,2) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  certificate_type TEXT NOT NULL DEFAULT 'participation',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_sponsors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  sponsor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_name TEXT NOT NULL,
  branding JSONB NOT NULL DEFAULT '{}',
  spend_inr NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.event_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stories_content_type ON public.stories(content_type);
CREATE INDEX IF NOT EXISTS idx_stories_story_status ON public.stories(story_status);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON public.tags(slug);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON public.events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON public.event_registrations(event_id);