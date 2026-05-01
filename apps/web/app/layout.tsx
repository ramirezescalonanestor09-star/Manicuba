import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Manicuba',
  description: 'Plataforma para manicuris cubanas: agenda, clientas y disenos personalizados.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#ec4f7a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
