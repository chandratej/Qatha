/** Collaboration entities — Vol_04 co-author invites + author comments */

export const INVITE_ROLES = ['co_author', 'editor', 'proofreader', 'beta_reader', 'viewer'] as const;
export type InviteRole = (typeof INVITE_ROLES)[number];

export const INVITE_STATUSES = ['pending', 'accepted', 'declined', 'expired'] as const;
export type InviteStatus = (typeof INVITE_STATUSES)[number];

export interface StoryMemberInvite {
  id: string;
  story_id: string;
  invitee_email?: string | null;
  invitee_user_id?: string | null;
  role: string;
  status: InviteStatus;
  chapter_number?: number | null;
  due_at?: string | null;
  invited_by: string;
  expires_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StoryAuthorComment {
  id: string;
  story_id: string;
  chapter_number: number;
  scene_id: string;
  body: string;
  selected_text?: string | null;
  start_offset?: number | null;
  end_offset?: number | null;
  status: 'open' | 'resolved';
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}