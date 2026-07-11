import { useEffect, useState } from 'react';
import { Search, Shield, Star } from 'lucide-react';
import { platformApi } from '../../lib/platformApi';
import type { ReviewerPoolMember } from '../../types/platform';
import { GENRE_SPECIALIZATIONS, PROFESSIONAL_REVIEW_ROLES } from '../../lib/platformConstants';
import { councilLevelLabel } from '../../business/literaryCouncil';
import type { CouncilCareerLevelId } from '../../../../packages/shared/literary-council';

export function ReviewerPoolBrowse() {
  const [pool, setPool] = useState<ReviewerPoolMember[]>([]);
  const [genre, setGenre] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    platformApi.getReviewerPool().then((r) => setPool(r.pool));
  }, []);

  const filtered = pool.filter((m) => {
    if (genre && !m.genre_expertise.includes(genre)) return false;
    if (query) {
      const q = query.toLowerCase();
      const role = PROFESSIONAL_REVIEW_ROLES.find((r) => r.id === m.professional_role)?.label ?? m.professional_role;
      if (!role.toLowerCase().includes(q) && !m.genre_expertise.some((g) => g.includes(q))) return false;
    }
    return true;
  });

  return (
    <section className="reviewer-pool-browse" aria-labelledby="pool-browse-title">
      <header className="reviewer-pool-browse__head">
        <div>
          <h3 id="pool-browse-title" className="reviewer-pool-browse__title">Browse the pool</h3>
          <p className="reviewer-pool-browse__subtitle">
            Anonymous, certified reviewers matched by genre expertise and Review Quality Index (RQI).
          </p>
        </div>
        <Shield size={18} aria-hidden className="reviewer-pool-browse__shield" />
      </header>

      <div className="reviewer-pool-browse__filters">
        <label className="reviewer-pool-browse__search">
          <Search size={14} aria-hidden />
          <input
            type="search"
            placeholder="Search genre or role…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select className="cms-select" value={genre} onChange={(e) => setGenre(e.target.value)}>
          <option value="">All genres</option>
          {GENRE_SPECIALIZATIONS.map((g) => (
            <option key={g.id} value={g.id}>{g.label}</option>
          ))}
        </select>
      </div>

      <ul className="reviewer-pool-browse__grid">
        {filtered.map((m) => {
          const role = PROFESSIONAL_REVIEW_ROLES.find((r) => r.id === m.professional_role)?.label ?? m.professional_role;
          const genres = m.genre_expertise
            .map((id) => GENRE_SPECIALIZATIONS.find((g) => g.id === id)?.label ?? id)
            .join(' · ');
          return (
            <li key={m.id} className="reviewer-pool-browse__card">
              <div className="reviewer-pool-browse__card-top">
                <span className="reviewer-pool-browse__anon">Reviewer {m.pool_slot.replace('slot-', '#')}</span>
                <span className={`reviewer-pool-browse__avail${m.is_available ? '' : ' reviewer-pool-browse__avail--busy'}`}>
                  {m.is_available ? 'Available' : 'On assignment'}
                </span>
              </div>
              <p className="reviewer-pool-browse__role">{role}</p>
              <p className="reviewer-pool-browse__genres">{genres}</p>
              <div className="reviewer-pool-browse__metrics">
                <span><Star size={12} aria-hidden /> RQI {m.rqi}</span>
                <span>{m.review_experience_count} reviews</span>
                <span>{m.response_time_hours}h avg response</span>
              </div>
              <p className="reviewer-pool-browse__level">
                {councilLevelLabel(m.council_level as CouncilCareerLevelId)}
                {' · '}{m.reputation_tier}
              </p>
            </li>
          );
        })}
      </ul>

      <p className="input-hint reviewer-pool-browse__note">
        Reviewer identities stay hidden during double-blind review. Authors request reviews; the assignment engine matches automatically.
      </p>
    </section>
  );
}