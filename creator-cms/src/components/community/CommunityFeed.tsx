import { useState } from 'react';
import { Heart, MessageCircle, Send } from 'lucide-react';
import {
  addCommunityReply,
  togglePostLove,
  type CommunityPost,
} from '../../lib/communityStore';
import { useLocale } from '../../context/LocaleContext';
import { useAuth } from '../../context/AuthContext';
import { formatRelativeTime } from '../../lib/relativeTime';

interface Props {
  posts: CommunityPost[];
  onUpdate: () => void;
}

export function CommunityFeed({ posts, onUpdate }: Props) {
  const { locale } = useLocale();
  const { user } = useAuth();
  const te = locale === 'te';
  const [lovingId, setLovingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const authorName = user?.display_name || 'Creator';

  if (posts.length === 0) {
    return (
      <div className="cv2-empty" lang={te ? 'te' : 'en'}>
        {te
          ? 'ఇంకా పోస్టులు లేవు — మీ పాఠకులతో మొదటి సందేశం పంచుకోండి.'
          : 'No posts yet — share your first note with readers.'}
      </div>
    );
  }

  const handleLove = async (postId: string) => {
    if (lovingId) return;
    setLovingId(postId);
    try {
      await togglePostLove(postId);
      onUpdate();
    } finally {
      setLovingId(null);
    }
  };

  const handleReply = async (postId: string) => {
    const body = (replyDrafts[postId] || '').trim();
    if (!body || replyingId) return;
    setReplyingId(postId);
    try {
      await addCommunityReply(postId, body, authorName, true);
      setReplyDrafts((prev) => ({ ...prev, [postId]: '' }));
      onUpdate();
    } finally {
      setReplyingId(null);
    }
  };

  return (
    <ul className="cv2-feed" role="list">
      {posts.map((post) => {
        const replies = post.replies ?? [];
        const expanded = expandedId === post.id || replies.length > 0;
        return (
          <li key={post.id} className="cv2-post">
            <header className="cv2-post-head">
              <div className="cv2-post-avatar" aria-hidden>
                {post.author_name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <span className="cv2-post-author">
                  {post.author_name}
                  <span className="cv2-post-role">{te ? 'రచయిత' : 'Author'}</span>
                </span>
                <time className="cv2-post-time" dateTime={post.created_at}>
                  {formatRelativeTime(Date.parse(post.created_at))}
                </time>
              </div>
            </header>

            <p className="cv2-post-body" lang="te">{post.body}</p>

            {post.story_title && (
              <p className="cv2-post-story" lang="te">
                {post.story_title}
                {post.chapter_number != null ? ` · Ch. ${post.chapter_number}` : ''}
              </p>
            )}

            <div className="cv2-post-actions">
              <button
                type="button"
                className={`cv2-post-action${post.viewer_loved ? ' is-liked' : ''}`}
                onClick={() => void handleLove(post.id)}
                disabled={lovingId === post.id}
                aria-pressed={post.viewer_loved}
              >
                <Heart size={15} fill={post.viewer_loved ? 'currentColor' : 'none'} aria-hidden />
                {post.reactions.love > 0 ? post.reactions.love : (te ? 'ప్రేమ' : 'Love')}
              </button>
              <button
                type="button"
                className="cv2-post-action"
                onClick={() => setExpandedId((id) => (id === post.id ? null : post.id))}
              >
                <MessageCircle size={15} aria-hidden />
                {replies.length > 0
                  ? `${replies.length} ${te ? 'స్పందనలు' : 'replies'}`
                  : (te ? 'స్పందించండి' : 'Reply')}
              </button>
            </div>

            {expanded && (
              <div className="cv2-replies">
                {replies.map((reply) => (
                  <div key={reply.id} className="cv2-reply">
                    <span
                      className="cv2-reply-avatar"
                      style={{ background: reply.avatar_color || '#7A2E2E' }}
                      aria-hidden
                    >
                      {reply.author_name.slice(0, 1)}
                    </span>
                    <div className="cv2-reply-bubble">
                      <p className="cv2-reply-author" lang="te">
                        {reply.author_name}
                        {reply.author_role === 'author' && (
                          <span className="cv2-reply-creator-tag">{te ? 'రచయిత' : 'Author'}</span>
                        )}
                      </p>
                      <p className="cv2-reply-text" lang="te">{reply.body}</p>
                    </div>
                  </div>
                ))}
                <div className="cv2-reply-composer">
                  <input
                    type="text"
                    value={replyDrafts[post.id] || ''}
                    onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                    placeholder={te ? 'పాఠకుడికి పేరుతో సమాధానం…' : 'Reply to a reader by name…'}
                    aria-label={te ? 'సమాధానం' : 'Reply'}
                    lang="te"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void handleReply(post.id);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="cv2-reply-send"
                    onClick={() => void handleReply(post.id)}
                    disabled={replyingId === post.id || !(replyDrafts[post.id] || '').trim()}
                    aria-label={te ? 'పంపు' : 'Send'}
                  >
                    <Send size={14} aria-hidden />
                  </button>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
