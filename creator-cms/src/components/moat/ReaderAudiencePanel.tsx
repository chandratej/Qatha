import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';

/**
 * Katha-native reader relationship surface (network moat).
 * Shows readers who follow this creator for updates — not portable WhatsApp lists.
 */
export function ReaderAudiencePanel() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const te = locale === 'te';
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    api
      .getAuthorFollowers(user.id)
      .then((res) => {
        if (!cancelled) setCount(res.count ?? 0);
      })
      .catch((e) => {
        if (!cancelled) {
          setCount(0);
          setError(e instanceof Error ? e.message : null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <section className="moat-readers" aria-label={te ? 'మీ పాఠకులు' : 'Your readers'}>
      <header>
        <Users size={18} aria-hidden />
        <h3>{te ? 'కథ పాఠకుల సంబంధం' : 'Katha reader relationship'}</h3>
      </header>
      <p className="moat-readers__count">
        <strong>{count == null ? '…' : count}</strong>{' '}
        {te
          ? 'మంది పాఠకులు మీ అప్‌డేట్ల కోసం ఫాలో అవుతున్నారు'
          : 'readers follow you for chapter updates'}
      </p>
      <p className="input-hint">
        {te
          ? 'ఇది కథ నెట్‌వర్క్ — వేరే యాప్‌కు తీసుకెళ్లలేరు. ప్రతి కొత్త పాఠకుడు మీ స్విచింగ్ ఖర్చును పెంచుతాడు.'
          : 'This is a Katha-native network — it does not move with a blank doc. Every new reader raises the cost of leaving.'}
      </p>
      {error && (
        <p className="input-hint" role="status">
          {te
            ? 'లైవ్ ఫాలో కౌంట్ సిద్ధం కాగానే ఇక్కడ కనిపిస్తుంది.'
            : 'Live follow counts appear here when the follow API is available.'}
        </p>
      )}
    </section>
  );
}
