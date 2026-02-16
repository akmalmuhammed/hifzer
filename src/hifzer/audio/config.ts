export type ReciterId = string;

const DEFAULT_PUBLIC_RECITER = "alafasy";
const DEFAULT_AYAH_ID_WIDTH = 6;

function normalizeBaseUrl(raw: string): string {
  return raw.replace(/\/+$/, "");
}

function resolvedDefaultReciter(): string {
  const raw = process.env.NEXT_PUBLIC_HIFZER_DEFAULT_RECITER_ID;
  const trimmed = String(raw ?? "").trim();
  return trimmed || DEFAULT_PUBLIC_RECITER;
}

function resolvedReciterId(reciterId: ReciterId): string {
  const safe = String(reciterId || "default").trim() || "default";
  if (safe === "default") {
    return resolvedDefaultReciter();
  }
  return safe;
}

function resolvedAyahIdWidth(): number {
  const raw = Number(process.env.NEXT_PUBLIC_HIFZER_AUDIO_AYAH_ID_WIDTH ?? DEFAULT_AYAH_ID_WIDTH);
  if (!Number.isFinite(raw)) {
    return DEFAULT_AYAH_ID_WIDTH;
  }
  return Math.max(1, Math.floor(raw));
}

function formatAyahFileId(ayahId: number): string {
  const width = resolvedAyahIdWidth();
  return String(ayahId).padStart(width, "0");
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
  const safeReciter = resolvedReciterId(reciterId);
  const id = Number(ayahId);
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }
  const fileId = formatAyahFileId(id);
  // Current R2 convention:
  // {base}/{reciterId}/{zero-padded-ayahId}.mp3
  // Example: /alafasy/000001.mp3
  return `${base}/${encodeURIComponent(safeReciter)}/${fileId}.mp3`;
}
