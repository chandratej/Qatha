import { useState } from 'react';
import { Heart, MessageCircle, BookOpen, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { togglePostLove, type CommunityPost } from '../../lib/communityStore';
import { useLocale } from '../../context/LocaleContext';
import { formatRelativeTime } from '../../lib/relativeTime';
import { StudioEmptyState } from '../studio/StudioEmptyState';

interface Props {
  posts: CommunityPost[];
  onUpdate: () => void;
}

export function CommunityFeed({ posts, onUpdate }: Props) {
  const { t } = useLocale();
  const [lovingId, setLovingId] = useState<string | null>(null);

  if (posts.length === 0) {
    return (
      <StudioEmptyState
        className="community-feed-empty--v2"
        icon={Users}
        iconSize={28}
        title={t('community.feedEmptyTitle')}
        titleTe={t('community.feedEmptyTe')}
        text={t('community.feedPlaceholder')}
      />
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

  return (
    <ul className="community-feed-list" role="list">
      {posts.map((post) => (
        <li key={post.id} className="community-feed-card">
          <header className="community-feed-card__head">
            <span className="community-feed-card__avatar" aria-hidden>
              {post.author_name.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <strong className="community-feed-card__author">{post.author_name}</strong>
              <time className="community-feed-card__time" dateTime={post.created_at}>
                {formatRelativeTime(Date.parse(post.created_at))}
              </time>
            </div>
          </header>
          <p className="community-feed-card__body">{post.body}</p>
          {post.story_title && (
            <Link
              to={post.story_id ? `/stories/${post.story_id}` : '/stories'}
              className="community-feed-card__story"
            >
              <BookOpen size={14} aria-hidden />
              {post.story_title}
              {post.chapter_number != null && ` · ${t('community.chapter')} ${post.chapter_number}`}
            </Link>
          )}
          <footer className="community-feed-card__actions">
            <button
              type="button"
              className={`community-feed-card__action${post.viewer_loved ? ' is-loved' : ''}`}
              onClick={() => void handleLove(post.id)}
              disabled={lovingId === post.id}
              aria-pressed={post.viewer_loved}
            >
              <Heart size={16} aria-hidden />
              {post.reactions.love > 0 ? post.reactions.love : t('community.love')}
            </button>
            <span className="community-feed-card__action community-feed-card__action--static">
              <MessageCircle size={16} aria-hidden />
              {t('common.comingSoon')}
            </span>
          </footer>
        </li>
      ))}
    </ul>
  );
}