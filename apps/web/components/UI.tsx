'use client';

import { useState } from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-surface-2 ${className}`} aria-hidden="true" />
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
    <div className="rounded-3xl border-2 border-dashed border-border-strong bg-surface/60 p-10 text-center">
      <p className="font-semibold">{title}</p>
      {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
      {cta && <div className="mt-4">{cta}</div>}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-sm">
        <p>{pending.message}</p>
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
