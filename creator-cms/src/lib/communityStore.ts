/**
 * Katha community feed — API-backed with local fallback for offline/dev.
 */

import { api } from './api';

export type CommunityPostType = 'chapter_share' | 'milestone' | 'discussion';

export interface CommunityPost {
  id: string;
  author_id: string;
  author_name: string;
  type: CommunityPostType;
  body: string;
  story_id?: string;
  story_title?: string;
  chapter_number?: number;
  created_at: string;
  reactions: { love: number; comment: number };
  viewer_loved?: boolean;
}

const KEY = 'katha_community_posts';

function loadLocal(): CommunityPost[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as CommunityPost[];
  } catch { /* ignore */ }
  return [];
}

function saveLocal(posts: CommunityPost[]) {
  localStorage.setItem(KEY, JSON.stringify(posts));
}

export async function listCommunityPosts(): Promise<CommunityPost[]> {
  try {
    const { posts } = await api.getCommunityPosts();
    return posts;
  } catch {
    return loadLocal().sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  }
}

export async function createCommunityPost(
  input: Omit<CommunityPost, 'id' | 'created_at' | 'reactions' | 'viewer_loved'>,
): Promise<CommunityPost> {
  try {
    const { post } = await api.createCommunityPost(input);
    return post;
  } catch {
    const post: CommunityPost = {
      ...input,
      id: `cp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
      reactions: { love: 0, comment: 0 },
      viewer_loved: false,
    };
    saveLocal([post, ...loadLocal()]);
    return post;
  }
}

export async function togglePostLove(postId: string): Promise<CommunityPost | null> {
  try {
    const { post } = await api.toggleCommunityPostLove(postId);
    return post;
  } catch {
    const posts = loadLocal();
    const idx = posts.findIndex((p) => p.id === postId);
    if (idx < 0) return null;
    const item = posts[idx];
    const loved = !item.viewer_loved;
    posts[idx] = {
      ...item,
      viewer_loved: loved,
      reactions: {
        ...item.reactions,
        love: Math.max(0, item.reactions.love + (loved ? 1 : -1)),
      },
    };
    saveLocal(posts);
    return posts[idx];
  }
}