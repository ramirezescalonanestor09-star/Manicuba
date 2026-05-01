'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Client {
  id: string;
  fullName: string;
  phoneE164: string;
  email: string | null;
  loyaltyPoints: number;
}

export default function ClientasPage() {
  const [items, setItems] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', notesPrivate: '' });

  async function load() {
    const data = await api<Client[]>(
      `/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`,
    );
    setItems(data);
  }

  useEffect(() => {
    load().catch(() => {});
  }, [search]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await api('/clients', { method: 'POST', json: form });
    setForm({ fullName: '', phone: '', email: '', notesPrivate: '' });
    setCreating(false);
    load();
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-rose-700">Clientas</h1>
        <button onClick={() => setCreating(!creating)} className="btn-primary">
          {creating ? 'Cerrar' : 'Nueva clienta'}
        </button>
      </header>

      {creating && (
        <form onSubmit={create} className="card grid gap-3 sm:grid-cols-2">
          <input
            className="input"
            placeholder="Nombre completo"
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
          <input
            className="input"
            placeholder="Telefono"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <input
            className="input"
            placeholder="Correo (opcional)"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className="input"
            placeholder="Notas privadas"
            value={form.notesPrivate}
            onChange={(e) => setForm({ ...form, notesPrivate: e.target.value })}
          />
          <button className="btn-primary sm:col-span-2">Guardar</button>
        </form>
      )}

      <input
        className="input"
        placeholder="Buscar por nombre, telefono o correo..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="grid gap-2">
        {items.length === 0 && <p className="text-rose-900/60">Aun no hay clientas.</p>}
        {items.map((c) => (
          <div key={c.id} className="card flex items-center justify-between">
            <div>
              <p className="font-semibold text-rose-800">{c.fullName}</p>
              <p className="text-sm text-rose-900/70">
                {c.phoneE164}
                {c.email ? ` · ${c.email}` : ''}
              </p>
            </div>
            <span
              className={
                'rounded-full px-3 py-1 text-xs ' +
                (c.loyaltyPoints >= 10
                  ? 'bg-emerald-200 text-emerald-900'
                  : 'bg-rose-100 text-rose-700')
              }
            >
              {c.loyaltyPoints >= 10 ? '★ ' : ''}
              {c.loyaltyPoints} pts
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
