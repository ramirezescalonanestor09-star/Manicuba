export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

interface ApiOptions extends RequestInit {
  auth?: boolean;
  json?: unknown;
}

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('manicuba.accessToken');
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const headers = new Headers(opts.headers);
  if (opts.auth !== false) {
    const token = getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  if (opts.json !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_URL}/api${path}`, {
    ...opts,
    headers,
    body: opts.json !== undefined ? JSON.stringify(opts.json) : opts.body,
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    let message = `Error ${res.status}`;
    try {
      const parsed = JSON.parse(text);
      message = parsed.message?.message ?? parsed.message ?? message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function publicApi<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  return api<T>(path, { ...opts, auth: false });
}
