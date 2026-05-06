import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Outfit } from 'next/font/google';
import './globals.css';
import { RegisterSW } from '@/components/RegisterSW';
import { ToastProvider } from '@/components/Toast';
import { ThemeProvider } from '@/components/ThemeProvider';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const display = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Manicuba — La plataforma de las manicuris cubanas',
  description:
    'Recibe solicitudes de tus clientas con fotos de inspiracion, cotiza y agenda en minutos. CUP, MLC y USD.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#ec4f7a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <ToastProvider>
            <RegisterSW />
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
