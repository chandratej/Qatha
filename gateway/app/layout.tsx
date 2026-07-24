import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Katha — Read free samples of Telugu stories',
  description:
    'Katha — Telugu fiction without ads or coins. Free sample chapters, then ₹99/month unlimited. Writers earn 40%→60% with Story Trust.',
  openGraph: {
    title: 'Katha — Stories that stay with you',
    description: 'Telugu fiction. No ads. No coins. Free samples, one subscription.',
    siteName: 'Katha',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Katha — Telugu stories',
    description: 'No ads. No coins. Stories that stay with you.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="te" data-katha-mode="reading">
      <body>{children}</body>
    </html>
  );
}