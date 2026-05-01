'use client';

import { useEffect, useRef, useState } from 'react';
import { api, API_URL } from '@/lib/api';
import { loadSession } from '@/lib/auth';

interface Item {
  id: string;
  storageKey: string;
  caption: string | null;
}

export default function PortafolioPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [caption, setCaption] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setItems(await api<Item[]>('/gallery'));
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!fileRef.current?.files?.[0]) return;
    const fd = new FormData();
    fd.append('image', fileRef.current.files[0]);
    if (caption) fd.append('caption', caption);

    const session = loadSession();
    await fetch(`${API_URL}/api/gallery`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.accessToken}` },
      body: fd,
    });
    setCaption('');
    if (fileRef.current) fileRef.current.value = '';
    load();
  }

  async function remove(id: string) {
    await api(`/gallery/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-rose-700">Portafolio</h1>

      <form onSubmit={upload} className="card flex flex-col gap-3 sm:flex-row sm:items-end">
        <input ref={fileRef} type="file" accept="image/*" required />
        <input
          className="input"
          placeholder="Descripcion (opcional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        <button className="btn-primary">Subir</button>
      </form>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((g) => (
          <div key={g.id} className="relative">
            <img
              src={`/files/${g.storageKey}`}
              alt={g.caption ?? ''}
              className="aspect-square w-full rounded-xl object-cover"
            />
            <button
              type="button"
              onClick={() => remove(g.id)}
              className="absolute right-1 top-1 rounded-full bg-white/80 px-2 py-1 text-xs text-rose-700"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
