'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Template {
  id: string;
  name: string;
  body: string;
}

export default function PlantillasPage() {
  const [items, setItems] = useState<Template[]>([]);
  const [form, setForm] = useState({ name: '', body: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load() {
    setItems(await api<Template[]>('/quote-templates'));
  }
  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      await api(`/quote-templates/${editingId}`, { method: 'PATCH', json: form });
    } else {
      await api('/quote-templates', { method: 'POST', json: form });
    }
    setForm({ name: '', body: '' });
    setEditingId(null);
    load();
  }

  function edit(t: Template) {
    setEditingId(t.id);
    setForm({ name: t.name, body: t.body });
  }

  async function remove(id: string) {
    await api(`/quote-templates/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-rose-700">Plantillas de cotizacion</h1>
      <p className="text-rose-900/70">
        Crea mensajes reutilizables para enviar cotizaciones rapido. Puedes usar texto libre.
      </p>

      <form onSubmit={save} className="card space-y-3">
        <input
          className="input"
          placeholder="Nombre (ej: Diseno acrilico)"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <textarea
          className="input min-h-[120px]"
          required
          placeholder="Mensaje base..."
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
        />
        <button className="btn-primary">{editingId ? 'Guardar cambios' : 'Crear plantilla'}</button>
        {editingId && (
          <button
            type="button"
            className="btn-ghost ml-2"
            onClick={() => {
              setEditingId(null);
              setForm({ name: '', body: '' });
            }}
          >
            Cancelar
          </button>
        )}
      </form>

      <div className="grid gap-2">
        {items.map((t) => (
          <div key={t.id} className="card">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-rose-800">{t.name}</p>
              <div className="flex gap-2">
                <button className="btn-ghost text-xs" onClick={() => edit(t)}>
                  Editar
                </button>
                <button className="btn-ghost text-xs" onClick={() => remove(t.id)}>
                  Eliminar
                </button>
              </div>
            </div>
            <pre className="mt-2 whitespace-pre-wrap text-sm text-rose-900/80">{t.body}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
