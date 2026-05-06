'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

export default function ResetPasswordPage() {
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
      <main className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-red-600">Token invalido o vencido.</p>
        <Link href="/olvide-password" className="mt-4 inline-block text-primary">
          Pedir un nuevo enlace
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-bold text-primary">Nueva contrasena</h1>
      <form onSubmit={onSubmit} className="card mt-8 space-y-4">
        <div>
          <label className="label">Contrasena</label>
          <input
            className="input"
            type="password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Confirma</label>
          <input
            className="input"
            type="password"
            minLength={8}
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
    </main>
  );
}
