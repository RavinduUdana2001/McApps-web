import { api } from "./api";
import type { AuthUser, LoginErrorResponse, LoginPayload } from "../types/auth";

export async function ldapLogin(payload: LoginPayload): Promise<AuthUser> {
  const response = await api.post<AuthUser | LoginErrorResponse>(
    "/auth/ldap_login",
    payload
  );

  const data = response.data;

  // API can return 200 with { error: "..." }
  if ("error" in data) {
    throw new Error(data.error || "Login failed");
  }

  return data;
}