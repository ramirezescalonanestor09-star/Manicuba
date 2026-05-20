'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

import { api } from '@/lib/api';
import { saveSession } from '@/lib/auth';
import { ThemeToggle } from '@/components/ThemeToggle';

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
      const result = await api<{
        tokens: { accessToken: string; refreshToken: string };
        tenant: { id: string; slug: string; businessName: string };
        user: { id: string; email: string; name: string; role: string };
      }>('/auth/register', {
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
    <div>
      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-md">
            <Sparkles size={18} />
          </span>
          <span className="font-bold">Manicuba</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6 py-20">
        <div className="animate-fade-up">
          <h1 className="font-display text-4xl font-bold tracking-tight">
            <span className="heading-grad">Crea tu cuenta</span>
          </h1>
          <p className="mt-2 text-fg-soft">
            Tu enlace publico sera <code className="text-primary">manicuba.app/m/&lt;tu-slug&gt;</code>.
          </p>

          <form onSubmit={onSubmit} className="card mt-6 space-y-4">
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
                  className="select"
                  value={form.defaultCurrency}
                  onChange={(e) => update('defaultCurrency', e.target.value as never)}
                >
                  <option value="CUP">CUP</option>
                  <option value="MLC">MLC</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
            {error && (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            )}
            <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
              {loading ? 'Creando...' : 'Crear cuenta'}
              {!loading && <ArrowRight size={16} />}
            </button>
            <p className="text-center text-sm text-fg-muted">
              Ya tienes cuenta?{' '}
              <Link href="/login" className="font-semibold text-primary">
                Entrar
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
