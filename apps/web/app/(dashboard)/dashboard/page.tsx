'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CalendarCheck,
  Copy,
  ExternalLink,
  Inbox,
  Users,
  Zap,
  ZapOff,
} from 'lucide-react';

import { api, SITE_URL } from '@/lib/api';
import { loadSession } from '@/lib/auth';
import { useToast } from '@/components/Toast';

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

function AvailableNowCard() {
  const [until, setUntil] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [active, setActive] = useState(false);
  const toast = useToast();

  useEffect(() => {
    api<{ availableNowUntil: string | null; availableNowNote: string | null }>('/tenant')
      .then((t) => {
        if (t.availableNowUntil && new Date(t.availableNowUntil) > new Date()) {
          setActive(true);
          setUntil(t.availableNowUntil);
          setNote(t.availableNowNote ?? '');
        }
      })
      .catch(() => {});
  }, []);

  async function activate(hours: number) {
    const u = new Date(Date.now() + hours * 3600_000).toISOString();
    await api('/tenant/available-now', { method: 'POST', json: { until: u, note } });
    setActive(true);
    setUntil(u);
    toast.success('Disponibilidad activada');
  }
  async function deactivate() {
    await api('/tenant/available-now', { method: 'POST', json: { until: null, note: '' } });
    setActive(false);
    setUntil(null);
    toast.success('Disponibilidad apagada');
  }

  return (
    <section className="card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            {active ? (
              <Zap size={16} className="text-emerald-500" />
            ) : (
              <ZapOff size={16} className="text-fg-muted" />
            )}
            Disponible ahora
          </h2>
          <p className="mt-1 text-sm text-fg-soft">
            Activalo cuando tengas hueco hoy. Aparecera en tu pagina publica.
          </p>
        </div>
      </div>
      {active && until ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          <span>Activo hasta {new Date(until).toLocaleString('es-CU')}</span>
          <button onClick={deactivate} className="btn-ghost text-xs">
            Desactivar
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <input
            className="input"
            placeholder="Nota corta (opcional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button onClick={() => activate(2)} className="btn-primary text-sm">
              2 horas
            </button>
            <button onClick={() => activate(4)} className="btn-ghost text-sm">
              4 horas
            </button>
            <button onClick={() => activate(8)} className="btn-ghost text-sm">
              Hasta el final del dia
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default function DashboardHome() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [appts, setAppts] = useState<Appt[]>([]);
  const session = typeof window !== 'undefined' ? loadSession() : null;
  const toast = useToast();

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
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Hola, {session?.user.name.split(' ')[0]}
        </h1>
        <p className="mt-1 text-fg-soft">Esto es lo que pasa hoy en tu salon.</p>
      </div>

      <section className="card overflow-hidden p-0">
        <div className="bg-gradient-to-br from-primary-soft to-accent-soft p-5">
          <p className="text-xs uppercase tracking-wide text-fg-muted">Tu enlace publico</p>
          <p className="mt-1 font-display text-xl font-bold">Comparte y deja que las clientas pidan</p>
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-xl bg-surface-2 px-3 py-2 text-sm text-primary">
              {publicLink}
            </code>
            <button
              type="button"
              className="btn-ghost text-sm"
              onClick={() => {
                navigator.clipboard.writeText(publicLink);
                toast.success('Copiado');
              }}
            >
              <Copy size={14} /> Copiar
            </button>
            <a
              className="btn-ghost text-sm"
              href={publicLink}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={14} /> Abrir
            </a>
          </div>
        </div>
      </section>

      <AvailableNowCard />

      {stats && (
        <section className="grid gap-3 sm:grid-cols-3">
          <StatCard
            icon={<Inbox size={18} />}
            label="Solicitudes nuevas"
            value={stats.pendingRequests}
            tone="primary"
          />
          <StatCard
            icon={<CalendarCheck size={18} />}
            label="Citas (7 dias)"
            value={stats.upcomingAppointments}
            tone="accent"
          />
          <StatCard
            icon={<Users size={18} />}
            label="Clientas"
            value={stats.totalClients}
            tone="primary"
          />
        </section>
      )}

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Ultimas solicitudes</h2>
          <Link href="/solicitudes" className="text-sm text-primary">
            Ver todas →
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          {requests.length === 0 && (
            <p className="text-sm text-fg-muted">Aun no hay solicitudes.</p>
          )}
          {requests.map((r) => (
            <Link
              key={r.id}
              href={`/solicitudes/${r.id}`}
              className="card card-hover flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{r.client.fullName}</p>
                <p className="truncate text-sm text-fg-soft">{r.description}</p>
              </div>
              <span className="chip-primary shrink-0">{r.status}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Proximas citas</h2>
          <Link href="/agenda" className="text-sm text-primary">
            Ir a agenda →
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          {appts.length === 0 && (
            <p className="text-sm text-fg-muted">Sin citas en los proximos 7 dias.</p>
          )}
          {appts.map((a) => (
            <div key={a.id} className="card flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{a.client.fullName}</p>
                <p className="truncate text-sm text-fg-soft">
                  {new Date(a.startAt).toLocaleString('es-CU')}
                  {a.service ? ` · ${a.service.name}` : ''}
                </p>
              </div>
              <span className="chip-success shrink-0">{a.status}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: 'primary' | 'accent';
}) {
  return (
    <div className="card card-hover">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-fg-muted">{label}</span>
        <span
          className={
            'grid h-8 w-8 place-items-center rounded-xl ' +
            (tone === 'primary'
              ? 'bg-primary-soft text-primary'
              : 'bg-accent-soft text-accent')
          }
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-bold">{value}</p>
    </div>
  );
}
