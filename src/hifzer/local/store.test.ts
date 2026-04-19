import { afterEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS, syncLocalStateOwner } from "./store";

function installLocalStorage() {
  const values = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  };

  vi.stubGlobal("window", { localStorage });
  return values;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("local/store account scoping", () => {
  it("clears user-scoped onboarding state when the signed-in account changes", () => {
    const values = installLocalStorage();
    values.set(STORAGE_KEYS.localStateOwner, "user_old");
    values.set(STORAGE_KEYS.onboardingAssessment, "{}");
    values.set(STORAGE_KEYS.dashboardFirstRunGuide, "dismissed");
    values.set(STORAGE_KEYS.hifzCursorAyahId, "42");
    values.set(STORAGE_KEYS.cutoverApplied, "1");

    syncLocalStateOwner("user_new");

    expect(values.get(STORAGE_KEYS.localStateOwner)).toBe("user_new");
    expect(values.has(STORAGE_KEYS.onboardingAssessment)).toBe(false);
    expect(values.has(STORAGE_KEYS.dashboardFirstRunGuide)).toBe(false);
    expect(values.has(STORAGE_KEYS.hifzCursorAyahId)).toBe(false);
    expect(values.get(STORAGE_KEYS.cutoverApplied)).toBe("1");
  });
});
