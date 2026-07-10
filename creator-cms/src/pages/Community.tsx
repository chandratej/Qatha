import { useEffect, useState } from 'react';
import { Heart, Megaphone, MessageCircle, Share2, Users } from 'lucide-react';
import { platformApi } from '../lib/platformApi';
import { Link } from 'react-router-dom';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import { DiyaIcon } from '../components/studio/DiyaIcon';
import { BrandMark } from '../components/studio/BrandMark';

const GROW_STEPS = [
  { id: 'publish', te: 'ప్రచురించు', text: 'Publish your first chapter and share the reader link on WhatsApp.' },
  { id: 'rhythm', te: 'స్థిరత', text: 'Post consistently — readers follow writers who show up.' },
  { id: 'reply', te: 'స్పందన', text: 'Engage with fans when comments arrive. Every reply builds loyalty.' },
];

const COMMUNITY_SIGNALS = [
  {
    icon: Users,
    title: 'Reader letters',
    te: 'పాఠకుల సందేశాలు',
    hint: 'Fan messages land here as your stories travel on WhatsApp.',
  },
  {
    icon: MessageCircle,
    title: 'Chapter reactions',
    te: 'అధ్యాయ ప్రతిస్పందనలు',
    hint: 'Comments and love-notes attach to each published chapter.',
  },
  {
    icon: Heart,
    title: 'Weekly warmth',
    te: 'వారపు వెచ్చదనం',
    hint: 'Reactions and saves — the quiet proof your craft is reaching hearts.',
  },
];

export function Community() {
  const [readerSystems, setReaderSystems] = useState<Array<{ id: string; label: string; status: string }>>([]);

  useEffect(() => {
    platformApi.getReaderSystems().then((r) => setReaderSystems([...r.systems]));
  }, []);

  return (
    <div className="cms-page studio-page community-studio">
      <div className="community-studio__hero">
        <StudioPageHeader
          eyebrow="పాఠక సమాజం · Reader community"
          eyebrowIcon={Users}
          title="Your audience is growing"
          subtitle="Even before your first comment arrives, this is where reader love will live — messages, reactions, and the community that forms around your stories."
        />
      </div>

      <section className="community-signals" aria-label="Community signals — coming alive with readers">
        {COMMUNITY_SIGNALS.map((signal) => (
          <div key={signal.title} className="community-signal" role="listitem">
            <div className="community-signal__icon">
              <signal.icon size={20} aria-hidden />
            </div>
            <div className="community-signal__copy">
              <h3 className="community-signal__title">{signal.title}</h3>
              <p className="community-signal__te" lang="te">{signal.te}</p>
              <p className="community-signal__hint">{signal.hint}</p>
            </div>
            <span className="community-signal__status">
              <DiyaIcon size={14} aria-hidden />
              Lighting soon
            </span>
          </div>
        ))}
      </section>

      <div className="cms-panel community-inbox-studio">
        <div className="community-inbox-studio__head">
          <h3 className="cms-panel__title cms-panel__title--inline">
            <Megaphone size={18} aria-hidden />
            Community inbox
          </h3>
        </div>
        <div className="community-empty-alive">
          <div className="community-empty-alive__visual" aria-hidden>
            <div className="community-ghost-message">
              <div className="community-ghost-message__line" />
              <div className="community-ghost-message__line community-ghost-message__line--short" />
            </div>
            <div className="community-ghost-message">
              <div className="community-ghost-message__line" />
              <div className="community-ghost-message__line" />
              <div className="community-ghost-message__line community-ghost-message__line--short" />
            </div>
          </div>
          <h3 className="community-empty-alive__title">Your community hub is ready</h3>
          <p className="community-empty-alive__text">
            Reader comments and fan messages will appear here as your audience discovers your stories.
            Share your work to start the conversation.
          </p>
          <div className="community-grow-steps" aria-label="Steps to grow your community">
            {GROW_STEPS.map((item) => (
              <div key={item.id} className="community-grow-step">
                <span className="community-grow-step__mark" aria-hidden>
                  <BrandMark size="xs" />
                </span>
                <div>
                  <span className="community-grow-step__te" lang="te">{item.te}</span>
                  <span className="community-grow-step__text">{item.text}</span>
                </div>
              </div>
            ))}
          </div>
          <Link to="/stories" className="katha-cta katha-cta--soft cms-mt-6">
            <Share2 size={16} aria-hidden />
            Share a chapter
          </Link>
        </div>
      </div>

      <section className="cms-panel cms-mt-6">
        <h3 className="dashboard-panel__title">Reader systems (Master PRD §5)</h3>
        <ul className="platform-monetization-list">
          {readerSystems.map((s) => (
            <li key={s.id} className={`platform-monetization-item platform-monetization-item--${s.status === 'live' ? 'live' : 'planned'}`}>
              <span>{s.label}</span>
              <span className="platform-monetization-item__status">{s.status}</span>
            </li>
          ))}
        </ul>
        <Link to="/platform" className="panel-view-all">Full platform map →</Link>
      </section>
    </div>
  );
}