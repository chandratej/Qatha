-- Migration 030: Wave 2a — server-side review workspace drafts (LRC-ARC-01, LRC-05-D6)
-- Literary Council: drafts survive device switch — retention-driving craft loop
-- Security Council: draft_payload scoped to assignment + reviewer slot via API

ALTER TABLE public.peer_review_assignments
  ADD COLUMN IF NOT EXISTS draft_payload JSONB,
  ADD COLUMN IF NOT EXISTS draft_saved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accept_due_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_peer_review_assignments_draft
  ON public.peer_review_assignments(reviewer_slot)
  WHERE draft_payload IS NOT NULL
    AND status IN ('accepted', 'in_review');