export type ReciterId = string;

function normalizeBaseUrl(raw: string): string {
  return raw.replace(/\/+$/, "");
}

export function audioBaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_HIFZER_AUDIO_BASE_URL;
  if (!raw) {
    return null;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  return normalizeBaseUrl(trimmed);
}

export function audioUrl(reciterId: ReciterId, ayahId: number): string | null {
  const base = audioBaseUrl();
  if (!base) {
    return null;
  }
  const safeReciter = String(reciterId || "default").trim() || "default";
  const id = Number(ayahId);
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }
  // Placeholder convention until final R2 layout is provided:
  // {base}/{reciterId}/{ayahId}.mp3
  return `${base}/${encodeURIComponent(safeReciter)}/${id}.mp3`;
}

