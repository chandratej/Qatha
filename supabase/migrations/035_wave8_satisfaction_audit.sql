-- Migration 035: Author satisfaction + annotation stale metadata (Wave 8)
-- Data Council: LRC-17-D5 quality signal
-- Literary Council: LRC-19-D6 version mismatch handling

ALTER TABLE public.peer_review_requests
  ADD COLUMN IF NOT EXISTS author_satisfaction_rating INT
    CHECK (author_satisfaction_rating IS NULL OR author_satisfaction_rating BETWEEN 1 AND 5);