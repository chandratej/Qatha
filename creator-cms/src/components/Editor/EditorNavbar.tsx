import { useNavigate } from 'react-router-dom';
import { Menu, Feather, Check, Clock, Focus, Rocket, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';

interface EditorNavbarProps {
  storyLabel: string;
  seasonLabel: string;
  chapterLabel: string;
  backTo?: string;
  saving: boolean;
  onHistory: () => void;
  onFocus: () => void;
  onPublish: () => void;
  onSaveDraft: () => void;
  publishLabel?: string;
}

export function EditorNavbar({
  storyLabel,
  seasonLabel,
  chapterLabel,
  backTo,
  saving,
  onHistory,
  onFocus,
  onPublish,
  onSaveDraft,
  publishLabel = 'Publish',
}: EditorNavbarProps) {
  const navigate = useNavigate();

  return (
    <header className="katha-proto-navbar">
      <div className="katha-proto-brand">
        <button
          type="button"
          className="katha-proto-nav-btn katha-proto-nav-btn--menu"
          onClick={() => (backTo ? navigate(backTo) : navigate('/stories'))}
          aria-label="Back to chapters"
          title="Back to chapters"
        >
          {backTo ? <ArrowLeft size={18} /> : <Menu size={18} />}
        </button>
        <Feather size={20} className="katha-proto-brand-feather" />
        <span className="katha-proto-brand-name">Katha</span>
      </div>

      <nav className="katha-proto-breadcrumb" aria-label="Chapter location">
        <span className="katha-proto-breadcrumb__story">{storyLabel}</span>
        <span className="katha-proto-breadcrumb__sep" aria-hidden>›</span>
        <span className="katha-proto-breadcrumb__season">{seasonLabel}</span>
        <span className="katha-proto-breadcrumb__sep" aria-hidden>›</span>
        <span className="katha-proto-breadcrumb__chapter">{chapterLabel}</span>
      </nav>

      <div className="katha-proto-nav-actions">
        <span className="katha-proto-save-status">
          {!saving && <Check size={14} />}
          <span className="katha-proto-save-status__text">
            {saving ? 'Saving…' : 'Saved'}
          </span>
        </span>
        <button type="button" className="katha-proto-nav-btn katha-proto-nav-btn--icon" onClick={onHistory} title="Version history">
          <Clock size={15} />
          <span className="katha-proto-nav-btn__label">History</span>
        </button>
        <button type="button" className="katha-proto-nav-btn katha-proto-nav-btn--icon" onClick={onFocus} title="Focus mode">
          <Focus size={15} />
          <span className="katha-proto-nav-btn__label">Focus</span>
        </button>
        <ThemeToggle compact />
        <button type="button" className="katha-proto-nav-btn katha-proto-nav-btn--draft" onClick={onSaveDraft}>
          Save draft
        </button>
        <button type="button" className="katha-proto-publish-btn" onClick={onPublish}>
          <Rocket size={15} />
          <span>{publishLabel}</span>
        </button>
      </div>
    </header>
  );
}