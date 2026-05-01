'use client';

const ACCESS = 'manicuba.accessToken';
const REFRESH = 'manicuba.refreshToken';
const TENANT = 'manicuba.tenant';
const USER = 'manicuba.user';

export interface Session {
  accessToken: string;
  refreshToken: string;
  tenant: { id: string; slug: string; businessName: string };
  user: { id: string; email: string; name: string; role: string };
}

export function saveSession(session: {
  tokens: { accessToken: string; refreshToken: string };
  tenant: Session['tenant'];
  user: Session['user'];
}) {
  window.localStorage.setItem(ACCESS, session.tokens.accessToken);
  window.localStorage.setItem(REFRESH, session.tokens.refreshToken);
  window.localStorage.setItem(TENANT, JSON.stringify(session.tenant));
  window.localStorage.setItem(USER, JSON.stringify(session.user));
}

export function loadSession(): Session | null {
  if (typeof window === 'undefined') return null;
  const accessToken = window.localStorage.getItem(ACCESS);
  const refreshToken = window.localStorage.getItem(REFRESH);
  const tenantRaw = window.localStorage.getItem(TENANT);
  const userRaw = window.localStorage.getItem(USER);
  if (!accessToken || !refreshToken || !tenantRaw || !userRaw) return null;
  return {
    accessToken,
    refreshToken,
    tenant: JSON.parse(tenantRaw),
    user: JSON.parse(userRaw),
  };
}

export function clearSession() {
  window.localStorage.removeItem(ACCESS);
  window.localStorage.removeItem(REFRESH);
  window.localStorage.removeItem(TENANT);
  window.localStorage.removeItem(USER);
}
