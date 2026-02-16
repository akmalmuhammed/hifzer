"use client";

import { useEffect } from "react";
import { useTheme, type AccentPreset, type ThemePreset } from "@/components/providers/theme-provider";
import { setActiveSurahCursor, setOnboardingCompleted } from "@/hifzer/local/store";
import type { ProfileSnapshot } from "@/hifzer/profile/server";

const VALID_THEMES = new Set<ThemePreset>(["standard", "paper"]);
const VALID_ACCENTS = new Set<AccentPreset>(["teal", "cobalt", "ember"]);

export function ProfileHydrator(props: { profile: ProfileSnapshot | null }) {
  const { setMode, setTheme, setAccent } = useTheme();

  useEffect(() => {
    const profile = props.profile;
    if (!profile) {
      return;
    }

    setActiveSurahCursor(profile.activeSurahNumber, profile.cursorAyahId);
    if (profile.onboardingCompleted) {
      setOnboardingCompleted();
    }

    setMode(profile.darkMode ? "dark" : "light");

    const theme = (VALID_THEMES.has(profile.themePreset as ThemePreset)
      ? (profile.themePreset as ThemePreset)
      : "standard") as ThemePreset;
    const accent = (VALID_ACCENTS.has(profile.accentPreset as AccentPreset)
      ? (profile.accentPreset as AccentPreset)
      : "teal") as AccentPreset;
    setTheme(theme);
    setAccent(accent);
  }, [props.profile, setAccent, setMode, setTheme]);

  return null;
}
