'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Expense {
  id: string;
  amount: number;
  currency: string;
  category: string | null;
  description: string | null;
  date: string;
}

interface Report {
  count: number;
  income: Record<string, number>;
  tips: Record<string, number>;
  expenses: Record<string, number>;
  net: Record<string, number>;
}

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};
const monthStart = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

export default function CajaPage() {
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [form, setForm] = useState({
    amount: '',
    currency: 'CUP' as 'CUP' | 'MLC' | 'USD',
    category: '',
    description: '',
  });

  async function load() {
    const fromIso = new Date(from).toISOString();
    const toIso = new Date(to + 'T23:59:59').toISOString();
    const [r, e] = await Promise.all([
      api<Report>(`/cash/report?from=${fromIso}&to=${toIso}`),
      api<Expense[]>(`/cash/expenses?from=${fromIso}&to=${toIso}`),
    ]);
    setReport(r);
    setExpenses(e);
  }

  useEffect(() => {
    load().catch(() => {});
  }, [from, to]);

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    await api('/cash/expenses', {
      method: 'POST',
      json: {
        amount: Number(form.amount),
        currency: form.currency,
        category: form.category || undefined,
        description: form.description || undefined,
      },
    });
    setForm({ amount: '', currency: 'CUP', category: '', description: '' });
    load();
  }

  async function remove(id: string) {
    await api(`/cash/expenses/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-primary">Caja</h1>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Desde</label>
          <input
            type="date"
            className="input"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Hasta</label>
          <input
            type="date"
            className="input"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </div>

      {report && (
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="card">
            <p className="text-xs uppercase text-primary">Citas pagadas</p>
            <p className="mt-1 text-3xl font-bold text-primary">{report.count}</p>
          </div>
          <div className="card">
            <p className="text-xs uppercase text-primary">Ganancia neta</p>
            <ul className="mt-2 space-y-1 text-sm">
              {Object.keys(report.net).length === 0 && <li>Sin movimientos.</li>}
              {Object.entries(report.net).map(([c, v]) => (
                <li key={c} className="flex justify-between">
                  <span>{c}</span>
                  <strong>{v.toFixed(2)}</strong>
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <p className="text-xs uppercase text-primary">Ingresos</p>
            <ul className="mt-2 space-y-1 text-sm">
              {Object.entries(report.income).map(([c, v]) => (
                <li key={c} className="flex justify-between">
                  <span>{c}</span>
                  <span>{v.toFixed(2)}</span>
                </li>
              ))}
              {Object.entries(report.tips).map(([c, v]) =>
                v > 0 ? (
                  <li key={`t-${c}`} className="flex justify-between text-fg-muted">
                    <span>{c} (propinas)</span>
                    <span>{v.toFixed(2)}</span>
                  </li>
                ) : null,
              )}
            </ul>
          </div>
          <div className="card">
            <p className="text-xs uppercase text-primary">Gastos</p>
            <ul className="mt-2 space-y-1 text-sm">
              {Object.entries(report.expenses).map(([c, v]) => (
                <li key={c} className="flex justify-between">
                  <span>{c}</span>
                  <span>{v.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <h2 className="mt-6 text-lg font-semibold text-primary">Gastos del periodo</h2>
      <form onSubmit={addExpense} className="card grid gap-3 sm:grid-cols-4">
        <input
          className="input"
          type="number"
          placeholder="Monto"
          required
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />
        <select
          className="input"
          value={form.currency}
          onChange={(e) => setForm({ ...form, currency: e.target.value as any })}
        >
          <option value="CUP">CUP</option>
          <option value="MLC">MLC</option>
          <option value="USD">USD</option>
        </select>
        <input
          className="input"
          placeholder="Categoria"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
        <input
          className="input"
          placeholder="Descripcion"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <button className="btn-primary sm:col-span-4">Agregar gasto</button>
      </form>

      <div className="grid gap-2">
        {expenses.length === 0 && <p className="text-fg-muted">Sin gastos en el periodo.</p>}
        {expenses.map((e) => (
          <div key={e.id} className="card flex items-center justify-between">
            <div>
              <p className="font-semibold text-fg">
                {e.amount} {e.currency}
                {e.category ? ` · ${e.category}` : ''}
              </p>
              <p className="text-sm text-fg-muted">
                {new Date(e.date).toLocaleDateString('es-CU')}
                {e.description ? ` · ${e.description}` : ''}
              </p>
            </div>
            <button onClick={() => remove(e.id)} className="btn-ghost text-xs">
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
