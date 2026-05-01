'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { api, SITE_URL } from '@/lib/api';
import { loadSession } from '@/lib/auth';

interface Stats {
  pendingRequests: number;
  upcomingAppointments: number;
  totalClients: number;
}

interface Request {
  id: string;
  status: string;
  description: string;
  createdAt: string;
  client: { fullName: string; phoneE164: string };
}

interface Appt {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  client: { fullName: string };
  service?: { name: string } | null;
}

export default function DashboardHome() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [appts, setAppts] = useState<Appt[]>([]);
  const session = typeof window !== 'undefined' ? loadSession() : null;

  useEffect(() => {
    (async () => {
      const [reqs, all, clients, upcoming] = await Promise.all([
        api<Request[]>('/requests?status=NEW'),
        api<Request[]>('/requests'),
        api<unknown[]>('/clients'),
        api<Appt[]>(
          `/appointments?from=${new Date().toISOString()}&to=${new Date(
            Date.now() + 7 * 24 * 3600_000,
          ).toISOString()}`,
        ),
      ]);
      setRequests(all.slice(0, 5));
      setAppts(upcoming.slice(0, 5));
      setStats({
        pendingRequests: reqs.length,
        upcomingAppointments: upcoming.length,
        totalClients: clients.length,
      });
    })().catch(() => {});
  }, []);

  const publicLink = session ? `${SITE_URL}/m/${session.tenant.slug}/agendar` : '';

  return (
    <div className="space-y-6">
      <section className="card">
        <h2 className="text-lg font-semibold text-rose-700">Tu enlace publico</h2>
        <p className="mt-1 text-sm text-rose-900/70">
          Comparte este enlace para que tus clientas pidan cotizaciones.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code className="flex-1 break-all rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {publicLink}
          </code>
          <button
            type="button"
            className="btn-ghost text-sm"
            onClick={() => navigator.clipboard.writeText(publicLink)}
          >
            Copiar
          </button>
          <a className="btn-ghost text-sm" href={publicLink} target="_blank" rel="noreferrer">
            Abrir
          </a>
        </div>
      </section>

      {stats && (
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="card">
            <p className="text-xs uppercase text-rose-600">Solicitudes nuevas</p>
            <p className="mt-1 text-3xl font-bold text-rose-700">{stats.pendingRequests}</p>
          </div>
          <div className="card">
            <p className="text-xs uppercase text-rose-600">Citas (7 dias)</p>
            <p className="mt-1 text-3xl font-bold text-rose-700">{stats.upcomingAppointments}</p>
          </div>
          <div className="card">
            <p className="text-xs uppercase text-rose-600">Clientas</p>
            <p className="mt-1 text-3xl font-bold text-rose-700">{stats.totalClients}</p>
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-rose-700">Ultimas solicitudes</h2>
          <Link href="/solicitudes" className="text-sm text-rose-600">
            Ver todas →
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          {requests.length === 0 && (
            <p className="text-sm text-rose-900/60">Aun no hay solicitudes.</p>
          )}
          {requests.map((r) => (
            <Link
              key={r.id}
              href={`/solicitudes/${r.id}`}
              className="card flex items-center justify-between hover:shadow-md"
            >
              <div>
                <p className="font-semibold text-rose-800">{r.client.fullName}</p>
                <p className="text-sm text-rose-900/70 line-clamp-1">{r.description}</p>
              </div>
              <span className="text-xs uppercase text-rose-600">{r.status}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-rose-700">Proximas citas</h2>
        <div className="mt-3 space-y-2">
          {appts.length === 0 && (
            <p className="text-sm text-rose-900/60">Sin citas en los proximos 7 dias.</p>
          )}
          {appts.map((a) => (
            <div key={a.id} className="card flex items-center justify-between">
              <div>
                <p className="font-semibold text-rose-800">{a.client.fullName}</p>
                <p className="text-sm text-rose-900/70">
                  {new Date(a.startAt).toLocaleString('es-CU')}
                  {a.service ? ` · ${a.service.name}` : ''}
                </p>
              </div>
              <span className="text-xs uppercase text-rose-600">{a.status}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
