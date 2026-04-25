import { authStore } from "../stores/auth.store";

export type ApiError = {
  status: number;
  message: string;
};

const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = authStore.getState().accessToken;
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${baseUrl}${path}`, { ...init, headers });
  if (res.ok) return (await res.json()) as T;

  let message = `HTTP ${res.status}`;
  try {
    const body = (await res.json()) as { detail?: string };
    if (body?.detail) message = body.detail;
  } catch {
    // ignore
  }
  throw { status: res.status, message } satisfies ApiError;
}

