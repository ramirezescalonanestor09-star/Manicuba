'use client';

import { useState } from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-rose-100/70 ${className}`}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  cta,
}: {
  title: string;
  description?: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-rose-200 bg-white/70 p-8 text-center">
      <p className="font-semibold text-rose-700">{title}</p>
      {description && <p className="mt-1 text-sm text-rose-900/60">{description}</p>}
      {cta && <div className="mt-3">{cta}</div>}
    </div>
  );
}

export function useConfirm() {
  const [pending, setPending] = useState<{
    message: string;
    resolve: (ok: boolean) => void;
  } | null>(null);

  function confirm(message: string): Promise<boolean> {
    return new Promise((resolve) => setPending({ message, resolve }));
  }

  const dialog = pending ? (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="card max-w-sm w-full">
        <p className="text-rose-900">{pending.message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            className="btn-ghost"
            onClick={() => {
              pending.resolve(false);
              setPending(null);
            }}
          >
            Cancelar
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              pending.resolve(true);
              setPending(null);
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, dialog };
}
