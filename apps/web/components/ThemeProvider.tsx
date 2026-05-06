'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const KEY = 'manicuba.theme';

interface Ctx {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}
const ThemeContext = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const stored = (typeof window !== 'undefined' &&
      (window.localStorage.getItem(KEY) as Theme | null)) || null;
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial: Theme = stored ?? (prefersDark ? 'dark' : 'light');
    apply(initial);
    setThemeState(initial);
  }, []);

  function apply(t: Theme) {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', t === 'dark');
  }

  function setTheme(t: Theme) {
    apply(t);
    setThemeState(t);
    if (typeof window !== 'undefined') window.localStorage.setItem(KEY, t);
  }

  return (
    <ThemeContext.Provider
      value={{ theme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark'), setTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): Ctx {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { theme: 'light', toggle: () => undefined, setTheme: () => undefined };
  return ctx;
}
