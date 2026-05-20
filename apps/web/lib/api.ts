export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

interface ApiOptions extends RequestInit {
  auth?: boolean;
  json?: unknown;
  _retry?: boolean;
}

const ACCESS = 'manicuba.accessToken';
const REFRESH = 'manicuba.refreshToken';

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACCESS);
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(REFRESH);
}

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshing) return refreshing;
  const token = getRefreshToken();
  if (!token) return null;
  refreshing = (async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: token }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { accessToken: string; refreshToken: string };
      window.localStorage.setItem(ACCESS, data.accessToken);
      window.localStorage.setItem(REFRESH, data.refreshToken);
      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

function extractMessage(text: string, status: number): string {
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed.message === 'string') return parsed.message;
    if (parsed.message?.message) return parsed.message.message;
    if (Array.isArray(parsed.message)) return parsed.message.join(', ');
  } catch {
    /* not JSON */
  }
  return `Error ${status}`;
}

async function rawFetch<T>(path: string, opts: ApiOptions): Promise<T> {
  const headers = new Headers(opts.headers);
  if (opts.auth !== false) {
    const token = getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  if (opts.json !== undefined) headers.set('Content-Type', 'application/json');

  const res = await fetch(`${API_URL}/api${path}`, {
    ...opts,
    headers,
    body: opts.json !== undefined ? JSON.stringify(opts.json) : opts.body,
    cache: 'no-store',
  });

  if (res.status === 401 && opts.auth !== false && !opts._retry) {
    const fresh = await refreshAccessToken();
    if (fresh) return rawFetch<T>(path, { ...opts, _retry: true });
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(ACCESS);
      window.localStorage.removeItem(REFRESH);
      window.localStorage.removeItem('manicuba.tenant');
      window.localStorage.removeItem('manicuba.user');
      const isPublic =
        window.location.pathname === '/' ||
        window.location.pathname.startsWith('/m/') ||
        window.location.pathname.startsWith('/r/') ||
        window.location.pathname.startsWith('/login') ||
        window.location.pathname.startsWith('/registro') ||
        window.location.pathname.startsWith('/olvide-password') ||
        window.location.pathname.startsWith('/reset-password');
      if (!isPublic) window.location.href = '/login';
    }
  }

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, extractMessage(text, res.status), text);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  return rawFetch<T>(path, opts);
}

export async function publicApi<T = unknown>(
  path: string,
  opts: ApiOptions = {},
): Promise<T> {
  return rawFetch<T>(path, { ...opts, auth: false });
}
