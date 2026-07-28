import { Link } from 'react-router-dom';
import { BrandMark } from '../components/studio/BrandMark';
import { STORY_TRUST_LEVELS, BASE_CREATOR_SHARE_PCT } from '../../../packages/shared/story-trust';
import {
  CREATOR_AGREEMENT_VERSION,
  DPDP_PRIVACY_VERSION,
  CREATOR_AGREEMENT_SUMMARY,
  CREATOR_AGREEMENT_SUMMARY_TE,
} from '../../../packages/shared/creatorAgreement';
import { useLocale } from '../context/LocaleContext';

const SPI_WEIGHT_KEYS = [
  'analytics.spiRetention',
  'analytics.spiCompletion',
  'analytics.spiSatisfaction',
  'analytics.spiGrowth',
  'analytics.spiConsistency',
  'analytics.spiPolicy',
] as const;

const SPI_WEIGHT_PCTS = [35, 25, 15, 10, 10, 5] as const;

/** Public legal + radical transparency page (SPI formula + royalty ladder). */
export function LegalPage() {
  const { t, locale } = useLocale();
  const te = locale === 'te';
  const agreementSummary = te ? CREATOR_AGREEMENT_SUMMARY_TE : CREATOR_AGREEMENT_SUMMARY;
  const royaltyBody = t('legal.royaltyBody').replace('{pct}', String(BASE_CREATOR_SHARE_PCT));

  return (
    <div className="cms-auth-page" style={{ minHeight: '100vh', padding: '32px 16px' }} lang={te ? 'te' : 'en'}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Link to="/login" style={{ textDecoration: 'none' }}>
          <BrandMark size="md" ornate label="Katha" />
        </Link>
        <h1 style={{ marginTop: 24 }}>{t('legal.title')}</h1>
        <p style={{ opacity: 0.8 }}>{t('legal.intro')}</p>

        <section id="grievance" style={{ marginTop: 32 }}>
          <h2>{t('legal.grievanceTitle')}</h2>
          <p>
            <strong>{t('legal.grievanceEmail')}:</strong>{' '}
            <a href="mailto:grievance@katha.in">grievance@katha.in</a>
          </p>
          <p>{t('legal.grievanceBody')}</p>
        </section>

        <section id="privacy" style={{ marginTop: 32 }}>
          <h2>
            {t('legal.privacyTitle')} — {DPDP_PRIVACY_VERSION}
          </h2>
          <p>{t('legal.privacyBody')}</p>
        </section>

        <section id="creator-agreement" style={{ marginTop: 32 }}>
          <h2>
            {t('legal.agreementTitle')} — {CREATOR_AGREEMENT_VERSION}
          </h2>
          <p>{agreementSummary}</p>
          <ul>
            <li>{t('legal.agreementIp')}</li>
            <li>{t('legal.agreementLicense')}</li>
            <li>{t('legal.agreementNoCoins')}</li>
            <li>{t('legal.agreementCounsel')}</li>
          </ul>
        </section>

        <section id="royalty" style={{ marginTop: 32 }}>
          <h2>{t('legal.royaltyTitle')}</h2>
          <p>{royaltyBody}</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
            <thead>
              <tr>
                <th align="left">{t('legal.tierCol')}</th>
                <th align="left">{t('legal.shareCol')}</th>
                <th align="left">{t('legal.purposeCol')}</th>
              </tr>
            </thead>
            <tbody>
              {STORY_TRUST_LEVELS.map((level) => (
                <tr key={level.id}>
                  <td>
                    {level.glyph} {level.label}
                  </td>
                  <td>
                    {level.monetizationEligible
                      ? `${level.revenueSharePct}%`
                      : t('legal.preMonetization')}
                  </td>
                  <td>{level.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section id="spi" style={{ marginTop: 32 }}>
          <h2>{t('legal.spiTitle')}</h2>
          <p>{t('legal.spiIntro')}</p>
          <ul>
            {SPI_WEIGHT_KEYS.map((key, i) => (
              <li key={key}>
                {t(key)} — {SPI_WEIGHT_PCTS[i]}%
              </li>
            ))}
          </ul>
          <p>{t('legal.spiBody')}</p>
        </section>

        <section id="rbi" style={{ marginTop: 32 }}>
          <h2>{t('legal.paymentsTitle')}</h2>
          <p>{t('legal.paymentsBody')}</p>
        </section>

        <p style={{ marginTop: 40 }}>
          <Link to="/login">{t('legal.backToStudio')}</Link>
        </p>
      </div>
    </div>
  );
}
