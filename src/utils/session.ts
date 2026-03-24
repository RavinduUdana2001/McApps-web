import type { AuthUser } from "../types/auth";

const SESSION_KEY = "mcapps_session";

type StoredSession = {
  user: AuthUser;
};

export function saveSession(user: AuthUser) {
  const payload: StoredSession = {
    user,
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
}

export function getSession(): AuthUser | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredSession & { expiresAt?: number };

    if (!parsed?.user) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    if ("expiresAt" in parsed) {
      saveSession(parsed.user);
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
