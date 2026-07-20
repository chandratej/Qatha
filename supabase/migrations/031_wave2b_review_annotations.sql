-- CLI migration runner resets search_path per-file; uuid-ossp/pg_trgm live in extensions.
SET search_path TO public, extensions;

-- Migration 031: Wave 2b — normalized review annotations + threads + trial review (LRC-06-D4, LRC-09-D3, LRC-02-D5)
-- Literary Council: versioned craft feedback with auditable collaboration threads
-- Legal & Trust: trial review score visible to moderators before pool access

CREATE TABLE IF NOT EXISTS public.review_annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.peer_review_requests(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES public.peer_review_assignments(id) ON DELETE SET NULL,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  reviewer_slot TEXT,
  chapter_ref TEXT,
  scene_ref TEXT,
  paragraph_ref TEXT,
  sentence_ref TEXT,
  passage_ref TEXT,
  anchor_start INT,
  anchor_end INT,
  category TEXT NOT NULL DEFAULT 'other',
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high')),
  reason TEXT NOT NULL DEFAULT '',
  recommendation TEXT NOT NULL DEFAULT '',
  expected_impact TEXT NOT NULL DEFAULT '',
  reviewer_confidence INT NOT NULL DEFAULT 75,
  status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft', 'published', 'addressed', 'resolved', 'archived')),
  author_resolution TEXT NOT NULL DEFAULT 'pending'
    CHECK (author_resolution IN ('pending', 'accepted', 'rejected', 'deferred')),
  resolved_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_annotations_request ON public.review_annotations(request_id);
CREATE INDEX IF NOT EXISTS idx_review_annotations_story ON public.review_annotations(story_id);

CREATE TABLE IF NOT EXISTS public.annotation_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  annotation_id UUID NOT NULL REFERENCES public.review_annotations(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('author', 'reviewer', 'moderator')),
  body TEXT NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_annotation_threads_annotation ON public.annotation_threads(annotation_id);

ALTER TABLE public.review_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annotation_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS review_annotations_author ON public.review_annotations;
CREATE POLICY review_annotations_author ON public.review_annotations
  FOR SELECT USING (
    request_id IN (SELECT id FROM public.peer_review_requests WHERE author_id = auth.uid())
  );

DROP POLICY IF EXISTS review_annotations_service ON public.review_annotations;
CREATE POLICY review_annotations_service ON public.review_annotations
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS annotation_threads_participant ON public.annotation_threads;
CREATE POLICY annotation_threads_participant ON public.annotation_threads
  FOR SELECT USING (
    annotation_id IN (
      SELECT ra.id FROM public.review_annotations ra
      JOIN public.peer_review_requests pr ON pr.id = ra.request_id
      WHERE pr.author_id = auth.uid()
    )
    OR author_id = auth.uid()
  );

DROP POLICY IF EXISTS annotation_threads_insert ON public.annotation_threads;
CREATE POLICY annotation_threads_insert ON public.annotation_threads
  FOR INSERT WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS annotation_threads_service ON public.annotation_threads;
CREATE POLICY annotation_threads_service ON public.annotation_threads
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Trial review fields (LRC-02-D5)
ALTER TABLE public.reviewer_profiles
  ADD COLUMN IF NOT EXISTS training_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_review_payload JSONB,
  ADD COLUMN IF NOT EXISTS trial_review_score NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS trial_review_submitted_at TIMESTAMPTZ;