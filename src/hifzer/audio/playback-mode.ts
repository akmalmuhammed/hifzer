export type AudioPlaybackMode = "auto" | "local_only" | "quran_foundation_first";

export const AUDIO_PLAYBACK_MODE_STORAGE_KEY = "hifzer_audio_playback_mode_v1";

export const AUDIO_PLAYBACK_MODE_OPTIONS: Array<{
  id: AudioPlaybackMode;
  label: string;
  description: string;
}> = [
  {
    id: "auto",
    label: "Auto",
    description: "Use Hifzer local audio first, then fall back to Quran.com when needed.",
  },
  {
    id: "local_only",
    label: "Local only",
    description: "Stay on the local Hifzer audio library and do not fetch Quran.com as fallback.",
  },
  {
    id: "quran_foundation_first",
    label: "Quran.com first",
    description: "Prefer official Quran.com audio when it is available, then fall back to local audio.",
  },
];

export function normalizeAudioPlaybackMode(value: string | null | undefined): AudioPlaybackMode {
  if (value === "local_only" || value === "quran_foundation_first") {
    return value;
  }
  return "auto";
}

export function readPersistedAudioPlaybackMode(): AudioPlaybackMode {
  if (typeof window === "undefined") {
    return "auto";
  }
  try {
    return normalizeAudioPlaybackMode(window.localStorage.getItem(AUDIO_PLAYBACK_MODE_STORAGE_KEY));
  } catch {
    return "auto";
  }
}

export function persistAudioPlaybackMode(mode: AudioPlaybackMode): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(AUDIO_PLAYBACK_MODE_STORAGE_KEY, mode);
  } catch {
    // Ignore storage failures in private mode / quota-limited browsers.
  }
}
