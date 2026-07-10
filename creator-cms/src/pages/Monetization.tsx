import { useEffect, useState } from 'react';
import { IndianRupee } from 'lucide-react';
import { platformApi } from '../lib/platformApi';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import { BRAND } from '../lib/constants';

type MonetizationItem = { id: string; label: string; status: string };

export function Monetization() {
  const [reader, setReader] = useState<MonetizationItem[]>([]);
  const [creator, setCreator] = useState<MonetizationItem[]>([]);
  const [platform, setPlatform] = useState<MonetizationItem[]>([]);

  useEffect(() => {
    platformApi.getMonetization().then((r) => {
      setReader([...r.reader]);
      setCreator([...r.creator]);
      setPlatform([...r.platform]);
    });
  }, []);

  return (
    <div className="cms-page studio-page">
      <StudioPageHeader
        eyebrow="మొనెటైజేషన్ · Monetization"
        eyebrowIcon={IndianRupee}
        title="Creator economy revenue"
        subtitle={`Transparent monetization — ${BRAND.creatorSharePct}/${BRAND.platformSharePct} revenue share on subscriptions today. Full PRD monetization surfaces below.`}
      />

      <div className="platform-detail-grid">
        <MonetizationSection title="Readers" items={reader} />
        <MonetizationSection title="Creators" items={creator} />
        <MonetizationSection title="Platform" items={platform} />
      </div>
    </div>
  );
}

function MonetizationSection({ title, items }: { title: string; items: MonetizationItem[] }) {
  return (
    <section className="cms-panel">
      <h3 className="dashboard-panel__title">{title}</h3>
      <ul className="platform-monetization-list">
        {items.map((item) => (
          <li key={item.id} className={`platform-monetization-item platform-monetization-item--${item.status}`}>
            <span>{item.label}</span>
            <span className="platform-monetization-item__status">{item.status}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}