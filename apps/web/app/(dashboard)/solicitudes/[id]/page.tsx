'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  buildQuoteMessage,
  formatAmount,
  mailtoLink,
  smsLink,
  telegramShareLink,
  whatsappLink,
} from '@manicuba/shared';

import { api, SITE_URL } from '@/lib/api';
import { loadSession } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { Skeleton } from '@/components/UI';

interface RequestFull {
  id: string;
  status: string;
  description: string;
  allergiesNote: string | null;
  budgetEstimate: number | null;
  preferredCurrency: 'CUP' | 'MLC' | 'USD' | null;
  preferredChannel: string | null;
  publicToken: string;
  client: { id: string; fullName: string; phoneE164: string; email: string | null };
  images: Array<{ id: string; storageKey: string }>;
  quote: {
    amount: number;
    currency: 'CUP' | 'MLC' | 'USD';
    message: string | null;
    validUntil: string | null;
    sentAt: string;
    acceptedAt: string | null;
    rejectedAt: string | null;
  } | null;
  service?: { name: string } | null;
}

export default function RequestDetail() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<RequestFull | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'CUP' | 'MLC' | 'USD'>('CUP');
  const [message, setMessage] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; body: string }>>(
    [],
  );

  const session = typeof window !== 'undefined' ? loadSession() : null;
  const toast = useToast();

  async function refresh() {
    try {
      const d = await api<RequestFull>(`/requests/${params.id}`);
      setData(d);
      if (d.quote) {
        setAmount(String(d.quote.amount));
        setCurrency(d.quote.currency);
        setMessage(d.quote.message ?? '');
        setValidUntil(d.quote.validUntil ? d.quote.validUntil.slice(0, 10) : '');
      } else if (d.preferredCurrency) {
        setCurrency(d.preferredCurrency);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }

  useEffect(() => {
    refresh();
    api<typeof templates>('/quote-templates').then(setTemplates).catch(() => {});
  }, [params.id]);

  async function submitQuote(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setSubmitting(true);
    try {
      await api(`/requests/${data.id}/quote`, {
        method: 'POST',
        json: {
          amount: Number(amount),
          currency,
          message: message || undefined,
          validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
        },
      });
      await refresh();
      toast.success('Cotizacion guardada');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function setStatus(status: string) {
    if (!data) return;
    try {
      await api(`/requests/${data.id}/status`, { method: 'PATCH', json: { status } });
      await refresh();
      toast.success('Estado actualizado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  }

  if (error && !data) return <p className="text-red-600">{error}</p>;
  if (!data)
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );

  const publicUrl = `${SITE_URL}/r/${data.publicToken}`;
  const shareMessage =
    data.quote && session
      ? buildQuoteMessage({
          clientName: data.client.fullName,
          manicuriName: session.tenant.businessName,
          amountFormatted: formatAmount(data.quote.amount, data.quote.currency),
          publicUrl,
          validUntil: data.quote.validUntil
            ? new Date(data.quote.validUntil).toLocaleDateString('es-CU')
            : undefined,
          customMessage: data.quote.message ?? undefined,
        })
      : '';

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase text-primary">Solicitud {data.status}</p>
          <h1 className="text-2xl font-bold text-primary">{data.client.fullName}</h1>
          <p className="text-sm text-fg-soft">{data.client.phoneE164}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost text-sm" onClick={() => setStatus('REVIEWING')}>
            Marcar en revision
          </button>
          <button className="btn-ghost text-sm" onClick={() => setStatus('REJECTED')}>
            Rechazar
          </button>
        </div>
      </header>

      <section className="card">
        <h2 className="text-lg font-semibold text-primary">Lo que pide</h2>
        <p className="mt-2 whitespace-pre-line text-fg-soft">{data.description}</p>
        {data.allergiesNote && (
          <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            <strong>Alergias / cuidados:</strong> {data.allergiesNote}
          </p>
        )}
        {data.budgetEstimate != null && (
          <p className="mt-2 text-sm text-fg-soft">
            Presupuesto aprox: {data.budgetEstimate}
            {data.preferredCurrency ? ` ${data.preferredCurrency}` : ''}
          </p>
        )}
        {data.images.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {data.images.map((img) => (
              <a key={img.id} href={`/files/${img.storageKey}`} target="_blank" rel="noreferrer">
                <img
                  src={`/files/${img.storageKey}`}
                  className="aspect-square w-full rounded-xl object-cover"
                  alt=""
                />
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold text-primary">
          {data.quote ? 'Editar cotizacion' : 'Cotizar'}
        </h2>
        <form onSubmit={submitQuote} className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label">Monto</label>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Moneda</label>
              <select
                className="input"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
              >
                <option value="CUP">CUP</option>
                <option value="MLC">MLC</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div>
              <label className="label">Valida hasta</label>
              <input
                type="date"
                className="input"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Mensaje (opcional)</label>
            {templates.length > 0 && (
              <select
                className="input mb-2"
                onChange={(e) => {
                  const tpl = templates.find((t) => t.id === e.target.value);
                  if (tpl) setMessage(tpl.body);
                  e.target.value = '';
                }}
                defaultValue=""
              >
                <option value="">Usar plantilla...</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
            <textarea
              className="input min-h-[80px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Detalla el precio, lo que incluye, recomendaciones..."
            />
          </div>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Guardando...' : data.quote ? 'Actualizar cotizacion' : 'Enviar cotizacion'}
          </button>
        </form>
      </section>

      {data.quote && (
        <section className="card">
          <h2 className="text-lg font-semibold text-primary">Compartir cotizacion</h2>
          <p className="mt-2 text-sm text-fg-soft">
            Total:{' '}
            <strong>{formatAmount(data.quote.amount, data.quote.currency)}</strong>
          </p>
          <code className="mt-3 block break-all rounded-xl bg-surface-2 px-3 py-2 text-xs text-primary">
            {publicUrl}
          </code>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={whatsappLink(data.client.phoneE164, shareMessage)}
              target="_blank"
              rel="noreferrer"
              className="btn-primary text-sm"
            >
              WhatsApp
            </a>
            <a
              href={telegramShareLink(publicUrl, shareMessage)}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost text-sm"
            >
              Telegram
            </a>
            {data.client.email && (
              <a
                href={mailtoLink(
                  data.client.email,
                  'Tu cotizacion en ' + (session?.tenant.businessName ?? 'Manicuba'),
                  shareMessage,
                )}
                className="btn-ghost text-sm"
              >
                Correo
              </a>
            )}
            <a
              href={smsLink(data.client.phoneE164, shareMessage)}
              className="btn-ghost text-sm"
            >
              SMS
            </a>
            <button
              type="button"
              className="btn-ghost text-sm"
              onClick={() => navigator.clipboard.writeText(shareMessage)}
            >
              Copiar mensaje
            </button>
          </div>
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-primary">
              Ver mensaje completo
            </summary>
            <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-surface-2 p-3 text-xs text-fg">
              {shareMessage}
            </pre>
          </details>
        </section>
      )}
    </div>
  );
}
