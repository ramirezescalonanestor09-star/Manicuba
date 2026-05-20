'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { CardSkeleton, EmptyState } from '@/components/UI';
import { useToast } from '@/components/Toast';

interface Client {
  id: string;
  fullName: string;
  phoneE164: string;
  email: string | null;
  loyaltyPoints: number;
}

export default function ClientasPage() {
  const [items, setItems] = useState<Client[] | null>(null);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', notesPrivate: '' });
  const toast = useToast();

  async function load() {
    setItems(null);
    try {
      const data = await api<Client[]>(
        `/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`,
      );
      setItems(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
      setItems([]);
    }
  }

  useEffect(() => {
    load().catch(() => {});
  }, [search]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api('/clients', { method: 'POST', json: form });
      setForm({ fullName: '', phone: '', email: '', notesPrivate: '' });
      setCreating(false);
      toast.success('Clienta creada');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Clientas</h1>
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
        {items === null && <CardSkeleton rows={3} />}
        {items && items.length === 0 && (
          <EmptyState
            title="Sin clientas"
            description="Cuando una clienta llene tu formulario publico aparecera aqui."
          />
        )}
        {items?.map((c) => (
          <div key={c.id} className="card flex items-center justify-between">
            <div>
              <p className="font-semibold text-fg">{c.fullName}</p>
              <p className="text-sm text-fg-soft">
                {c.phoneE164}
                {c.email ? ` · ${c.email}` : ''}
              </p>
            </div>
            <span
              className={
                'rounded-full px-3 py-1 text-xs ' +
                (c.loyaltyPoints >= 10
                  ? 'bg-emerald-200 text-emerald-900'
                  : 'bg-primary-soft text-primary')
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
