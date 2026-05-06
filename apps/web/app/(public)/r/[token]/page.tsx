import { notFound } from 'next/navigation';
import { formatAmount } from '@manicuba/shared';

import { API_URL } from '@/lib/api';
import { ClientChat } from '@/components/ClientChat';
import { QuoteDecision } from '@/components/QuoteDecision';

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

export default async function PublicRequestPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const request = await getRequest(token);
  if (!request) notFound();

  const statusLabel: Record<string, string> = {
    NEW: 'Recibida',
    REVIEWING: 'En revision',
    QUOTED: 'Cotizada',
    ACCEPTED: 'Aceptada',
    REJECTED: 'Rechazada',
    EXPIRED: 'Vencida',
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 space-y-6">
      <header>
        <p className="text-sm uppercase tracking-wide text-primary">
          Solicitud {statusLabel[request.status] ?? request.status}
        </p>
        <h1 className="text-3xl font-bold text-primary">
          Hola {request.client.fullName.split(' ')[0]}!
        </h1>
        <p className="mt-2 text-fg-soft">
          Para {request.tenant.businessName} · {request.tenant.ownerName}
        </p>
      </header>

      <section className="card">
        <h2 className="text-lg font-semibold text-primary">Lo que pediste</h2>
        <p className="mt-2 whitespace-pre-line text-fg-soft">{request.description}</p>
        {request.images.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {request.images.map((img) => (
              <img
                key={img.id}
                src={`/files/${img.storageKey}`}
                alt=""
                className="aspect-square w-full rounded-xl object-cover"
              />
            ))}
          </div>
        )}
      </section>

      {request.quote ? (
        <section className="card">
          <h2 className="text-lg font-semibold text-primary">Tu cotizacion</h2>
          <p className="mt-1 text-3xl font-bold text-primary">
            {formatAmount(request.quote.amount, request.quote.currency)}
          </p>
          {request.quote.message && (
            <p className="mt-3 whitespace-pre-line text-fg-soft">
              {request.quote.message}
            </p>
          )}
          {request.quote.validUntil && (
            <p className="mt-3 text-xs text-fg-muted">
              Valida hasta: {new Date(request.quote.validUntil).toLocaleDateString('es-CU')}
            </p>
          )}
          {!request.quote.acceptedAt && !request.quote.rejectedAt && (
            <QuoteDecision token={request.publicToken} />
          )}
          {request.quote.acceptedAt && (
            <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-800">
              Aceptaste esta cotizacion. Tu cita esta confirmada.
            </p>
          )}
          {request.quote.rejectedAt && (
            <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              Rechazaste esta cotizacion. Puedes seguir hablando por chat.
            </p>
          )}
        </section>
      ) : (
        <section className="card">
          <h2 className="text-lg font-semibold text-primary">Esperando cotizacion</h2>
          <p className="mt-2 text-fg-soft">
            La manicuri esta revisando tu solicitud. Recibiras la cotizacion pronto.
          </p>
        </section>
      )}

      {request.thread && (
        <section className="card">
          <h2 className="text-lg font-semibold text-primary">Conversacion</h2>
          <ClientChat threadToken={request.thread.publicToken} />
        </section>
      )}
    </main>
  );
}
