"use client";

type CacheEnvelope<T> = {
  savedAt: number;
  value: T;
};

export function readSessionCache<T>(key: string, maxAgeMs: number): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CacheEnvelope<T> | null;
    if (!parsed || typeof parsed.savedAt !== "number" || !("value" in parsed)) {
      window.sessionStorage.removeItem(key);
      return null;
    }

    if ((Date.now() - parsed.savedAt) > maxAgeMs) {
      window.sessionStorage.removeItem(key);
      return null;
    }

    return parsed.value;
  } catch {
    return null;
  }
}

export function writeSessionCache<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const envelope: CacheEnvelope<T> = {
      savedAt: Date.now(),
      value,
    };
    window.sessionStorage.setItem(key, JSON.stringify(envelope));
  } catch {
    // Ignore storage failures and fail open.
  }
}
