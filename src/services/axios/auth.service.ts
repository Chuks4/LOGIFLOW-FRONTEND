import type { Permission, RoleName } from "@/lib/rbac";
import { normalizeRole } from "@/lib/rbac";
import {
  clearSession,
  readSession,
  saveSession,
  type Session,
} from "@/lib/session";
import { axiosClient } from "./client";

type AuthResponse = {
  accessToken?: string;
};

type PermissionResponse = {
  data?: string[];
};

type TokenPayload = {
  id: string
  exp?: number;
  roleId?: string;
  userType?: string;
};

function decodeToken(token: string): TokenPayload {
  const payload = token.split(".")[1];
  if (!payload) throw new Error("Invalid token");

  return JSON.parse(
    atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
  ) as TokenPayload;
}

function getAccessToken(response: AuthResponse) {
  if (!response.accessToken) {
    throw new Error("Invalid token");
  }
  return response.accessToken;
}

export async function login(email: string, password: string): Promise<Session> {
  const response = await axiosClient.post<AuthResponse>("/auth/login", {
    email,
    password,
  });
  const accessToken = getAccessToken(response.data);
  console.log("Login accessToken", accessToken);
  const payload = decodeToken(accessToken);
  const role = normalizeRole(payload.userType);

  if (!role || !payload.roleId) {
    throw new Error("Invalid credentials");
  }

  const permissionsResponse = await axiosClient.get<PermissionResponse>(
    `/permissions/role/${payload.roleId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const session: Session = {
    id: payload.id,
    accessToken,
    userType: role as RoleName,
    roleId: payload.roleId,
    permissions: (permissionsResponse.data.data ?? []) as Permission[],
  };
  saveSession(session);
  return session;
}

export async function register(data: Record<string, string>) {
  return axiosClient.post("/auth/register", data);
}

export async function verifyEmail(token: string) {
  return axiosClient.post("/auth/verify-email", { token });
}

export async function forgotPassword(email: string) {
  return axiosClient.post("/auth/forgot-password", { email });
}

export async function resetPassword(token: string, newPassword: string) {
  return axiosClient.post("/auth/reset-password", { token, newPassword });
}

export async function refreshAccessToken() {
  const response = await axiosClient.post<AuthResponse>("/auth/refresh-token");
  const accessToken = getAccessToken(response.data);
  const session = readSession();
  if (session) saveSession({ ...session, accessToken });
  return accessToken;
}

export async function getValidAccessToken() {
  const session = readSession();
  if (!session) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  if (tokenExpiresAt(session.accessToken) * 1000 <= Date.now()) {
    return refreshAccessToken();
  }

  return session.accessToken;
}

export function tokenExpiresAt(token: string) {
  return decodeToken(token).exp ?? 0;
}

export async function logout() {
  try {
    await axiosClient.post("/auth/logout");
  } finally {
    clearSession();
  }
}
