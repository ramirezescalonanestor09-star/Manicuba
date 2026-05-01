'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { WeekCalendar } from '@/components/WeekCalendar';

interface Appt {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  priceFinal: number | null;
  currency: string | null;
  client: { id: string; fullName: string; phoneE164: string };
  service?: { name: string } | null;
}

function startOfWeek(d: Date): Date {
  const r = new Date(d);
  const diff = r.getDay();
  r.setHours(0, 0, 0, 0);
  r.setDate(r.getDate() - diff);
  return r;
}

export default function AgendaPage() {
  const [items, setItems] = useState<Appt[]>([]);
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));

  useEffect(() => {
    const from = new Date(weekStart);
    const to = new Date(weekStart);
    to.setDate(to.getDate() + 7);
    api<Appt[]>(`/appointments?from=${from.toISOString()}&to=${to.toISOString()}`)
      .then(setItems)
      .catch(() => {});
  }, [weekStart]);

  const list = useMemo(
    () => [...items].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    [items],
  );

  function shift(days: number) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + days);
    setWeekStart(d);
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-rose-700">Agenda</h1>
        <div className="flex items-center gap-2">
          <button className="btn-ghost text-sm" onClick={() => shift(-7)}>
            ←
          </button>
          <span className="text-sm text-rose-900/70">
            Semana del {weekStart.toLocaleDateString('es-CU')}
          </span>
          <button className="btn-ghost text-sm" onClick={() => shift(7)}>
            →
          </button>
          <button
            className="btn-primary text-sm"
            onClick={() => setWeekStart(startOfWeek(new Date()))}
          >
            Hoy
          </button>
        </div>
      </header>

      <WeekCalendar
        weekStart={weekStart}
        appointments={items}
        onSelect={(id) => (window.location.href = `/agenda/${id}`)}
      />

      <h2 className="mt-6 text-lg font-semibold text-rose-700">Lista</h2>
      <div className="grid gap-2">
        {list.length === 0 && <p className="text-rose-900/60">Sin citas en la semana.</p>}
        {list.map((a) => (
          <Link key={a.id} href={`/agenda/${a.id}`} className="card hover:shadow-md">
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
          </Link>
        ))}
      </div>
    </div>
  );
}
