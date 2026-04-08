"use client";

import { create } from "zustand";

import type { UserSummary } from "@/lib/types";

type AuthStatus = "loading" | "authenticated" | "guest";

type AuthState = {
  token: string | null;
  user: UserSummary | null;
  status: AuthStatus;
  setSession: (payload: { token: string; user: UserSummary }) => void;
  setGuest: () => void;
  setLoading: () => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  status: "loading",
  setSession: ({ token, user }) =>
    set({
      token,
      user,
      status: "authenticated",
    }),
  setGuest: () =>
    set({
      token: null,
      user: null,
      status: "guest",
    }),
  setLoading: () =>
    set((state) => ({
      ...state,
      status: "loading",
    })),
  clearSession: () =>
    set({
      token: null,
      user: null,
      status: "guest",
    }),
}));
