'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

type Variant = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  message: string;
  variant: Variant;
}

interface ToastContextValue {
  show: (message: string, variant?: Variant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const show = useCallback((message: string, variant: Variant = 'info') => {
    const id = ++idRef.current;
    setItems((curr) => [...curr, { id, message, variant }]);
    setTimeout(() => {
      setItems((curr) => curr.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const value: ToastContextValue = {
    show,
    success: (m) => show(m, 'success'),
    error: (m) => show(m, 'error'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-3">
        {items.map((t) => (
          <div
            key={t.id}
            className={
              'pointer-events-auto rounded-2xl px-4 py-3 text-sm shadow-lg ' +
              (t.variant === 'success'
                ? 'bg-emerald-500 text-white'
                : t.variant === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-rose-700 text-white')
            }
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      show: () => undefined,
      success: () => undefined,
      error: () => undefined,
    };
  }
  return ctx;
}

export function useToastEffect(message: string | null, variant: Variant = 'error') {
  const toast = useToast();
  useEffect(() => {
    if (message) toast.show(message, variant);
  }, [message, variant, toast]);
}
