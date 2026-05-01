'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { api } from '@/lib/api';
import { saveSession } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('demo@manicuba.app');
  const [password, setPassword] = useState('manicuba123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await api<any>('/auth/login', {
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
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-bold text-rose-700">Entrar</h1>
      <p className="mt-2 text-rose-900/70">Accede a tu panel de manicuri.</p>

      <form onSubmit={onSubmit} className="card mt-8 space-y-4">
        <div>
          <label className="label">Correo</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Contrasena</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        <p className="text-sm text-rose-900/70">
          No tienes cuenta?{' '}
          <Link href="/registro" className="font-semibold text-rose-600">
            Crear cuenta
          </Link>
        </p>
      </form>
    </main>
  );
}
