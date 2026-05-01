'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Appt {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  priceFinal: number | null;
  currency: string | null;
  amountPaid: number | null;
  tipAmount: number | null;
  paymentMethod: string | null;
  paidAt: string | null;
  notes: string | null;
  client: { id: string; fullName: string; phoneE164: string; loyaltyPoints: number };
  service?: { name: string } | null;
}

export default function AppointmentDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<Appt | null>(null);
  const [pay, setPay] = useState({
    amountPaid: '',
    tipAmount: '',
    currency: 'CUP' as 'CUP' | 'MLC' | 'USD',
    paymentMethod: 'CASH',
  });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const found = await api<Appt>(`/appointments/${params.id}`);
    setData(found);
    setPay({
      amountPaid: found.amountPaid?.toString() ?? found.priceFinal?.toString() ?? '',
      tipAmount: found.tipAmount?.toString() ?? '',
      currency: (found.currency as 'CUP' | 'MLC' | 'USD') ?? 'CUP',
      paymentMethod: found.paymentMethod ?? 'CASH',
    });
  }
  useEffect(() => {
    load().catch(() => {});
  }, [params.id]);

  async function setStatus(status: string) {
    await api(`/appointments/${params.id}`, { method: 'PATCH', json: { status } });
    load();
  }

  async function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api(`/appointments/${params.id}/payment`, {
        method: 'PATCH',
        json: {
          amountPaid: Number(pay.amountPaid),
          tipAmount: pay.tipAmount ? Number(pay.tipAmount) : undefined,
          currency: pay.currency,
          paymentMethod: pay.paymentMethod,
        },
      });
      router.push('/caja');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }

  if (!data) return <p className="text-rose-700">Cargando...</p>;

  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs uppercase text-rose-600">Cita {data.status}</p>
        <h1 className="text-2xl font-bold text-rose-700">{data.client.fullName}</h1>
        <p className="text-sm text-rose-900/70">
          {new Date(data.startAt).toLocaleString('es-CU')} —{' '}
          {new Date(data.endAt).toLocaleTimeString('es-CU', {
            hour: '2-digit',
            minute: '2-digit',
          })}
          {data.service ? ` · ${data.service.name}` : ''}
        </p>
        <p className="mt-1 text-sm text-rose-900/70">
          {data.client.loyaltyPoints} puntos de fidelidad
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button className="btn-ghost text-sm" onClick={() => setStatus('CONFIRMED')}>
          Confirmar
        </button>
        <button className="btn-ghost text-sm" onClick={() => setStatus('CANCELLED')}>
          Cancelar
        </button>
        <button className="btn-ghost text-sm" onClick={() => setStatus('NO_SHOW')}>
          No vino
        </button>
      </div>

      <section className="card">
        <h2 className="text-lg font-semibold text-rose-700">
          {data.paidAt ? 'Pago registrado' : 'Registrar pago'}
        </h2>
        {data.paidAt && (
          <p className="mt-1 text-sm text-rose-900/70">
            Pagado {data.amountPaid} {data.currency}
            {data.tipAmount ? ` (+ propina ${data.tipAmount})` : ''} ·{' '}
            {data.paymentMethod}
          </p>
        )}
        <form onSubmit={submitPayment} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Monto cobrado</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              required
              value={pay.amountPaid}
              onChange={(e) => setPay({ ...pay, amountPaid: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Propina</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={pay.tipAmount}
              onChange={(e) => setPay({ ...pay, tipAmount: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Moneda</label>
            <select
              className="input"
              value={pay.currency}
              onChange={(e) => setPay({ ...pay, currency: e.target.value as any })}
            >
              <option value="CUP">CUP</option>
              <option value="MLC">MLC</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div>
            <label className="label">Metodo</label>
            <select
              className="input"
              value={pay.paymentMethod}
              onChange={(e) => setPay({ ...pay, paymentMethod: e.target.value })}
            >
              <option value="CASH">Efectivo</option>
              <option value="TRANSFER">Transferencia</option>
              <option value="CARD">Tarjeta</option>
              <option value="MLC_CARD">MLC</option>
              <option value="ZELLE">Zelle</option>
              <option value="OTHER">Otro</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <button className="btn-primary sm:col-span-2">
            {data.paidAt ? 'Actualizar pago' : 'Registrar pago + completar'}
          </button>
        </form>
      </section>
    </div>
  );
}
