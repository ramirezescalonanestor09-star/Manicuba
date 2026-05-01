import Link from 'next/link';
import { notFound } from 'next/navigation';

import { API_URL } from '@/lib/api';

interface TenantPublic {
  slug: string;
  businessName: string;
  ownerName: string;
  bio: string | null;
  defaultCurrency: 'CUP' | 'MLC' | 'USD';
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

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="text-center">
        <h1 className="text-4xl font-bold text-rose-700">{tenant.businessName}</h1>
        <p className="mt-2 text-rose-900/80">por {tenant.ownerName}</p>
        {tenant.bio && <p className="mt-4 text-rose-900/70">{tenant.bio}</p>}
        <Link
          className="btn-primary mt-6 inline-flex"
          href={`/m/${tenant.slug}/agendar`}
        >
          Pedir cotizacion
        </Link>
      </header>

      {tenant.services.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-rose-700">Servicios</h2>
          <div className="mt-4 grid gap-3">
            {tenant.services.map((s) => (
              <div key={s.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-rose-800">{s.name}</h3>
                    {s.description && (
                      <p className="mt-1 text-sm text-rose-900/70">{s.description}</p>
                    )}
                    <p className="mt-2 text-xs text-rose-900/60">{s.durationMin} min</p>
                  </div>
                  <div className="text-right text-sm">
                    {s.priceCUP != null && <p>{s.priceCUP} CUP</p>}
                    {s.priceMLC != null && <p>{s.priceMLC} MLC</p>}
                    {s.priceUSD != null && <p>{s.priceUSD} USD</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tenant.galleryItems.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-rose-700">Galeria</h2>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {tenant.galleryItems.map((g) => (
              <img
                key={g.id}
                src={`/files/${g.storageKey}`}
                alt={g.caption ?? ''}
                className="aspect-square w-full rounded-xl object-cover"
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
