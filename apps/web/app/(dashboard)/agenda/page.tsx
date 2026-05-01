'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Appt {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  priceFinal: number | null;
  currency: string | null;
  notes: string | null;
  client: { fullName: string; phoneE164: string };
  service?: { name: string } | null;
}

export default function AgendaPage() {
  const [items, setItems] = useState<Appt[]>([]);

  useEffect(() => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 30);
    api<Appt[]>(`/appointments?from=${from.toISOString()}&to=${to.toISOString()}`)
      .then(setItems)
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-rose-700">Agenda (30 dias)</h1>
      <div className="grid gap-2">
        {items.length === 0 && <p className="text-rose-900/60">Sin citas en los proximos 30 dias.</p>}
        {items.map((a) => (
          <div key={a.id} className="card">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-rose-800">{a.client.fullName}</p>
              <span className="text-xs uppercase text-rose-600">{a.status}</span>
            </div>
            <p className="text-sm text-rose-900/70">
              {new Date(a.startAt).toLocaleString('es-CU')} —{' '}
              {new Date(a.endAt).toLocaleTimeString('es-CU', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              {a.service ? ` · ${a.service.name}` : ''}
            </p>
            {a.priceFinal != null && (
              <p className="mt-1 text-sm text-rose-700">
                {a.priceFinal} {a.currency}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
