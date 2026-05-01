'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { api } from '@/lib/api';
import { saveSession } from '@/lib/auth';

export default function RegistroPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    slug: '',
    defaultCurrency: 'CUP' as 'CUP' | 'MLC' | 'USD',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm({ ...form, [key]: value });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await api<any>('/auth/register', {
        method: 'POST',
        json: form,
        auth: false,
      });
      saveSession(result);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-3xl font-bold text-rose-700">Crear cuenta</h1>
      <p className="mt-2 text-rose-900/70">
        Tu enlace publico sera <code>manicuba.app/m/&lt;tu-slug&gt;</code>.
      </p>

      <form onSubmit={onSubmit} className="card mt-8 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Nombre del negocio</label>
            <input
              className="input"
              required
              value={form.businessName}
              onChange={(e) => update('businessName', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Tu nombre</label>
            <input
              className="input"
              required
              value={form.ownerName}
              onChange={(e) => update('ownerName', e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label">Slug publico</label>
          <input
            className="input"
            placeholder="ej: yamila-nails"
            required
            value={form.slug}
            onChange={(e) => update('slug', e.target.value.toLowerCase())}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Correo</label>
            <input
              type="email"
              className="input"
              required
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Telefono (Cuba)</label>
            <input
              className="input"
              placeholder="+5355551234"
              required
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Contrasena</label>
            <input
              type="password"
              className="input"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Moneda por defecto</label>
            <select
              className="input"
              value={form.defaultCurrency}
              onChange={(e) => update('defaultCurrency', e.target.value as any)}
            >
              <option value="CUP">CUP</option>
              <option value="MLC">MLC</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Creando...' : 'Crear cuenta'}
        </button>
      </form>
    </main>
  );
}
