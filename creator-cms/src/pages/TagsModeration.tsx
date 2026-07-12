import { useEffect, useState } from 'react';
import { Hash, Plus } from 'lucide-react';
import { platformApi } from '../lib/platformApi';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import { searchTags, slugifyTag } from '../business/tagWorkflow';
import type { TagRecord, TagRequest } from '../types/platform';
import { TAG_WORKFLOW } from '../lib/platformConstants';
import { useLocale } from '../context/LocaleContext';

export function TagsModeration() {
  const { t } = useLocale();
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
    <div className="cms-page studio-page tags-studio--premium wc-page-enter">
      <StudioPageHeader
        variant="hero"
        eyebrow={t('tags.eyebrow')}
        eyebrowIcon={Hash}
        title={t('tags.title')}
        subtitle={t('tags.subtitle')}
      />

      <div className="cms-toolbar cms-toolbar--premium">
        <label className="cms-search-field">
          <input
            type="search"
            className="cms-input cms-search-field__input"
            placeholder={t('tags.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <input
          className="cms-input"
          placeholder={t('tags.requestPlaceholder')}
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
        />
        <button type="button" className="katha-cta katha-cta--soft" onClick={handleRequest}>
          <Plus size={16} aria-hidden /> {t('tags.request')}
        </button>
      </div>

      <p className="input-hint cms-mb-4">
        {t('tags.workflow')}: {TAG_WORKFLOW.steps.join(' → ')}
        {newTag.trim() && (
          <> · {t('tags.previewSlug')}: <code>{slugifyTag(newTag)}</code></>
        )}
      </p>

      <div className="platform-detail-grid wc-stagger-children">
        <section className="cms-panel">
          <h3 className="dashboard-panel__title">{t('tags.officialTags')} ({filtered.length})</h3>
          <ul className="platform-tag-cloud">
            {filtered.map((tag) => (
              <li key={tag.id} className={`platform-tag${tag.tag_kind === 'mood' ? ' platform-tag--mood' : ''}`}>
                #{tag.slug} <span>{tag.usage_count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="cms-panel">
          <h3 className="dashboard-panel__title">{t('tags.pendingRequests')}</h3>
          {requests.length === 0 ? (
            <p className="input-hint">{t('tags.noPending')}</p>
          ) : (
            <ul className="platform-review-list">
              {requests.map((r) => (
                <li key={r.id}>
                  <strong>{r.proposed_label}</strong>
                  <span>#{r.proposed_slug} · {r.status}</span>
                  {r.status === 'pending' && (
                    <div className="platform-wizard-actions">
                      <button type="button" className="btn btn-secondary">{t('tags.approve')}</button>
                      <button type="button" className="btn btn-secondary">{t('tags.merge')}</button>
                      <button type="button" className="btn btn-danger">{t('tags.reject')}</button>
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