'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function OlvidePasswordPage() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api('/auth/forgot-password', { method: 'POST', json: { email }, auth: false });
    } finally {
      setDone(true);
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-bold text-rose-700">Restablecer contrasena</h1>
      {done ? (
        <p className="mt-6 card">
          Si ese correo existe, te enviamos un enlace para restablecer tu contrasena. Revisa tu
          bandeja (vence en 1 hora).
        </p>
      ) : (
        <form onSubmit={onSubmit} className="card mt-8 space-y-4">
          <div>
            <label className="label">Tu correo</label>
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar enlace'}
          </button>
          <p className="text-sm text-rose-900/70">
            <Link href="/login" className="text-rose-600">
              ← Volver a entrar
            </Link>
          </p>
        </form>
      )}
    </main>
  );
}
