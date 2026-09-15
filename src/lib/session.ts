import type { Permission, RoleName } from "./rbac";

export type Session = {
  accessToken: string;
  userType: RoleName;
  roleId: string;
  permissions: Permission[];
};

const SESSION_KEY = "logiflow.session";

export function readSession(): Session | null {
  if (typeof window === "undefined") return null;

  const value = window.localStorage.getItem(SESSION_KEY);
  if (!value) return null;

  try {
    const session = JSON.parse(value) as Session;
    if (!session.accessToken || !session.userType || !session.roleId)
      return null;
    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
}

export function saveSession(session: Session) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
