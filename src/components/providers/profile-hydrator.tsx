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
} from "@/hifzer/local/store";
import type { ProfileSnapshot } from "@/hifzer/profile/server";
import { normalizeAccentPreset, normalizeThemePreset } from "@/hifzer/theme/preferences";

export function ProfileHydrator(props: { profile: ProfileSnapshot | null }) {
  const { setMode, setTheme, setAccent } = useTheme();

  useEffect(() => {
    applyFreshStartBridge();

    const profile = props.profile;
    if (!profile) {
      return;
    }

    syncLocalStateOwner(profile.clerkUserId);
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
  }, [props.profile, setAccent, setMode, setTheme]);

  return null;
}
