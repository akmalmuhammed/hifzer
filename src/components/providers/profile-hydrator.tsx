"use client";

import { useEffect } from "react";
import { useTheme } from "@/components/providers/theme-provider";
import {
  applyFreshStartBridge,
  clearOnboardingCompleted,
  clearOnboardingStartLane,
  setHifzActiveSurahCursor,
  setOnboardingCompleted,
  setOnboardingStartLane,
  setQuranActiveSurahCursor,
  syncLocalStateOwner,
  type LocalStateOwnerResolution,
} from "@/hifzer/local/store";
import type { ProfileSnapshot } from "@/hifzer/profile/server";
import { normalizeAccentPreset, normalizeThemePreset } from "@/hifzer/theme/preferences";

export type ProfileHydrationState =
  | { status: "unresolved" }
  | { status: "signed-out" }
  | { status: "signed-in"; profile: ProfileSnapshot };

type ProfileHydratorProps =
  | { state: ProfileHydrationState; profile?: never }
  | { profile: ProfileSnapshot | null; state?: never };

export function ProfileHydrator(props: ProfileHydratorProps) {
  const { setMode, setTheme, setAccent } = useTheme();
  // The profile prop is retained for server-rendered onboarding callers. A
  // null profile there is not proof of sign-out: it can also mean the profile
  // store is unavailable, so it intentionally maps to unresolved.
  const status = props.state?.status ?? (props.profile ? "signed-in" : "unresolved");
  const profile = props.state?.status === "signed-in"
    ? props.state.profile
    : props.profile ?? null;

  useEffect(() => {
    if (status === "unresolved") {
      return;
    }

    let cancelled = false;
    const identity: LocalStateOwnerResolution = status === "signed-out"
      ? { status: "signed-out" }
      : profile
        ? { status: "signed-in", clerkUserId: profile.clerkUserId }
        : { status: "unresolved" };
    void (async () => {
      const ownerReady = await syncLocalStateOwner(identity);
      if (cancelled || !profile || !ownerReady) {
        return;
      }

      applyFreshStartBridge();
      setHifzActiveSurahCursor(profile.activeSurahNumber, profile.cursorAyahId);
      setQuranActiveSurahCursor(profile.quranActiveSurahNumber, profile.quranCursorAyahId);
      if (profile.onboardingCompleted) {
        setOnboardingCompleted();
      } else {
        clearOnboardingCompleted();
      }
      if (profile.onboardingStartLane) {
        setOnboardingStartLane(profile.onboardingStartLane);
      } else {
        clearOnboardingStartLane();
      }

      setMode(profile.darkMode ? "dark" : "light");

      const theme = normalizeThemePreset(profile.themePreset);
      const accent = normalizeAccentPreset(profile.accentPreset);
      setTheme(theme);
      setAccent(accent);
    })();

    return () => {
      cancelled = true;
    };
  }, [profile, setAccent, setMode, setTheme, status]);

  return null;
}
