/**
 * Katha community feed — API-backed with local fallback for offline/dev.
 * Supports author posts, reader replies, reactions, founding readers strip.
 * Seed content is original fiction only (no film/IP names).
 */

import { api } from './api';

export type CommunityPostType = 'chapter_share' | 'milestone' | 'discussion' | 'release';

export interface CommunityReply {
  id: string;
  author_name: string;
  author_role?: 'reader' | 'author';
  body: string;
  created_at: string;
  avatar_color?: string;
}

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
  replies?: CommunityReply[];
}

export interface FoundingReader {
  id: string;
  name: string;
  initial: string;
  color: string;
}

export interface ChapterDiscussion {
  story_id: string;
  story_title: string;
  chapter_number: number;
  chapter_title: string;
  comment_count: number;
  last_activity_label: string;
}

/** Bump key to purge legacy IP/test posts (RRR title, ollama, etc.) from localStorage. */
const KEY = 'katha_community_posts_v3';
const REPLIES_KEY = 'katha_community_replies_v3';

const AVATAR_COLORS = ['#7A2E2E', '#B8863B', '#6B8570', '#5C2222', '#4A6741', '#8B5A2B'];

const BLOCKED_BODY =
  /ollama|Hello How are you|రౌద్రం\s*రణం\s*రుధిరం|రామరాజు|Rajamouli|Allu\s*Arjun|\bRRR\b/i;
const BLOCKED_TITLE =
  /రౌద్రం\s*రణం\s*రుధిరం|Rajamouli|Allu\s*Arjun|\bRRR\b|demo-rrr/i;

function isCleanPost(p: CommunityPost): boolean {
  if (BLOCKED_BODY.test(p.body)) return false;
  if (p.story_title && BLOCKED_TITLE.test(p.story_title)) return false;
  return true;
}

/** Original Telugu demo — valley / monsoon arc (no film IP). */
function seedPosts(): CommunityPost[] {
  const now = Date.now();
  return [
    {
      id: 'seed-release-ch3',
      author_id: 'author',
      author_name: 'లక్ష్మీ దేవి',
      type: 'release',
      body:
        'మూడవ అధ్యాయం రేపు ఉదయం 8 గంటలకు విడుదల — లోయలో వర్షం వచ్చే ముందు రాత్రి. మీరంతా ఇక్కడి వరకు నాతో ప్రయాణించినందుకు ధన్యవాదాలు 🙏',
      story_title: 'వర్షం వచ్చే ముందు',
      chapter_number: 3,
      created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      reactions: { love: 12, comment: 2 },
      viewer_loved: false,
      replies: [
        {
          id: 'r1',
          author_name: 'లావణ్య',
          author_role: 'reader',
          body: 'మొదటి అధ్యాయం నుంచీ టేకు తలుపు చట్రం గుర్తు ఉంది — ఎదురుచూస్తున్నా 💛',
          created_at: new Date(now - 90 * 60 * 1000).toISOString(),
          avatar_color: '#7A2E2E',
        },
        {
          id: 'r2',
          author_name: 'ప్రవీణ్',
          author_role: 'reader',
          body: 'ఉదయం 8కి అలారం పెట్టేసుకున్నా 😄',
          created_at: new Date(now - 75 * 60 * 1000).toISOString(),
          avatar_color: '#B8863B',
        },
      ],
    },
  ];
}

function loadLocal(): CommunityPost[] {
  try {
    // Drop legacy v2 keys that may hold film IP / ollama test posts
    try {
      localStorage.removeItem('katha_community_posts_v2');
      localStorage.removeItem('katha_community_replies_v2');
    } catch { /* ignore */ }

    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CommunityPost[];
      const cleaned = parsed.filter(isCleanPost);
      if (cleaned.length > 0) {
        if (cleaned.length !== parsed.length) saveLocal(cleaned);
        return cleaned;
      }
    }
  } catch { /* ignore */ }
  const seed = seedPosts();
  saveLocal(seed);
  return seed;
}

function saveLocal(posts: CommunityPost[]) {
  localStorage.setItem(KEY, JSON.stringify(posts));
}

export function getFoundingReaders(): FoundingReader[] {
  return [
    { id: 'fr1', name: 'లావణ్య', initial: 'ల', color: '#7A2E2E' },
    { id: 'fr2', name: 'ప్రవీణ్', initial: 'ప్ర', color: '#B8863B' },
    { id: 'fr3', name: 'సుధా', initial: 'సు', color: '#6B8570' },
    { id: 'fr4', name: 'కిరణ్', initial: 'కి', color: '#5C2222' },
    { id: 'fr5', name: 'మీనా', initial: 'మీ', color: '#4A6741' },
  ];
}

/**
 * Chapter discussion list — only real creator stories.
 * Empty shelf: honest empty state (no fake film titles).
 */
export function getChapterDiscussions(
  stories: Array<{ id: string; title: string; chapter_count?: number }>,
): ChapterDiscussion[] {
  if (stories.length === 0) return [];
  return stories.slice(0, 3).map((s, i) => ({
    story_id: s.id,
    story_title: s.title,
    chapter_number: Math.max(1, (s.chapter_count ?? 1) - i),
    chapter_title: s.title,
    comment_count: 0,
    last_activity_label: i === 0 ? '—' : '—',
  }));
}

export async function listCommunityPosts(): Promise<CommunityPost[]> {
  try {
    const { posts } = await api.getCommunityPosts();
    const cleaned = (posts as CommunityPost[]).filter(isCleanPost);
    if (cleaned.length === 0) return loadLocal();
    const local = loadLocal();
    return cleaned.map((p) => {
      const localMatch = local.find((l) => l.id === p.id);
      return {
        ...p,
        replies: p.replies?.length ? p.replies : localMatch?.replies ?? [],
      };
    });
  } catch {
    return loadLocal().sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  }
}

export async function createCommunityPost(
  input: Omit<CommunityPost, 'id' | 'created_at' | 'reactions' | 'viewer_loved' | 'replies'>,
): Promise<CommunityPost> {
  try {
    const { post } = await api.createCommunityPost(input);
    const full: CommunityPost = { ...post, replies: [] };
    const local = loadLocal().filter((p) => p.id !== full.id);
    saveLocal([full, ...local]);
    return full;
  } catch {
    const post: CommunityPost = {
      ...input,
      id: `cp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
      reactions: { love: 0, comment: 0 },
      viewer_loved: false,
      replies: [],
    };
    saveLocal([post, ...loadLocal()]);
    return post;
  }
}

export async function togglePostLove(postId: string): Promise<CommunityPost | null> {
  try {
    const { post } = await api.toggleCommunityPostLove(postId);
    return post as CommunityPost;
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

export async function addCommunityReply(
  postId: string,
  body: string,
  authorName: string,
  asAuthor = true,
): Promise<CommunityPost | null> {
  const posts = loadLocal();
  const idx = posts.findIndex((p) => p.id === postId);
  if (idx < 0) return null;
  const reply: CommunityReply = {
    id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    author_name: authorName,
    author_role: asAuthor ? 'author' : 'reader',
    body: body.trim(),
    created_at: new Date().toISOString(),
    avatar_color: AVATAR_COLORS[asAuthor ? 0 : Math.floor(Math.random() * AVATAR_COLORS.length)],
  };
  const item = posts[idx];
  const replies = [...(item.replies ?? []), reply];
  posts[idx] = {
    ...item,
    replies,
    reactions: {
      ...item.reactions,
      comment: replies.length,
    },
  };
  saveLocal(posts);
  try {
    localStorage.setItem(REPLIES_KEY, JSON.stringify({ [postId]: replies }));
  } catch { /* ignore */ }
  return posts[idx];
}
