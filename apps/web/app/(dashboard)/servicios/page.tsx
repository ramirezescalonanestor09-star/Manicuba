'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Service {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  priceCUP: number | null;
  priceMLC: number | null;
  priceUSD: number | null;
  active: boolean;
}

export default function ServiciosPage() {
  const [items, setItems] = useState<Service[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    durationMin: 60,
    priceCUP: '',
    priceMLC: '',
    priceUSD: '',
  });

  async function load() {
    const data = await api<Service[]>('/services');
    setItems(data);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await api('/services', {
      method: 'POST',
      json: {
        name: form.name,
        description: form.description || undefined,
        durationMin: Number(form.durationMin),
        priceCUP: form.priceCUP ? Number(form.priceCUP) : undefined,
        priceMLC: form.priceMLC ? Number(form.priceMLC) : undefined,
        priceUSD: form.priceUSD ? Number(form.priceUSD) : undefined,
      },
    });
    setCreating(false);
    setForm({ name: '', description: '', durationMin: 60, priceCUP: '', priceMLC: '', priceUSD: '' });
    load();
  }

  async function toggleActive(s: Service) {
    await api(`/services/${s.id}`, { method: 'PATCH', json: { active: !s.active } });
    load();
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Servicios</h1>
        <button onClick={() => setCreating(!creating)} className="btn-primary">
          {creating ? 'Cerrar' : 'Nuevo servicio'}
        </button>
      </header>

      {creating && (
        <form onSubmit={create} className="card grid gap-3 sm:grid-cols-2">
          <input
            className="input sm:col-span-2"
            placeholder="Nombre del servicio"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <textarea
            className="input sm:col-span-2"
            placeholder="Descripcion"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <input
            className="input"
            type="number"
            min="5"
            placeholder="Duracion (min)"
            value={form.durationMin}
            onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })}
          />
          <input
            className="input"
            type="number"
            placeholder="Precio CUP"
            value={form.priceCUP}
            onChange={(e) => setForm({ ...form, priceCUP: e.target.value })}
          />
          <input
            className="input"
            type="number"
            placeholder="Precio MLC"
            value={form.priceMLC}
            onChange={(e) => setForm({ ...form, priceMLC: e.target.value })}
          />
          <input
            className="input"
            type="number"
            placeholder="Precio USD"
            value={form.priceUSD}
            onChange={(e) => setForm({ ...form, priceUSD: e.target.value })}
          />
          <button className="btn-primary sm:col-span-2">Crear</button>
        </form>
      )}

      <div className="grid gap-2">
        {items.map((s) => (
          <div key={s.id} className="card">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-fg">
                {s.name}{' '}
                {!s.active && (
                  <span className="text-xs text-fg-muted">(inactivo)</span>
                )}
              </p>
              <button className="btn-ghost text-xs" onClick={() => toggleActive(s)}>
                {s.active ? 'Pausar' : 'Activar'}
              </button>
            </div>
            {s.description && <p className="mt-1 text-sm text-fg-soft">{s.description}</p>}
            <p className="mt-2 text-sm text-fg-soft">
              {s.durationMin} min ·{' '}
              {[
                s.priceCUP && `${s.priceCUP} CUP`,
                s.priceMLC && `${s.priceMLC} MLC`,
                s.priceUSD && `${s.priceUSD} USD`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
