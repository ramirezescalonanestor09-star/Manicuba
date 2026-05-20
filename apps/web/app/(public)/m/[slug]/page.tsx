import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, Sparkles, Zap } from 'lucide-react';

import { API_URL } from '@/lib/api';
import { ThemeToggle } from '@/components/ThemeToggle';

interface TenantPublic {
  slug: string;
  businessName: string;
  ownerName: string;
  bio: string | null;
  defaultCurrency: 'CUP' | 'MLC' | 'USD';
  availableNowUntil: string | null;
  availableNowNote: string | null;
  services: Array<{
    id: string;
    name: string;
    description: string | null;
    durationMin: number;
    priceCUP: number | null;
    priceMLC: number | null;
    priceUSD: number | null;
    coverImage: string | null;
  }>;
  galleryItems: Array<{ id: string; storageKey: string; caption: string | null }>;
}

async function getTenant(slug: string): Promise<TenantPublic | null> {
  const res = await fetch(`${API_URL}/api/public/tenants/${slug}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export default async function PublicTenantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenant(slug);
  if (!tenant) notFound();

  const isAvailableNow =
    tenant.availableNowUntil && new Date(tenant.availableNowUntil) > new Date();

  return (
    <div>
      <header className="sticky top-0 z-30 glass">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white">
              <Sparkles size={16} />
            </span>
            <span className="font-bold">Manicuba</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-20 pt-8 md:px-6">
        {/* Hero */}
        <section className="animate-fade-up text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-primary to-accent text-3xl font-bold text-white shadow-lg">
            {tenant.businessName.slice(0, 1).toUpperCase()}
          </div>
          <h1 className="mt-5 font-display text-4xl font-bold tracking-tight md:text-5xl">
            {tenant.businessName}
          </h1>
          <p className="mt-1 text-fg-muted">por {tenant.ownerName}</p>
          {tenant.bio && (
            <p className="mx-auto mt-4 max-w-xl text-fg-soft">{tenant.bio}</p>
          )}

          {isAvailableNow && (
            <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-sm text-emerald-700 dark:text-emerald-300">
              <Zap size={14} className="animate-pulse" />
              Disponible ahora
              {tenant.availableNowNote ? <span>· {tenant.availableNowNote}</span> : null}
            </div>
          )}

          <Link
            className="btn-primary mt-7 text-base"
            href={`/m/${tenant.slug}/agendar`}
          >
            Pedir cotizacion
            <Sparkles size={16} />
          </Link>
        </section>

        {tenant.services.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-2xl font-bold tracking-tight">Servicios</h2>
            <div className="mt-4 grid gap-3">
              {tenant.services.map((s) => (
                <article key={s.id} className="card card-hover">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{s.name}</h3>
                      {s.description && (
                        <p className="mt-1 text-sm text-fg-soft">{s.description}</p>
                      )}
                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-fg-muted">
                        <Clock size={12} />
                        {s.durationMin} min
                      </p>
                    </div>
                    <div className="text-right text-sm font-medium">
                      {s.priceCUP != null && <p>{s.priceCUP.toLocaleString()} CUP</p>}
                      {s.priceMLC != null && <p className="text-fg-soft">{s.priceMLC} MLC</p>}
                      {s.priceUSD != null && <p className="text-fg-soft">{s.priceUSD} USD</p>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {tenant.galleryItems.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-2xl font-bold tracking-tight">Galeria</h2>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {tenant.galleryItems.map((g) => (
                <a
                  key={g.id}
                  href={`/files/${g.storageKey}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative overflow-hidden rounded-2xl"
                >
                  <img
                    src={`/files/${g.storageKey}`}
                    alt={g.caption ?? ''}
                    loading="lazy"
                    className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {g.caption && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
                      {g.caption}
                    </div>
                  )}
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="mt-14">
          <Link
            className="btn-primary w-full justify-center"
            href={`/m/${tenant.slug}/agendar`}
          >
            Pedir mi cotizacion ahora
          </Link>
        </section>
      </main>
    </div>
  );
}
