'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

import { api } from '@/lib/api';
import { saveSession } from '@/lib/auth';
import { ThemeToggle } from '@/components/ThemeToggle';

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('demo@manicuba.app');
  const [password, setPassword] = useState('manicuba123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const justReset = params.get('reset') === '1';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await api<{
        tokens: { accessToken: string; refreshToken: string };
        tenant: { id: string; slug: string; businessName: string };
        user: { id: string; email: string; name: string; role: string };
      }>('/auth/login', {
        method: 'POST',
        json: { email, password },
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
    <div className="animate-fade-up">
      <h1 className="font-display text-4xl font-bold tracking-tight">
        <span className="heading-grad">Bienvenida</span> de vuelta
      </h1>
      <p className="mt-2 text-fg-soft">Entra a tu panel y sigue brillando.</p>

      {justReset && (
        <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
          Contrasena actualizada. Ya puedes entrar.
        </div>
      )}

      <form onSubmit={onSubmit} className="card mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="label">
            Correo
          </label>
          <input
            id="email"
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="password" className="label">
            Contrasena
          </label>
          <input
            id="password"
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
          {!loading && <ArrowRight size={16} />}
        </button>

        <div className="flex items-center justify-between text-sm text-fg-muted">
          <Link href="/olvide-password" className="hover:text-primary">
            Olvide mi contrasena
          </Link>
          <Link href="/registro" className="font-semibold text-primary">
            Crear cuenta
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
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

      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-20">
        <Suspense fallback={<p className="text-fg-muted">Cargando...</p>}>
          <LoginInner />
        </Suspense>
      </main>
    </div>
  );
}
