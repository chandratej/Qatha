import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, BookOpen, PenLine, Save, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { BRAND } from '../lib/constants';
import { getAuthorLevelBadge, getNextAuthorLevelBadge } from '../lib/creatorBadge';
import { effectiveCreatorSharePct, trustLevelForReaders, PRD_GENRES } from '../lib/platformConstants';
import { loadCreatorProfile, saveCreatorProfile } from '../lib/profilePrefs';
import { formatCompact } from '../lib/dashboardFormat';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import { StoryTrustBadge } from '../components/studio/StoryTrustBadge';
import type { StoryTrustLevelId } from '../lib/platformConstants';
import { useLocale } from '../context/LocaleContext';
import { TeluguTextField } from '../components/TeluguTextField';

const PROFILE_GENRES = PRD_GENRES.filter((g) => !('mapsTo' in g && g.mapsTo));

export function Profile() {
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const { data: dash } = useApi(() => api.getDashboard().catch(() => null));
  const { data: repData } = useApi(() => api.getCreatorReputation().catch(() => null));
  const [profile, setProfile] = useState(() => loadCreatorProfile(user?.display_name || 'Creator'));
  const [saved, setSaved] = useState(false);
  const te = locale === 'te';

  const totalReads = dash?.stories?.reduce((s, x) => s + x.total_readers, 0) ?? 0;
  const publishedStories = dash?.stories?.length ?? 0;
  const badge = getAuthorLevelBadge({ publishedStories, totalReaders: totalReads });
  const next = getNextAuthorLevelBadge(badge.id);
  const storyTrust = trustLevelForReaders(totalReads);
  const sharePct = effectiveCreatorSharePct(storyTrust) || BRAND.creatorSharePct;
  const nextTarget = next?.id === 'featured_author' ? 1_000
    : next?.id === 'katha_creator' ? 10_000
    : next?.id === 'katha_fellow' ? 50_000
    : next?.id === 'katha_laureate' ? 200_000
    : 1;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveCreatorProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleGenre = (id: string) => {
    setProfile((p) => ({
      ...p,
      genres: p.genres.includes(id)
        ? p.genres.filter((g) => g !== id)
        : p.genres.length >= 6
          ? p.genres
          : [...p.genres, id],
    }));
  };

  return (
    <div className="cms-page studio-page profile-studio--premium wc-page-enter">
      <StudioPageHeader
        variant="hero"
        eyebrow={t('profile.eyebrow')}
        eyebrowIcon={User}
        title={t('profile.title')}
        subtitle={t('profile.subtitle')}
      />

      <div className="profile-layout wc-stagger-children">
        <aside className="profile-card profile-card--studio cms-panel">
          <div className="profile-card__avatar" aria-hidden>{profile.penName.slice(0, 2).toUpperCase()}</div>
          <h2 className="profile-card__name">{profile.penName}</h2>
          <p className="profile-card__tagline">{profile.tagline || t('profile.defaultTagline')}</p>
          <div className="profile-card__badge">
            <Award size={16} aria-hidden />
            {badge.label}
          </div>
          <div className="profile-card__stats">
            <div><strong>{formatCompact(totalReads)}</strong><span>{t('profile.totalReads')}</span></div>
            <div><strong>{sharePct}%+</strong><span>{t('profile.storyTrust')}</span></div>
            <div><strong>{dash?.stories?.length ?? 0}</strong><span>{t('profile.stories')}</span></div>
          </div>
          {next && (
            <p className="profile-card__next">{t('profile.nextLevel')}: <strong>{next.label}</strong>{nextTarget > 1 ? ` at ${formatCompact(nextTarget)} readers` : ''}</p>
          )}
          {repData?.reputation && (
            <div className="profile-reputation-summary">
              <p className="profile-reputation-summary__label">{t('profile.trustReadOnly')}</p>
              <StoryTrustBadge level={repData.reputation.top_trust_level as StoryTrustLevelId} showShare />
              {repData.reputation.top_story_spi != null && (
                <p className="input-hint">SPI {Number(repData.reputation.top_story_spi).toFixed(1)} · {t('profile.spiHint')}</p>
              )}
              <Link to="/monetization" className="katha-cta katha-cta--soft">{t('profile.viewTrustLadder')}</Link>
            </div>
          )}
        </aside>

        <form className="cms-panel profile-form" onSubmit={handleSave}>
          <h3 className="cms-panel__title"><User size={18} aria-hidden /> {t('profile.publicDetails')}</h3>
          <div className="profile-form__grid">
            <label className="input-group">
              <span>{t('profile.penName')}</span>
              <TeluguTextField
                className="cms-input katha-telugu-field"
                value={profile.penName}
                onChange={(penName) => setProfile({ ...profile, penName })}
                required
                phonetic={te}
                lang={te ? 'te' : 'en'}
              />
            </label>
            <label className="input-group">
              <span>{t('profile.tagline')}</span>
              <TeluguTextField
                className="cms-input katha-telugu-field"
                value={profile.tagline}
                onChange={(tagline) => setProfile({ ...profile, tagline })}
                placeholder={te ? 'ఉదా: ప్రేమ & కుటుంబ కథలు' : 'e.g. Fantasy & romance serialist'}
                phonetic={te}
                lang={te ? 'te' : 'en'}
              />
            </label>
            <label className="input-group profile-form__full">
              <span>{t('profile.bio')}</span>
              <TeluguTextField
                multiline
                className="cms-input cms-textarea katha-telugu-field"
                rows={4}
                value={profile.bio}
                onChange={(bio) => setProfile({ ...profile, bio })}
                placeholder={te ? 'పాఠకులకు మీ కథలు ప్రత్యేకం ఎందుకో చెప్పండి…' : 'Tell readers what makes your stories special…'}
                phonetic={te}
                lang={te ? 'te' : 'en'}
              />
            </label>
            <label className="input-group">
              <span>{t('profile.website')}</span>
              <input className="cms-input" type="url" value={profile.website} onChange={(e) => setProfile({ ...profile, website: e.target.value })} placeholder="https://" lang="en" inputMode="url" />
            </label>
            <label className="input-group">
              <span>{t('profile.socialHandle')}</span>
              <input className="cms-input" value={profile.twitter} onChange={(e) => setProfile({ ...profile, twitter: e.target.value })} placeholder="@yourhandle" lang="en" />
            </label>
          </div>

          <h3 className="cms-panel__title" style={{ marginTop: 24 }}>
            <BookOpen size={18} aria-hidden /> {te ? 'మీరు రాసే జానర్లు (6 వరకు)' : 'Genres you write (up to 6)'}
          </h3>
          <div className="profile-genres">
            {PROFILE_GENRES.map((g) => (
              <button
                key={g.id}
                type="button"
                className={`profile-genre-chip${profile.genres.includes(g.id) ? ' profile-genre-chip--active' : ''}`}
                onClick={() => toggleGenre(g.id)}
                lang={te ? 'te' : 'en'}
              >
                {te ? g.labelTelugu : g.label}
              </button>
            ))}
          </div>

          <div className="profile-form__actions">
            <button type="submit" className="katha-cta katha-cta--soft" style={{ border: 'none' }}>
              <Save size={16} aria-hidden /> {saved ? t('profile.saved') : t('profile.save')}
            </button>
            <Link to="/stories/new" className="btn btn-secondary"><PenLine size={16} /> {t('profile.writeNew')}</Link>
          </div>
        </form>
      </div>
    </div>
  );
}