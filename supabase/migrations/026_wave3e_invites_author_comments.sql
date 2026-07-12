-- Wave 3e — Co-author invites (Vol_04-CA) + author comments (Vol_04-CS)
-- Legal & Trust: invites auditable; author comments separate from reviewer schema.

CREATE TABLE IF NOT EXISTS public.story_member_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  invitee_email TEXT,
  invitee_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  role story_member_role NOT NULL DEFAULT 'co_author',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  chapter_number INT CHECK (chapter_number IS NULL OR chapter_number > 0),
  due_at TIMESTAMPTZ,
  invited_by UUID NOT NULL REFERENCES public.profiles(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (invitee_email IS NOT NULL OR invitee_user_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_story_invites_story ON public.story_member_invites(story_id);
CREATE INDEX IF NOT EXISTS idx_story_invites_email ON public.story_member_invites(invitee_email);

CREATE TABLE IF NOT EXISTS public.story_author_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_number INT NOT NULL CHECK (chapter_number > 0),
  scene_id TEXT NOT NULL,
  body TEXT NOT NULL,
  selected_text TEXT,
  start_offset INT,
  end_offset INT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_author_comments_story_chapter
  ON public.story_author_comments(story_id, chapter_number);

ALTER TABLE public.story_member_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_author_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS story_invites_member ON public.story_member_invites;
CREATE POLICY story_invites_member ON public.story_member_invites
  FOR ALL USING (
    story_id IN (SELECT story_id FROM public.story_members WHERE user_id = auth.uid())
    OR invitee_user_id = auth.uid()
    OR invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  WITH CHECK (
    story_id IN (
      SELECT story_id FROM public.story_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

DROP POLICY IF EXISTS story_invites_service ON public.story_member_invites;
CREATE POLICY story_invites_service ON public.story_member_invites
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS author_comments_member ON public.story_author_comments;
CREATE POLICY author_comments_member ON public.story_author_comments
  FOR ALL USING (
    story_id IN (SELECT story_id FROM public.story_members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    story_id IN (
      SELECT story_id FROM public.story_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'co_author', 'editor', 'proofreader')
    )
  );

DROP POLICY IF EXISTS author_comments_service ON public.story_author_comments;
CREATE POLICY author_comments_service ON public.story_author_comments
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');