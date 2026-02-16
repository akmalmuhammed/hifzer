"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { DEMO } from "@/demo/data";
import type { DemoUser, ID } from "@/demo/types";

const STORAGE_KEY = "kw_demo_user_v1";

type DemoAuthStatus = "signed_out" | "signed_in";

type DemoAuthContextValue = {
  status: DemoAuthStatus;
  user: DemoUser | null;
  signInAs: (userId: ID) => void;
  signOut: () => void;
};

const DemoAuthContext = createContext<DemoAuthContextValue | undefined>(undefined);

function readStoredUserId(): ID | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw && raw.trim().length > 0 ? raw : null;
}

function writeStoredUserId(userId: ID | null): void {
  if (typeof window === "undefined") {
    return;
  }
  if (!userId) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, userId);
}

export function DemoAuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<ID | null>(() => readStoredUserId());

  const user = useMemo(() => {
    if (!userId) {
      return null;
    }
    return DEMO.users.find((u) => u.id === userId) ?? null;
  }, [userId]);

  const value = useMemo<DemoAuthContextValue>(
    () => ({
      status: user ? "signed_in" : "signed_out",
      user,
      signInAs: (nextUserId) => {
        setUserId(nextUserId);
        writeStoredUserId(nextUserId);
      },
      signOut: () => {
        setUserId(null);
        writeStoredUserId(null);
      },
    }),
    [user],
  );

  return <DemoAuthContext.Provider value={value}>{children}</DemoAuthContext.Provider>;
}

export function useDemoAuth(): DemoAuthContextValue {
  const ctx = useContext(DemoAuthContext);
  if (!ctx) {
    throw new Error("useDemoAuth must be used within DemoAuthProvider");
  }
  return ctx;
}

