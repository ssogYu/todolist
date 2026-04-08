"use client";

import type { AuthResponse } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";

const TOKEN_STORAGE_KEY = "spring-todo-token";
const TOKEN_COOKIE_KEY = "auth-token";
const ONE_WEEK_SECONDS = 60 * 60 * 24 * 7;

export function readStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function persistToken(token: string) {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  document.cookie = `${TOKEN_COOKIE_KEY}=${token}; path=/; max-age=${ONE_WEEK_SECONDS}; SameSite=Lax`;
}

export function clearStoredToken() {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  document.cookie = `${TOKEN_COOKIE_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

export async function apiFetch<T>(input: string, init: RequestInit = {}) {
  const token = useAuthStore.getState().token ?? readStoredToken();
  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | { message?: string }
    | null;

  if (response.status === 401) {
    clearStoredToken();
    useAuthStore.getState().clearSession();
  }

  if (!response.ok) {
    throw new Error(payload?.message ?? "请求失败");
  }

  return payload as T;
}

export function applyAuthResponse(response: AuthResponse) {
  persistToken(response.token);
  useAuthStore.getState().setSession(response);
}
