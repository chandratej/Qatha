import { Menu, Feather, Check, Clock, Focus, MoreHorizontal, Rocket } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';

interface EditorNavbarProps {
  storyLabel: string;
  seasonLabel: string;
  chapterLabel: string;
  saving: boolean;
  onHistory: () => void;
  onFocus: () => void;
  onPublish: () => void;
}

export function EditorNavbar({
  storyLabel,
  seasonLabel,
  chapterLabel,
  saving,
  onHistory,
  onFocus,
  onPublish,
}: EditorNavbarProps) {
  return (
    <header className="katha-proto-navbar">
      <div className="katha-proto-brand">
        <button type="button" className="katha-proto-nav-btn" style={{ border: 'none', padding: '0 8px' }} aria-label="Menu">
          <Menu size={18} />
        </button>
        <Feather size={20} className="katha-proto-brand-feather" />
        <span className="katha-proto-brand-name">Katha</span>
      </div>

      <nav className="katha-proto-breadcrumb" aria-label="Chapter location">
        <span>{storyLabel}</span>
        <span>›</span>
        <span>{seasonLabel}</span>
        <span>›</span>
        <span>{chapterLabel}</span>
      </nav>

      <div className="katha-proto-nav-actions">
        <span className="katha-proto-save-status">
          {!saving && <Check size={14} />}
          {saving ? 'Saving…' : 'All changes saved'}
        </span>
        <button type="button" className="katha-proto-nav-btn" onClick={onHistory}>
          <Clock size={15} /> History
        </button>
        <button type="button" className="katha-proto-nav-btn" onClick={onFocus}>
          <Focus size={15} /> Focus
        </button>
        <ThemeToggle compact />
        <button type="button" className="katha-proto-nav-btn" style={{ padding: '0 10px' }} aria-label="More options">
          <MoreHorizontal size={16} />
        </button>
        <button type="button" className="katha-proto-publish-btn" onClick={onPublish}>
          <Rocket size={15} /> Publish
        </button>
      </div>
    </header>
  );
}