'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Calendar,
  ClipboardList,
  Home,
  Image as ImageIcon,
  LogOut,
  MessageSquare,
  PiggyBank,
  Scissors,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react';

import { clearSession, loadSession, type Session } from '@/lib/auth';
import { ThemeToggle } from '@/components/ThemeToggle';

const NAV = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/solicitudes', label: 'Solicitudes', icon: ClipboardList },
  { href: '/clientas', label: 'Clientas', icon: Users },
  { href: '/agenda', label: 'Agenda', icon: Calendar },
  { href: '/caja', label: 'Caja', icon: PiggyBank },
  { href: '/servicios', label: 'Servicios', icon: Scissors },
  { href: '/portafolio', label: 'Portafolio', icon: ImageIcon },
  { href: '/plantillas', label: 'Plantillas', icon: MessageSquare },
  { href: '/ajustes', label: 'Ajustes', icon: Settings },
];

const MOBILE_NAV = NAV.filter((n) =>
  ['/dashboard', '/solicitudes', '/agenda', '/clientas', '/ajustes'].includes(n.href),
);

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
      <main className="mx-auto max-w-md px-6 py-16 text-center text-fg-muted">
        Cargando...
      </main>
    );
  }

  function logout() {
    clearSession();
    router.replace('/login');
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <div className="min-h-dvh">
      {/* Top bar */}
      <header className="sticky top-0 z-30 glass">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-md">
                <Sparkles size={18} />
              </span>
              <span className="text-lg font-bold tracking-tight">Manicuba</span>
            </Link>
            <span className="hidden text-sm text-fg-muted md:inline">
              · {session.tenant.businessName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={logout}
              className="btn-ghost text-xs"
              aria-label="Salir"
              title="Salir"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 md:px-6">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-20 hidden h-[calc(100dvh-6rem)] w-60 shrink-0 flex-col gap-1 md:flex">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={
                  'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ' +
                  (active
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'text-fg-soft hover:bg-surface-2')
                }
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 pb-24 md:pb-6">
          <div className="animate-fade-up">{children}</div>
        </main>
      </div>

      {/* Bottom nav (movil) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border glass md:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-around px-2 py-2">
          {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={
                  'flex min-w-[64px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium transition ' +
                  (active ? 'text-primary' : 'text-fg-muted hover:text-fg-soft')
                }
              >
                <Icon size={20} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
