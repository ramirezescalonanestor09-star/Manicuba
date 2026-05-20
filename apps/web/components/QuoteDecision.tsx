'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { publicApi } from '@/lib/api';

export function QuoteDecision({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: 'ACCEPT' | 'REJECT') {
    setLoading(true);
    setError(null);
    try {
      await publicApi(`/public/requests/${token}/decision`, {
        method: 'POST',
        json: { decision },
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
      <button
        type="button"
        className="btn-primary flex-1"
        disabled={loading}
        onClick={() => decide('ACCEPT')}
      >
        Aceptar y reservar
      </button>
      <button
        type="button"
        className="btn-ghost flex-1"
        disabled={loading}
        onClick={() => decide('REJECT')}
      >
        Rechazar
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
