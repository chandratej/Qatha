import { useEffect, useState } from 'react';
import { Search, Shield, Star } from 'lucide-react';
import { platformApi } from '../../lib/platformApi';
import type { ReviewerPoolMember } from '../../types/platform';
import { GENRE_SPECIALIZATIONS, PROFESSIONAL_REVIEW_ROLES } from '../../lib/platformConstants';
import { councilLevelLabel } from '../../business/literaryCouncil';
import type { CouncilCareerLevelId } from '../../../../packages/shared/literary-council';
import { formatRqi } from '../../lib/dashboardFormat';
import { useLocale } from '../../context/LocaleContext';

/** Pool browse grid — matches katha_reviewer_pool_join_v2.html */
export function ReviewerPoolBrowse() {
  const { locale } = useLocale();
  const te = locale === 'te';
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
    <section className="rpv2-browse" aria-labelledby="pool-browse-title">
      <div className="rpv2-section-head" style={{ alignItems: 'flex-start', margin: '2rem 0 1.1rem' }}>
        <div>
          <h3 id="pool-browse-title" style={{ display: 'flex', alignItems: 'center', gap: 7 }} lang={te ? 'te' : undefined}>
            <span>{te ? 'పూల్‌ను బ్రౌజ్ చేయండి' : 'Browse the pool'}</span>
          </h3>
          <p className="rpv2-section-sub" style={{ maxWidth: '55ch', color: 'var(--rpv2-text-2)', fontSize: '0.78125rem' }} lang={te ? 'te' : undefined}>
            {te
              ? 'జానర్ నైపుణ్యం మరియు రివ్యూ క్వాలిటీ ఇండెక్స్ (RQI) ద్వారా సరిపోల్చిన అనామక, ధృవీకరించబడిన సమీక్షకులు.'
              : 'Anonymous, certified reviewers matched by genre expertise and Review Quality Index (RQI).'}
          </p>
        </div>
        <Shield size={20} aria-hidden style={{ color: 'var(--rpv2-gold)', flexShrink: 0 }} />
      </div>

      <div className="rpv2-filters">
        <label className="rpv2-search">
          <Search size={14} aria-hidden />
          <input
            type="search"
            placeholder={te ? 'జానర్ లేదా పాత్ర వెతకండి…' : 'Search genre or role…'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            lang={te ? 'te' : undefined}
          />
        </label>
        <select
          className="rpv2-select"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          lang={te ? 'te' : undefined}
        >
          <option value="">{te ? 'అన్ని జానర్‌లు' : 'All genres'}</option>
          {GENRE_SPECIALIZATIONS.map((g) => (
            <option key={g.id} value={g.id}>{g.label}</option>
          ))}
        </select>
      </div>

      <ul className="rpv2-grid">
        {filtered.map((m) => {
          const role = PROFESSIONAL_REVIEW_ROLES.find((r) => r.id === m.professional_role)?.label ?? m.professional_role;
          const genres = m.genre_expertise
            .map((id) => GENRE_SPECIALIZATIONS.find((g) => g.id === id)?.label ?? id)
            .join(' · ');
          return (
            <li key={m.id} className="rpv2-r-card">
              <div className="rpv2-r-top">
                <span className="rpv2-r-anon">
                  {te ? 'సమీక్షకుడు' : 'Reviewer'} {m.pool_slot.replace('slot-', '#')}
                </span>
                <span className={`rpv2-r-avail${m.is_available ? '' : ' rpv2-r-avail--busy'}`}>
                  {m.is_available
                    ? (te ? 'అందుబాటులో' : 'Available')
                    : (te ? 'అసైన్‌మెంట్‌లో' : 'On assignment')}
                </span>
              </div>
              <p className="rpv2-r-role">{role}</p>
              <p className="rpv2-r-genres">{genres}</p>
              <div className="rpv2-r-metrics">
                <span><Star size={12} aria-hidden /> RQI {formatRqi(m.rqi)}</span>
                <span>{m.review_experience_count} {te ? 'సమీక్షలు' : 'reviews'}</span>
                <span>{m.response_time_hours}{te ? 'గం' : 'h'} {te ? 'సగటు' : 'avg'}</span>
              </div>
              <p className="rpv2-r-level">
                {councilLevelLabel(m.council_level as CouncilCareerLevelId)}
                {' · '}{m.reputation_tier}
              </p>
            </li>
          );
        })}
      </ul>

      <p className="rpv2-pool-note" lang={te ? 'te' : undefined}>
        {te
          ? 'డబుల్-బ్లైండ్ సమీక్షలో సమీక్షకుల గుర్తింపు రహస్యం. రచయితలు అభ్యర్థిస్తారు; ఇంజిన్ స్వయంచాలకంగా సరిపోలుస్తుంది.'
          : 'Reviewer identities stay hidden during double-blind review. Authors request reviews; matching is automatic.'}
      </p>
    </section>
  );
}
