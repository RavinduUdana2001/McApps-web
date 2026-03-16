import type { AuthUser } from "../types/auth";

const SESSION_KEY = "mcapps_session";

type StoredSession = {
  user: AuthUser;
  expiresAt: number;
};

const NINETY_DAYS_MS = 1000 * 60 * 60 * 24 * 90;

export function saveSession(user: AuthUser) {
  const payload: StoredSession = {
    user,
    expiresAt: Date.now() + NINETY_DAYS_MS,
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
}

export function getSession(): AuthUser | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredSession;

    if (!parsed?.user || !parsed?.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    return parsed.user;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function isLoggedIn() {
  return !!getSession();
}