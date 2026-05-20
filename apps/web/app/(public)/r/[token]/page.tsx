import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  ChevronLeft,
  Clock,
  MessageSquare,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { formatAmount } from '@manicuba/shared';

import { API_URL } from '@/lib/api';
import { ClientChat } from '@/components/ClientChat';
import { QuoteDecision } from '@/components/QuoteDecision';
import { ThemeToggle } from '@/components/ThemeToggle';

interface PublicRequest {
  id: string;
  publicToken: string;
  status: string;
  description: string;
  requestedSlot: string | null;
  tenant: { businessName: string; ownerName: string; phoneE164: string; slug: string };
  client: { fullName: string; phoneE164: string; email: string | null };
  images: Array<{ id: string; storageKey: string }>;
  quote: {
    amount: number;
    currency: 'CUP' | 'MLC' | 'USD';
    message: string | null;
    validUntil: string | null;
    acceptedAt: string | null;
    rejectedAt: string | null;
  } | null;
  thread: { id: string; publicToken: string } | null;
}

async function getRequest(token: string): Promise<PublicRequest | null> {
  const res = await fetch(`${API_URL}/api/public/requests/${token}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

const STATUS: Record<string, { label: string; chip: string }> = {
  NEW: { label: 'Recibida', chip: 'chip-primary' },
  REVIEWING: { label: 'En revision', chip: 'chip-warning' },
  QUOTED: { label: 'Cotizada', chip: 'chip-primary' },
  ACCEPTED: { label: 'Aceptada', chip: 'chip-success' },
  REJECTED: { label: 'Rechazada', chip: 'chip' },
  EXPIRED: { label: 'Vencida', chip: 'chip' },
};

export default async function PublicRequestPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const request = await getRequest(token);
  if (!request) notFound();

  const status = STATUS[request.status] ?? { label: request.status, chip: 'chip' };

  return (
    <div>
      <header className="sticky top-0 z-30 glass">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link
            href={`/m/${request.tenant.slug}`}
            className="flex items-center gap-2 text-fg-soft hover:text-fg"
          >
            <ChevronLeft size={18} />
            <span className="text-sm">{request.tenant.businessName}</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 pb-20 pt-8 md:px-6">
        <section className="animate-fade-up">
          <span className={status.chip}>{status.label}</span>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">
            Hola, <span className="heading-grad">{request.client.fullName.split(' ')[0]}</span>
          </h1>
          <p className="mt-1 text-fg-soft">
            Tu solicitud con {request.tenant.businessName} ·{' '}
            <span className="text-fg">{request.tenant.ownerName}</span>
          </p>
        </section>

        <section className="card animate-fade-up">
          <h2 className="flex items-center gap-2 font-semibold">
            <Sparkles size={16} className="text-primary" /> Lo que pediste
          </h2>
          <p className="mt-3 whitespace-pre-line text-fg-soft">{request.description}</p>
          {request.requestedSlot && (
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-fg-muted">
              <Clock size={12} />
              Solicitado para {new Date(request.requestedSlot).toLocaleString('es-CU')}
            </p>
          )}
          {request.images.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {request.images.map((img) => (
                <a
                  key={img.id}
                  href={`/files/${img.storageKey}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group overflow-hidden rounded-2xl"
                >
                  <img
                    src={`/files/${img.storageKey}`}
                    alt=""
                    loading="lazy"
                    className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </a>
              ))}
            </div>
          )}
        </section>

        {request.quote ? (
          <section className="card animate-fade-up overflow-hidden p-0">
            <div className="bg-gradient-to-br from-primary-soft to-accent-soft p-6">
              <p className="text-xs uppercase tracking-wide text-fg-muted">Cotizacion</p>
              <p className="mt-1 font-display text-5xl font-bold tracking-tight">
                {formatAmount(request.quote.amount, request.quote.currency)}
              </p>
              {request.quote.validUntil && (
                <p className="mt-2 text-xs text-fg-muted">
                  Valida hasta {new Date(request.quote.validUntil).toLocaleDateString('es-CU')}
                </p>
              )}
            </div>
            <div className="p-6">
              {request.quote.message && (
                <p className="whitespace-pre-line text-fg-soft">{request.quote.message}</p>
              )}
              {!request.quote.acceptedAt && !request.quote.rejectedAt && (
                <div className="mt-5">
                  <QuoteDecision token={request.publicToken} />
                </div>
              )}
              {request.quote.acceptedAt && (
                <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 size={20} className="shrink-0" />
                  <p className="text-sm">
                    Aceptaste esta cotizacion. Tu cita esta confirmada.
                  </p>
                </div>
              )}
              {request.quote.rejectedAt && (
                <div className="mt-5 flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-200">
                  <XCircle size={20} className="shrink-0" />
                  <p className="text-sm">
                    Rechazaste esta cotizacion. Puedes seguir conversando por chat.
                  </p>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="card animate-fade-up text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">
              <Clock size={20} className="animate-pulse" />
            </div>
            <h2 className="mt-3 font-semibold">Esperando cotizacion</h2>
            <p className="mt-1 text-sm text-fg-soft">
              La manicuri esta revisando tu solicitud. Te llegara la cotizacion pronto.
            </p>
          </section>
        )}

        {request.thread && (
          <section className="card animate-fade-up">
            <h2 className="flex items-center gap-2 font-semibold">
              <MessageSquare size={16} className="text-primary" /> Conversacion
            </h2>
            <ClientChat threadToken={request.thread.publicToken} />
          </section>
        )}
      </main>
    </div>
  );
}
