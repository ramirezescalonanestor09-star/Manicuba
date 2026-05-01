'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api';
import { CardSkeleton, EmptyState } from '@/components/UI';

interface Item {
  id: string;
  status: string;
  description: string;
  createdAt: string;
  client: { fullName: string; phoneE164: string };
  images: Array<{ storageKey: string }>;
  quote: { amount: number; currency: string } | null;
}

const STATUSES = ['NEW', 'REVIEWING', 'QUOTED', 'ACCEPTED', 'REJECTED', 'EXPIRED'];

export default function SolicitudesList() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    api<Item[]>(`/requests${filter ? `?status=${filter}` : ''}`)
      .then((d) => {
        if (!cancelled) setItems(d);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [filter]);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-rose-700">Solicitudes</h1>
        <select
          className="input w-auto"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">Todas</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </header>

      <div className="grid gap-3">
        {items === null && <CardSkeleton rows={4} />}
        {items && items.length === 0 && (
          <EmptyState
            title="Aun no hay solicitudes"
            description="Comparte tu enlace publico para que tus clientas pidan cotizaciones."
          />
        )}
        {items?.map((r) => (
          <Link
            key={r.id}
            href={`/solicitudes/${r.id}`}
            className="card flex gap-3 hover:shadow-md"
          >
            {r.images[0] ? (
              <img
                src={`/files/${r.images[0].storageKey}`}
                className="h-20 w-20 flex-shrink-0 rounded-xl object-cover"
                alt=""
              />
            ) : (
              <div className="h-20 w-20 flex-shrink-0 rounded-xl bg-rose-100" />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-rose-800">{r.client.fullName}</p>
                <span className="text-xs uppercase text-rose-600">{r.status}</span>
              </div>
              <p className="mt-1 text-sm text-rose-900/70 line-clamp-2">{r.description}</p>
              <p className="mt-1 text-xs text-rose-900/60">
                {new Date(r.createdAt).toLocaleString('es-CU')}
                {r.quote ? ` · ${r.quote.amount} ${r.quote.currency}` : ''}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
