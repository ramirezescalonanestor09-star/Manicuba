'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { clearSession, loadSession, type Session } from '@/lib/auth';

const NAV = [
  { href: '/dashboard', label: 'Inicio' },
  { href: '/solicitudes', label: 'Solicitudes' },
  { href: '/clientas', label: 'Clientas' },
  { href: '/agenda', label: 'Agenda' },
  { href: '/caja', label: 'Caja' },
  { href: '/servicios', label: 'Servicios' },
  { href: '/portafolio', label: 'Portafolio' },
  { href: '/plantillas', label: 'Plantillas' },
  { href: '/ajustes', label: 'Ajustes' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = loadSession();
    if (!s) {
      router.replace('/login');
      return;
    }
    setSession(s);
    setReady(true);
  }, [router]);

  if (!ready || !session) {
    return (
      <main className="mx-auto max-w-md px-6 py-16 text-center text-rose-700">Cargando...</main>
    );
  }

  function logout() {
    clearSession();
    router.replace('/login');
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-rose-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="text-xl font-bold text-rose-700">
            Manicuba
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-rose-900/70 sm:inline">{session.tenant.businessName}</span>
            <button onClick={logout} className="btn-ghost text-xs">Salir</button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 text-sm">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  'rounded-full px-3 py-1 ' +
                  (active
                    ? 'bg-rose-500 text-white'
                    : 'text-rose-700 hover:bg-rose-100')
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
