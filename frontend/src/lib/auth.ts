import type { LoginData } from "./api";

const SESSION_KEY = "sertos_auth_session";

export type AuthSession = LoginData;

export function getSession(): AuthSession | null {
  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as AuthSession;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function saveSession(session: AuthSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem("sertos_access_token", session.access);
  localStorage.setItem("sertos_refresh_token", session.refresh);
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem("sertos_access_token");
  localStorage.removeItem("sertos_refresh_token");
}
