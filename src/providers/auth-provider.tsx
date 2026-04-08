"use client";

import { useEffect } from "react";

import { apiFetch, clearStoredToken, readStoredToken } from "@/lib/api-client";
import type { UserSummary } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setSession = useAuthStore((state) => state.setSession);
  const setGuest = useAuthStore((state) => state.setGuest);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    const token = readStoredToken();

    if (!token) {
      setGuest();
      return;
    }

    let active = true;

    setLoading();

    apiFetch<UserSummary>("/api/me")
      .then((user) => {
        if (!active) {
          return;
        }

        setSession({ token, user });
      })
      .catch(() => {
        if (!active) {
          return;
        }

        clearStoredToken();
        setGuest();
      });

    return () => {
      active = false;
    };
  }, [setGuest, setLoading, setSession]);

  return children;
}
