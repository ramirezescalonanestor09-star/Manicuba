'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';

import { api } from '@/lib/api';
import { ThemeToggle } from '@/components/ThemeToggle';

function ResetInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Las contrasenas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await api('/auth/reset-password', {
        method: 'POST',
        json: { token, password },
        auth: false,
      });
      router.replace('/login?reset=1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="card text-center">
        <p className="text-red-600 dark:text-red-400">Token invalido o vencido.</p>
        <Link href="/olvide-password" className="mt-4 inline-block text-primary">
          Pedir un nuevo enlace
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-4xl font-bold tracking-tight">
        <span className="heading-grad">Nueva contrasena</span>
      </h1>
      <p className="mt-2 text-fg-soft">Elige una de al menos 8 caracteres.</p>

      <form onSubmit={onSubmit} className="card mt-6 space-y-4">
        <div>
          <label htmlFor="new-password" className="label">
            Contrasena
          </label>
          <input
            id="new-password"
            className="input"
            type="password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div>
          <label htmlFor="confirm-password" className="label">
            Confirma
          </label>
          <input
            id="confirm-password"
            className="input"
            type="password"
            minLength={8}
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        )}
        <button className="btn-primary w-full justify-center" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar'}
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
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
          <ResetInner />
        </Suspense>
      </main>
    </div>
  );
}
