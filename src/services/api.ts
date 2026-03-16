import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 20000,
});

export type ApiMaybeSuccess<T> =
  | { status: "success"; message?: string; data: T }
  | { status: "error"; message?: string; data?: null }
  | { success: boolean; message?: string; data?: T; image_url?: string | null }
  | { error: string };

export function getErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "Request failed";

  const p = payload as Record<string, unknown>;

  if (typeof p.error === "string") return p.error;
  if (typeof p.message === "string") return p.message;

  return "Request failed";
}

export function ensureSuccess<T>(payload: ApiMaybeSuccess<T>): T {
  if ("status" in payload) {
    if (payload.status === "success") return payload.data;
    throw new Error(payload.message || "Request failed");
  }

  if ("success" in payload) {
    if (payload.success) {
      return (payload.data ?? payload) as T;
    }
    throw new Error(payload.message || "Request failed");
  }

  if ("error" in payload) {
    throw new Error(payload.error);
  }

  throw new Error("Unknown API response");
}