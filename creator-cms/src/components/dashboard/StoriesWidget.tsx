import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PenLine, Pencil } from 'lucide-react';
import type { StoryData } from '../../types/database';
import { storyStatusBadge } from '../../lib/storyStatus';
import { formatCompact, formatInr } from '../../lib/dashboardFormat';
import { GENRES } from '../../lib/constants';

type Tab = 'all' | 'published' | 'draft' | 'pending_review' | 'scheduled';
const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Drafts' },
  { id: 'pending_review', label: 'In Review' },
  { id: 'scheduled', label: 'Scheduled' },
];

function genreLabel(id: string) {
  return GENRES.find((g) => g.id === id)?.label ?? id;
}

function estimateRetention(readers: number, chapters: number) {
  return Math.min(94, Math.round(52 + Math.log10(Math.max(readers, 10)) * 8 + chapters * 0.5));
}

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
    return list.sort((a, b) => (earningsMap.get(b.id)?.readers ?? b.total_readers) - (earningsMap.get(a.id)?.readers ?? a.total_readers)).slice(0, 6);
  }, [stories, tab, earningsMap]);

  return (
    <div className="dashboard-panel dashboard-panel--stories">
      <div className="dashboard-panel__head">
        <h3 className="dashboard-panel__title">Your Stories</h3>
        <Link to="/stories" className="panel-view-all">View all stories →</Link>
      </div>
      <div className="stories-widget__tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={`stories-widget__tab${tab === t.id ? ' stories-widget__tab--active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      <div className="stories-widget__table-wrap">
        <table className="stories-widget__table">
          <thead>
            <tr>
              <th>Story</th>
              <th>Status</th>
              <th>Reads</th>
              <th>Retention</th>
              <th>Earnings</th>
              <th><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="stories-widget__empty">No stories here yet.</td></tr>
            ) : filtered.map((story) => {
              const badge = storyStatusBadge(story.moderation_status);
              const meta = earningsMap.get(story.id);
              const readers = meta?.readers ?? story.total_readers;
              const earnings = meta?.earnings ?? 0;
              return (
                <tr key={story.id}>
                  <td>
                    <Link to={`/stories/${story.id}`} className="stories-widget__title">{story.title}</Link>
                    <div className="stories-widget__genre">{genreLabel(story.genre)} · {story.chapter_count} ch</div>
                  </td>
                  <td><span className={`story-status-pill story-status-pill--${story.moderation_status || 'draft'}`}>{badge.label}</span></td>
                  <td title="Total reads">{formatCompact(readers)}</td>
                  <td title="Reader retention rate">{estimateRetention(readers, story.chapter_count)}%</td>
                  <td>{earnings > 0 ? formatInr(earnings) : '—'}</td>
                  <td>
                    <Link to={`/stories/${story.id}`} className="stories-widget__action" aria-label={`Edit ${story.title}`}><Pencil size={14} /></Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Link to="/stories/new" className="stories-widget__create"><PenLine size={16} aria-hidden /> Create New Story</Link>
    </div>
  );
}