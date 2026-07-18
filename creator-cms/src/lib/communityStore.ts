/**
 * Katha community feed — API-backed with local fallback for offline/dev.
 * Supports author posts, reader replies, reactions, founding readers strip.
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

const KEY = 'katha_community_posts_v2';
const REPLIES_KEY = 'katha_community_replies_v2';

const AVATAR_COLORS = ['#7A2E2E', '#B8863B', '#6B8570', '#5C2222', '#4A6741', '#8B5A2B'];

function seedPosts(): CommunityPost[] {
  const now = Date.now();
  return [
    {
      id: 'seed-release-ch8',
      author_id: 'author',
      author_name: 'Chandra Tej',
      type: 'release',
      body: 'Chapter 8 రేపు ఉదయం 8 గంటలకు విడుదల అవుతుంది — రామరాజు కథ ముగింపు వైపు అడుగులు వేస్తుంది. మీరంతా ఇక్కడి వరకు నాతో ప్రయాణించినందుకు ధన్యవాదాలు 🙏',
      story_title: 'రౌద్రం రణం రుధిరం',
      chapter_number: 8,
      created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      reactions: { love: 24, comment: 3 },
      viewer_loved: false,
      replies: [
        {
          id: 'r1',
          author_name: 'లావణ్య',
          author_role: 'reader',
          body: 'చాలా ఎదురుచూస్తున్నా! రామరాజు కథ నన్ను మొదటి అధ్యాయం నుండే కట్టిపడేసింది 💛',
          created_at: new Date(now - 90 * 60 * 1000).toISOString(),
          avatar_color: '#7A2E2E',
        },
        {
          id: 'r2',
          author_name: 'ప్రవీణ్',
          author_role: 'reader',
          body: 'ఉదయం 8కి అలారం పెట్టేసుకున్నా 😄 ఆల్ ది బెస్ట్!',
          created_at: new Date(now - 75 * 60 * 1000).toISOString(),
          avatar_color: '#B8863B',
        },
        {
          id: 'r3',
          author_name: 'Chandra Tej',
          author_role: 'author',
          body: '@ప్రవీణ్ 😄 నీ మద్దతుకి ధన్యవాదాలు — ఈ చాప్టర్ ప్రత్యేకంగా నీలాంటి వారికోసమే రాశాను!',
          created_at: new Date(now - 60 * 60 * 1000).toISOString(),
          avatar_color: '#7A2E2E',
        },
      ],
    },
  ];
}

function loadLocal(): CommunityPost[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CommunityPost[];
      // Drop leftover English "ollama" test posts
      const cleaned = parsed.filter(
        (p) => !/ollama/i.test(p.body) && !/Hello How are you/i.test(p.body),
      );
      if (cleaned.length > 0) return cleaned;
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

export function getChapterDiscussions(stories: Array<{ id: string; title: string; chapter_count?: number }>): ChapterDiscussion[] {
  if (stories.length === 0) {
    return [
      {
        story_id: '',
        story_title: 'రౌద్రం రణం రుధిరం',
        chapter_number: 7,
        chapter_title: 'ముగింపు - రౌద్రం రణం రుధిరం',
        comment_count: 12,
        last_activity_label: '3 గంటల క్రితం',
      },
      {
        story_id: '',
        story_title: 'రౌద్రం రణం రుధిరం',
        chapter_number: 5,
        chapter_title: 'గతం - రామరాజు లక్ష్యం',
        comment_count: 8,
        last_activity_label: 'నిన్న',
      },
    ];
  }
  return stories.slice(0, 2).map((s, i) => ({
    story_id: s.id,
    story_title: s.title,
    chapter_number: Math.max(1, (s.chapter_count ?? 1) - i),
    chapter_title: s.title,
    comment_count: 4 + i * 4,
    last_activity_label: i === 0 ? '3 గంటల క్రితం' : 'నిన్న',
  }));
}

export async function listCommunityPosts(): Promise<CommunityPost[]> {
  try {
    const { posts } = await api.getCommunityPosts();
    const cleaned = (posts as CommunityPost[]).filter(
      (p) => !/ollama/i.test(p.body) && !/Hello How are you/i.test(p.body),
    );
    if (cleaned.length === 0) return loadLocal();
    // Merge local replies if API posts lack them
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
