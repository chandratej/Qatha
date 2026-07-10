import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, PenLine } from 'lucide-react';
import type { StoryData } from '../../types/database';
import { ManuscriptCard } from '../studio/ManuscriptCard';

type Tab = 'all' | 'published' | 'draft' | 'pending_review' | 'scheduled';
const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Drafts' },
  { id: 'pending_review', label: 'In Review' },
  { id: 'scheduled', label: 'Scheduled' },
];

interface StoriesWidgetProps {
  stories: StoryData[];
  earningsMap: Map<string, { earnings: number; readers: number }>;
}

export function StoriesWidget({ stories, earningsMap }: StoriesWidgetProps) {
  const [tab, setTab] = useState<Tab>('all');

  const filtered = useMemo(() => {
    let list = [...stories];
    if (tab === 'scheduled') list = list.filter((s) => Boolean(s.release_schedule));
    else if (tab !== 'all') list = list.filter((s) => (s.moderation_status || 'draft') === tab);
    return list
      .sort((a, b) => (earningsMap.get(b.id)?.readers ?? b.total_readers) - (earningsMap.get(a.id)?.readers ?? a.total_readers))
      .slice(0, 4);
  }, [stories, tab, earningsMap]);

  return (
    <div className="dashboard-panel">
      <div className="dashboard-panel__head">
        <h3 className="dashboard-panel__title">On your desk</h3>
        <Link to="/stories" className="panel-view-all">View library →</Link>
      </div>
      <div className="stories-widget__tabs" role="tablist" aria-label="Filter manuscripts">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`stories-tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls="stories-widget-panel"
            className={`stories-widget__tab${tab === t.id ? ' stories-widget__tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        id="stories-widget-panel"
        className="stories-manuscript-list"
        role="tabpanel"
        aria-labelledby={`stories-tab-${tab}`}
      >
        {filtered.length === 0 ? (
          <div className="stories-manuscript-empty">
            <BookOpen size={32} className="stories-manuscript-empty__icon" aria-hidden />
            <h4 className="stories-manuscript-empty__title">Your shelf is waiting</h4>
            <p className="stories-manuscript-empty__text">
              The first manuscript is the hardest — and the most proud. Begin a story Telugu readers will carry with them.
            </p>
            <Link to="/stories/new" className="katha-cta katha-cta--maroon stories-manuscript-empty__cta">
              <PenLine size={16} aria-hidden />
              Begin writing
            </Link>
          </div>
        ) : (
          filtered.map((story) => (
            <ManuscriptCard
              key={story.id}
              story={story}
              variant="shelf"
              earnings={earningsMap.get(story.id)?.earnings}
            />
          ))
        )}
      </div>
      <Link to="/stories/new" className="stories-widget__create">
        <PenLine size={16} aria-hidden />
        New manuscript
      </Link>
    </div>
  );
}