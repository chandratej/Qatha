import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, BookOpen } from 'lucide-react';
import { createCommunityPost } from '../../lib/communityStore';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import type { StoryData } from '../../types/database';

interface Props {
  stories: StoryData[];
  onPosted: () => void;
}

export function CommunityComposer({ stories, onPosted }: Props) {
  const { user } = useAuth();
  const { t } = useLocale();
  const [body, setBody] = useState('');
  const [storyId, setStoryId] = useState(stories[0]?.id ?? '');
  const [chapter, setChapter] = useState('1');
  const [busy, setBusy] = useState(false);

  const selected = stories.find((s) => s.id === storyId);

  const handlePost = async () => {
    if (!body.trim() || !user || busy) return;
    setBusy(true);
    try {
      await createCommunityPost({
        author_id: user.id,
        author_name: user.display_name || 'Creator',
        type: 'chapter_share',
        body: body.trim(),
        story_id: storyId || undefined,
        story_title: selected?.title,
        chapter_number: chapter ? Number(chapter) : undefined,
      });
      setBody('');
      onPosted();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="community-composer" aria-label={t('community.composerLabel')}>
      <div className="community-composer__avatar" aria-hidden>
        {(user?.display_name || 'C').slice(0, 1).toUpperCase()}
      </div>
      <div className="community-composer__body">
        <textarea
          className="community-composer__input"
          placeholder={t('community.composerPlaceholder')}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          maxLength={500}
        />
        {stories.length > 0 && (
          <div className="community-composer__attach">
            <BookOpen size={14} aria-hidden />
            <select
              className="community-composer__select"
              value={storyId}
              onChange={(e) => setStoryId(e.target.value)}
              aria-label={t('community.attachStory')}
            >
              {stories.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
            <select
              className="community-composer__select community-composer__select--chapter"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              aria-label={t('community.attachChapter')}
            >
              {Array.from({ length: Math.max(selected?.chapter_count ?? 1, 1) }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{t('community.chapterShort')} {n}</option>
              ))}
            </select>
          </div>
        )}
        {stories.length === 0 && (
          <p className="community-composer__hint">
            <Link to="/stories/new">{t('community.createStoryFirst')}</Link>
          </p>
        )}
        <div className="community-composer__actions">
          <span className="community-composer__note">{t('community.kathaFirstHint')}</span>
          <button
            type="button"
            className="katha-cta katha-cta--maroon community-composer__submit"
            disabled={busy || !body.trim()}
            onClick={() => void handlePost()}
          >
            <Send size={16} aria-hidden />
            {busy ? t('common.loading') : t('community.postToFeed')}
          </button>
        </div>
      </div>
    </section>
  );
}