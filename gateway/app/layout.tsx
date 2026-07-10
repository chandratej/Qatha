import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Katha — Read',
  description: 'Mythological socio-fantasy stories',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="te" data-katha-mode="reading">
      <body>{children}</body>
    </html>
  );
}