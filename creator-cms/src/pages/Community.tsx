import { MessageCircle, Users, Heart, Megaphone } from 'lucide-react';
export function Community() {
  return (
    <div className="cms-page">
      <header className="cms-page-header">
        <div>
          <h1 className="cms-page-header__title">Community</h1>
          <p className="cms-page-header__subtitle">Connect with readers, respond to comments, and grow your fan base.</p>
        </div>
      </header>

      <div className="community-grid">
        <div className="cms-panel community-stat">
          <Users size={22} color="var(--dash-gold)" aria-hidden />
          <div className="community-stat__value">—</div>
          <div className="community-stat__label">Active followers</div>
        </div>
        <div className="cms-panel community-stat">
          <MessageCircle size={22} color="var(--dash-gold)" aria-hidden />
          <div className="community-stat__value">—</div>
          <div className="community-stat__label">Unread comments</div>
        </div>
        <div className="cms-panel community-stat">
          <Heart size={22} color="var(--dash-gold)" aria-hidden />
          <div className="community-stat__value">—</div>
          <div className="community-stat__label">Reactions this week</div>
        </div>
      </div>

      <div className="cms-panel">
        <div className="cms-panel__head">
          <h3 className="cms-panel__title"><Megaphone size={18} aria-hidden /> Community inbox</h3>
        </div>
        <div className="cms-empty" style={{ padding: '40px 24px' }}>
          <MessageCircle size={36} className="cms-empty__icon" />
          <h3 className="cms-empty__title">Your community hub is ready</h3>
          <p className="cms-empty__text">Reader comments, fan messages, and community posts will appear here as your audience grows.</p>
        </div>
      </div>
    </div>
  );
}