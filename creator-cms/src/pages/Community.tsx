import { useCallback, useEffect, useState } from 'react';
import { Users, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import { DiyaIcon } from '../components/studio/DiyaIcon';
import { useLocale } from '../context/LocaleContext';
import { api } from '../lib/api';
import type { StoryData } from '../types/database';
import { listCommunityPosts, type CommunityPost } from '../lib/communityStore';
import { CommunityComposer } from '../components/community/CommunityComposer';
import { CommunityFeed } from '../components/community/CommunityFeed';
import { StudioGlyph } from '../components/studio/StudioGlyph';
import type { StudioGlyphId } from '../components/studio/StudioGlyph';

const COMMUNITY_SIGNALS: Array<{
  glyph: StudioGlyphId;
  titleKey: 'community.signalLetters' | 'community.signalReactions' | 'community.signalWarmth';
  te: string;
}> = [
  { glyph: 'users', titleKey: 'community.signalLetters', te: 'పాఠకుల సందేశాలు' },
  { glyph: 'message', titleKey: 'community.signalReactions', te: 'అధ్యాయ ప్రతిస్పందనలు' },
  { glyph: 'heart', titleKey: 'community.signalWarmth', te: 'వారపు వెచ్చదనం' },
];

export function Community() {
  const { t } = useLocale();
  const [stories, setStories] = useState<StoryData[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);

  const reloadFeed = useCallback(() => {
    listCommunityPosts()
      .then(setPosts)
      .catch(() => setPosts([]));
  }, []);

  useEffect(() => {
    api.getCreatorStories()
      .then((r) => setStories(r.stories ?? []))
      .catch(() => setStories([]));
    reloadFeed();
  }, [reloadFeed]);

  return (
    <div className="cms-page studio-page community-studio community-studio--premium wc-page-enter">
      <div className="community-studio__hero community-studio__hero--uplift">
        <div className="community-hero__glow" aria-hidden />
        <StudioPageHeader
          variant="hero"
          eyebrow={t('community.eyebrow')}
          eyebrowIcon={Users}
          title={t('community.heroTitle')}
          subtitle={t('community.heroSubtitle')}
        />
      </div>

      <div className="wc-stagger-children">
      <CommunityComposer stories={stories} onPosted={reloadFeed} />

      <section className="community-feed-section" aria-labelledby="community-feed-title">
        <div className="community-feed-section__head">
          <h2 id="community-feed-title" className="community-feed-section__title">
            <Sparkles size={18} aria-hidden />
            {t('community.feedTitle')}
          </h2>
          <Link to="/stories" className="community-feed-section__link">
            {t('community.shareInKatha')}
          </Link>
        </div>
        <CommunityFeed posts={posts} onUpdate={reloadFeed} />
        <p className="community-feed-section__footer">{t('community.externalLater')}</p>
      </section>

      <section className="community-signals community-signals--compact" aria-label="Community signals">
        {COMMUNITY_SIGNALS.map((signal) => (
          <div key={signal.titleKey} className="community-signal" role="listitem">
            <div className="community-signal__icon">
              <StudioGlyph id={signal.glyph} variant="soft" size={20} />
            </div>
            <div className="community-signal__copy">
              <h3 className="community-signal__title">{t(signal.titleKey)}</h3>
              <p className="community-signal__te" lang="te">{signal.te}</p>
            </div>
            <span className="community-signal__status">
              <DiyaIcon size={14} aria-hidden />
              {t('common.comingSoon')}
            </span>
          </div>
        ))}
      </section>
      </div>
    </div>
  );
}