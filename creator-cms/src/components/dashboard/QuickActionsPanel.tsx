import { Link } from 'react-router-dom';
import { useLocale } from '../../context/LocaleContext';
import { StudioGlyph } from '../studio/StudioGlyph';
import { StudioIllustration } from '../studio/StudioIllustration';

interface Props {
  layout?: 'stack' | 'bar';
}

export function QuickActionsPanel({ layout = 'stack' }: Props) {
  const { t } = useLocale();

  if (layout === 'bar') {
    return (
      <nav className="quick-actions-bar" aria-label={t('dashboard.quickActionsTitle')}>
        <Link to="/stories/new" className="quick-actions-bar__primary">
          <StudioGlyph id="pen" variant="soft" size={17} />
          {t('dashboard.quickNewStory')}
        </Link>
        <div className="quick-actions-bar__actions">
          <Link to="/schedule" className="quick-actions-bar__action">
            <StudioGlyph id="calendar" variant="soft" size={16} />
            {t('dashboard.quickSchedule')}
          </Link>
          <Link to="/events" className="quick-actions-bar__action">
            <StudioGlyph id="trophy" variant="soft" size={16} />
            {t('dashboard.quickEvents')}
          </Link>
          <Link to="/reviewers" className="quick-actions-bar__action">
            <StudioGlyph id="book" variant="soft" size={16} />
            {t('dashboard.quickReviews')}
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <div className="dashboard-panel dashboard-panel--compact quick-actions-panel dashboard-widget--glyph">
      <div className="quick-actions-panel__illustration" aria-hidden>
        <span className="dashboard-orb dashboard-orb--gold" />
        <span className="dashboard-orb dashboard-orb--maroon" />
        <StudioIllustration id="ink-well" tone="gold" size={64} />
      </div>
      <div className="quick-actions-panel__head">
        <h3 className="dashboard-panel__title">{t('dashboard.quickActionsTitle')}</h3>
      </div>
      <Link to="/stories/new" className="quick-action-btn quick-action-btn--hero">
        <span className="quick-action-btn__icon" aria-hidden>
          <StudioGlyph id="pen" variant="tile" size={20} />
        </span>
        <span className="quick-action-btn__copy">
          <span className="quick-action-btn__title">{t('dashboard.quickNewStory')}</span>
          <span className="quick-action-btn__hint">{t('dashboard.quickNewStoryHint')}</span>
        </span>
      </Link>
      <div className="quick-actions quick-actions--grid">
        <Link to="/schedule" className="quick-action-btn quick-action-btn--tile">
          <StudioGlyph id="calendar" variant="tile" size={17} />
          <span>{t('dashboard.quickSchedule')}</span>
        </Link>
        <Link to="/events" className="quick-action-btn quick-action-btn--tile">
          <StudioGlyph id="trophy" variant="tile" size={17} />
          <span>{t('dashboard.quickEvents')}</span>
        </Link>
        <Link to="/reviewers" className="quick-action-btn quick-action-btn--tile">
          <StudioGlyph id="book" variant="tile" size={17} />
          <span>{t('dashboard.quickReviews')}</span>
        </Link>
      </div>
    </div>
  );
}