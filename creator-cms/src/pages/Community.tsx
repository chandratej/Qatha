import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Flame, MessageSquare, Sparkles, Users, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { api } from '../lib/api';
import type { StoryData } from '../types/database';
import {
  getChapterDiscussions,
  getFoundingReaders,
  listCommunityPosts,
  type CommunityPost,
} from '../lib/communityStore';
import { CommunityComposer } from '../components/community/CommunityComposer';
import { CommunityFeed } from '../components/community/CommunityFeed';

/**
 * Reader community — visual parity with katha_community_v2.html
 */
export function Community() {
  const { locale } = useLocale();
  const te = locale === 'te';
  const [stories, setStories] = useState<StoryData[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const founding = getFoundingReaders();
  const discussions = getChapterDiscussions(
    stories.map((s) => ({ id: s.id, title: s.title, chapter_count: s.chapter_count })),
  );

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
    <div className="cms-page katha-cv2-page">
      <div className="katha-cv2">
        <header className="cv2-page-head">
          <p className="cv2-eyebrow" lang={te ? 'te' : 'en'}>
            <Users size={14} aria-hidden />
            {te ? 'పాఠక సమాజం' : 'Reader community'}
          </p>
          <h1 className="cv2-title" lang={te ? 'te' : 'en'}>
            {te ? 'మీ ప్రేక్షకులు పెరుగుతున్నారు' : 'Your audience is growing'}
          </h1>
          <p className="cv2-subtitle" lang={te ? 'te' : 'en'}>
            {te
              ? 'కథలో ముందుగా షేర్ చేయండి, పాఠకులతో మాట్లాడండి — వాట్సాప్, ఇన్‌స్టాగ్రామ్ కంటే ముందు ఇక్కడే.'
              : 'Share on Katha first, talk with readers here — before WhatsApp or Instagram.'}
          </p>
        </header>

        <section className="cv2-presence" aria-label="Founding Readers">
          <div className="cv2-avatar-stack" aria-hidden>
            {founding.slice(0, 3).map((r) => (
              <span key={r.id} className="cv2-av" style={{ background: r.color }}>
                {r.initial}
              </span>
            ))}
            {founding.length > 3 && (
              <span className="cv2-av" style={{ background: '#5C2222' }}>
                +{founding.length - 3}
              </span>
            )}
          </div>
          <p className="cv2-presence-text" lang={te ? 'te' : 'en'}>
            {te ? (
              <><b>{founding.length} మంది పాఠకులు</b> మొదటి అధ్యాయం నుండి మీతో ఉన్నారు</>
            ) : (
              <><b>{founding.length} readers</b> have been with you since chapter one</>
            )}
          </p>
          <span className="cv2-presence-badge">
            <Flame size={12} aria-hidden />
            Founding Readers
          </span>
        </section>

        <CommunityComposer stories={stories} onPosted={reloadFeed} />

        <div className="cv2-section-head">
          <h3 lang={te ? 'te' : 'en'}>
            <Sparkles size={16} aria-hidden />
            {te ? 'కమ్యూనిటీ ఫీడ్' : 'Community feed'}
          </h3>
        </div>
        <CommunityFeed posts={posts} onUpdate={reloadFeed} />

        <div className="cv2-section-head cv2-section-head--spaced">
          <h3 lang={te ? 'te' : 'en'}>
            <MessageSquare size={16} aria-hidden />
            {te ? 'అధ్యాయాల చర్చ' : 'Chapter discussion'}
          </h3>
          <Link to="/stories" lang={te ? 'te' : 'en'}>
            {te ? 'అన్నీ చూడండి' : 'View all'}
          </Link>
        </div>

        {discussions.length === 0 ? (
          <div className="cv2-roadmap" role="status" lang={te ? 'te' : 'en'}>
            <MessageSquare size={16} aria-hidden />
            <span>
              {te
                ? 'అధ్యాయాల చర్చ త్వరలో — మీ కథలు ప్రచురించిన తర్వాత ఇక్కడ కనిపిస్తాయి. ఇప్పుడు కమ్యూనిటీ ఫీడ్‌లో షేర్ చేయండి.'
                : 'Chapter discussion is early-stage — it will list your published stories here. For now, use the community feed above.'}
            </span>
          </div>
        ) : (
          discussions.map((d) => (
            <div key={`${d.story_id}-${d.chapter_number}`} className="cv2-chapter-talk">
              <div>
                <p className="cv2-chapter-talk-title" lang="te">
                  Chapter {d.chapter_number} — {d.chapter_title}
                </p>
                <p className="cv2-chapter-talk-meta" lang={te ? 'te' : 'en'}>
                  {te ? 'మీ కథ' : 'Your story'}
                </p>
              </div>
              <Link
                className="cv2-chapter-talk-link"
                to={d.story_id ? `/stories/${d.story_id}/chapters/${d.chapter_number}` : '/stories'}
                lang={te ? 'te' : 'en'}
              >
                {te ? 'తెరవండి' : 'Open'}
                <ArrowRight size={14} aria-hidden />
              </Link>
            </div>
          ))
        )}

        <div className="cv2-roadmap" role="note" lang={te ? 'te' : 'en'}>
          <Wrench size={16} aria-hidden />
          <span>
            {te
              ? 'కమ్యూనిటీ ఫీడ్ + రచయిత సమాధానాలు స్థానికంగా పనిచేస్తాయి. పూర్తి పాఠక వ్యాఖ్యలు/నోటిఫికేషన్లు తర్వాత.'
              : 'Community feed and author replies work now. Full reader comments and notifications come later — no empty “coming soon” tiles.'}
          </span>
        </div>
      </div>
    </div>
  );
}
