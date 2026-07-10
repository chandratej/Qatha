import { useEffect, useState } from 'react';
import { Hash, Plus } from 'lucide-react';
import { platformApi } from '../lib/platformApi';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import { searchTags, slugifyTag } from '../business/tagWorkflow';
import type { TagRecord, TagRequest } from '../types/platform';
import { TAG_WORKFLOW } from '../lib/platformConstants';

export function TagsModeration() {
  const [tags, setTags] = useState<TagRecord[]>([]);
  const [requests, setRequests] = useState<TagRequest[]>([]);
  const [search, setSearch] = useState('');
  const [newTag, setNewTag] = useState('');

  const reload = () => {
    platformApi.getTags().then((r) => setTags(r.tags));
    platformApi.getTagRequests().then((r) => setRequests(r.requests));
  };

  useEffect(() => { reload(); }, []);

  const filtered = searchTags(tags, search);

  const handleRequest = async () => {
    if (!newTag.trim()) return;
    await platformApi.requestTag(newTag.trim());
    setNewTag('');
    reload();
  };

  return (
    <div className="cms-page studio-page">
      <StudioPageHeader
        eyebrow="ట్యాగ్లు · Community tags"
        eyebrowIcon={Hash}
        title="Tag system"
        subtitle="Search existing → use existing. Or request new → moderator review → approve / merge / reject."
      />

      <div className="cms-toolbar">
        <label className="cms-search-field">
          <input
            type="search"
            className="cms-input cms-search-field__input"
            placeholder="Search tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <input
          className="cms-input"
          placeholder="Request new tag…"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
        />
        <button type="button" className="katha-cta katha-cta--soft" onClick={handleRequest}>
          <Plus size={16} aria-hidden /> Request
        </button>
      </div>

      <p className="input-hint cms-mb-4">
        Workflow: {TAG_WORKFLOW.steps.join(' → ')}
        {newTag.trim() && <> · Preview slug: <code>{slugifyTag(newTag)}</code></>}
      </p>

      <div className="platform-detail-grid">
        <section className="cms-panel">
          <h3 className="dashboard-panel__title">Official &amp; community tags ({filtered.length})</h3>
          <ul className="platform-tag-cloud">
            {filtered.map((t) => (
              <li key={t.id} className={`platform-tag${t.tag_kind === 'mood' ? ' platform-tag--mood' : ''}`}>
                #{t.slug} <span>{t.usage_count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="cms-panel">
          <h3 className="dashboard-panel__title">Pending requests</h3>
          {requests.length === 0 ? (
            <p className="input-hint">No pending tag requests.</p>
          ) : (
            <ul className="platform-review-list">
              {requests.map((r) => (
                <li key={r.id}>
                  <strong>{r.proposed_label}</strong>
                  <span>#{r.proposed_slug} · {r.status}</span>
                  {r.status === 'pending' && (
                    <div className="platform-wizard-actions">
                      <button type="button" className="btn btn-secondary">Approve</button>
                      <button type="button" className="btn btn-secondary">Merge</button>
                      <button type="button" className="btn btn-danger">Reject</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}