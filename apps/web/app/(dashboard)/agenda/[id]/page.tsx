'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Check,
  ChevronLeft,
  CircleDollarSign,
  Clock,
  Heart,
  Phone,
  Sparkles,
  X,
} from 'lucide-react';

import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { Skeleton } from '@/components/UI';

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

const STATUS_CHIP: Record<string, string> = {
  PENDING: 'chip-warning',
  CONFIRMED: 'chip-primary',
  COMPLETED: 'chip-success',
  CANCELLED: 'chip',
  NO_SHOW: 'chip',
};

export default function AppointmentDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
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
    try {
      await api(`/appointments/${params.id}`, { method: 'PATCH', json: { status } });
      toast.success('Estado actualizado');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
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
      toast.success('Pago registrado');
      router.push('/caja');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error';
      setError(msg);
      toast.error(msg);
    }
  }

  if (!data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/agenda" className="inline-flex items-center gap-1 text-sm text-fg-soft hover:text-fg">
        <ChevronLeft size={16} /> Volver a la agenda
      </Link>

      <header>
        <span className={STATUS_CHIP[data.status] ?? 'chip'}>{data.status}</span>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">
          {data.client.fullName}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-soft">
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={14} />
            {new Date(data.startAt).toLocaleString('es-CU')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={14} />
            {new Date(data.endAt).toLocaleTimeString('es-CU', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {data.service && (
            <span className="inline-flex items-center gap-1.5">
              <Sparkles size={14} /> {data.service.name}
            </span>
          )}
        </div>
        <p className="mt-2 inline-flex items-center gap-2 text-sm">
          <Phone size={14} className="text-fg-muted" />
          <a href={`tel:${data.client.phoneE164}`} className="text-primary">
            {data.client.phoneE164}
          </a>
          <span className="chip ml-2">
            <Heart size={12} /> {data.client.loyaltyPoints} pts
          </span>
        </p>
      </header>

      <section className="card">
        <h2 className="font-semibold">Estado de la cita</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn-ghost text-sm" onClick={() => setStatus('CONFIRMED')}>
            <Check size={14} /> Confirmar
          </button>
          <button className="btn-ghost text-sm" onClick={() => setStatus('CANCELLED')}>
            <X size={14} /> Cancelar
          </button>
          <button className="btn-ghost text-sm" onClick={() => setStatus('NO_SHOW')}>
            No vino
          </button>
        </div>
      </section>

      <section className="card overflow-hidden p-0">
        <div className="bg-gradient-to-br from-primary-soft to-accent-soft p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <CircleDollarSign size={18} className="text-primary" />
            {data.paidAt ? 'Pago registrado' : 'Registrar pago'}
          </h2>
          {data.paidAt && (
            <p className="mt-1 text-sm text-fg-soft">
              {data.amountPaid} {data.currency}
              {data.tipAmount ? ` (+ ${data.tipAmount} propina)` : ''} · {data.paymentMethod}
            </p>
          )}
        </div>
        <form onSubmit={submitPayment} className="grid gap-3 p-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="amountPaid">
              Monto cobrado
            </label>
            <input
              id="amountPaid"
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
            <label className="label" htmlFor="tipAmount">
              Propina
            </label>
            <input
              id="tipAmount"
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={pay.tipAmount}
              onChange={(e) => setPay({ ...pay, tipAmount: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="currency">
              Moneda
            </label>
            <select
              id="currency"
              className="select"
              value={pay.currency}
              onChange={(e) => setPay({ ...pay, currency: e.target.value as never })}
            >
              <option value="CUP">CUP</option>
              <option value="MLC">MLC</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="paymentMethod">
              Metodo
            </label>
            <select
              id="paymentMethod"
              className="select"
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
          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 sm:col-span-2 dark:text-red-300">
              {error}
            </p>
          )}
          <button className="btn-primary sm:col-span-2">
            {data.paidAt ? 'Actualizar pago' : 'Registrar pago + completar cita'}
          </button>
        </form>
      </section>
    </div>
  );
}
