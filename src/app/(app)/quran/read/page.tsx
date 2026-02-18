import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AyahAudioPlayer } from "@/components/audio/ayah-audio-player";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import {
  filterAyahs,
  listJuzs,
  listSurahs,
  resolveCompactCursorAyah,
  type AyahFilters,
} from "@/hifzer/quran/lookup.server";
import { getSahihTranslationByAyahId } from "@/hifzer/quran/translation.server";
import { CompactReaderScroll } from "./compact-reader-scroll";
import { ReadProgressSync } from "./read-progress-sync";

type ReaderView = "list" | "compact";
const COMPACT_READER_ANCHOR = "compact-reader";

type SearchParamShape = {
  view?: string | string[];
  surah?: string | string[];
  juz?: string | string[];
  ayah?: string | string[];
  cursor?: string | string[];
  anon?: string | string[];
};

function readSingle(raw: string | string[] | undefined): string | null {
  if (Array.isArray(raw)) {
    return raw[0] ?? null;
  }
  return raw ?? null;
}

function parseBoundedInt(raw: string | string[] | undefined, min: number, max: number): number | undefined {
  const value = readSingle(raw);
  if (!value) {
    return undefined;
  }
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  if (parsed < min || parsed > max) {
    return undefined;
  }
  return parsed;
}

function parseView(raw: string | string[] | undefined): ReaderView {
  const value = readSingle(raw);
  return value === "compact" ? "compact" : "list";
}

function buildHref(filters: AyahFilters & { view?: ReaderView; cursor?: number; anonymous?: boolean }): string {
  const params = new URLSearchParams();
  if (filters.view) {
    params.set("view", filters.view);
  }
  if (filters.surahNumber != null) {
    params.set("surah", String(filters.surahNumber));
  }
  if (filters.juzNumber != null) {
    params.set("juz", String(filters.juzNumber));
  }
  if (filters.ayahId != null) {
    params.set("ayah", String(filters.ayahId));
  }
  if (filters.cursor != null) {
    params.set("cursor", String(filters.cursor));
  }
  if (filters.anonymous) {
    params.set("anon", "1");
  }

  const query = params.toString();
  return query ? `/quran/read?${query}` : "/quran/read";
}

export const metadata = {
  title: "Qur'an Reader",
};

export default async function QuranReaderPage(props: { searchParams: Promise<SearchParamShape> }) {
  const searchParams = await props.searchParams;
  const view = parseView(searchParams.view);
  const surahNumber = parseBoundedInt(searchParams.surah, 1, 114);
  const juzNumber = parseBoundedInt(searchParams.juz, 1, 30);
  const ayahId = parseBoundedInt(searchParams.ayah, 1, 6236);
  const cursorAyahId = parseBoundedInt(searchParams.cursor, 1, 6236);
  const anonymous = readSingle(searchParams.anon) === "1";

  const filters: AyahFilters = { surahNumber, juzNumber, ayahId };
  const ayahs = filterAyahs(filters);
  const compact = resolveCompactCursorAyah(ayahs, cursorAyahId);
  const surahs = listSurahs();
  const juzs = listJuzs();

  const baseQuery = { surahNumber, juzNumber, ayahId };
  const cursorForLinks = compact.current?.id ?? cursorAyahId;
  const listHref = buildHref({ ...baseQuery, view: "list", anonymous });
  const compactHref = `${
    buildHref({ ...baseQuery, view: "compact", cursor: cursorForLinks, anonymous })
  }#${COMPACT_READER_ANCHOR}`;
  const trackedHref = buildHref({ ...baseQuery, view, cursor: cursorForLinks, anonymous: false });
  const anonymousHref = buildHref({ ...baseQuery, view, cursor: cursorForLinks, anonymous: true });
  const clearHref = anonymous ? "/quran/read?anon=1" : "/quran/read";
  const syncAyah = !anonymous && view === "compact" ? compact.current : null;

  return (
    <div className="pb-12 pt-10 md:pb-16 md:pt-14">
      {syncAyah ? (
        <ReadProgressSync
          enabled
          surahNumber={syncAyah.surahNumber}
          ayahNumber={syncAyah.ayahNumber}
          ayahId={syncAyah.id}
        />
      ) : null}
      {view === "compact" && compact.current ? (
        <CompactReaderScroll targetId={COMPACT_READER_ANCHOR} ayahId={compact.current.id} />
      ) : null}

      <Link
        href="/quran"
        className="inline-flex items-center gap-2 rounded-full border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2 text-sm font-semibold text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)] hover:bg-white"
      >
        <ArrowLeft size={16} />
        Back
      </Link>

      <div className="mt-6">
        <Pill tone="neutral">Qur&apos;an Reader</Pill>
        <h1 className="mt-4 text-balance font-[family-name:var(--font-kw-display)] text-5xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)] sm:text-6xl">
          Read with filters + view modes.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--kw-muted)]">
          {anonymous
            ? "Anonymous window is active. Progress and streak events are not tracked."
            : "Tracking mode is active. Your compact reading position updates from what you read."}
        </p>
      </div>

      <Card className="mt-8">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={trackedHref}
            className={`rounded-full border px-3 py-2 text-sm font-semibold ${
              !anonymous
                ? "border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]"
                : "border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink)]"
            }`}
          >
            Tracking on
          </Link>
          <Link
            href={anonymousHref}
            className={`rounded-full border px-3 py-2 text-sm font-semibold ${
              anonymous
                ? "border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]"
                : "border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink)]"
            }`}
          >
            Anonymous window
          </Link>
          <Link
            href={listHref}
            className={`rounded-full border px-3 py-2 text-sm font-semibold ${
              view === "list"
                ? "border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]"
                : "border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink)]"
            }`}
          >
            List view
          </Link>
          <Link
            href={compactHref}
            className={`rounded-full border px-3 py-2 text-sm font-semibold ${
              view === "compact"
                ? "border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]"
                : "border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink)]"
            }`}
          >
            Compact view
          </Link>
        </div>

        <form className="mt-4 grid gap-3 md:grid-cols-4" method="get" action="/quran/read">
          <input type="hidden" name="view" value={view} />
          {anonymous ? <input type="hidden" name="anon" value="1" /> : null}
          <label className="text-sm text-[color:var(--kw-muted)]">
            Surah
            <select
              name="surah"
              defaultValue={surahNumber != null ? String(surahNumber) : ""}
              className="mt-1 h-10 w-full rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 text-sm text-[color:var(--kw-ink)]"
            >
              <option value="">All surahs</option>
              {surahs.map((surah) => (
                <option key={surah.surahNumber} value={surah.surahNumber}>
                  {surah.surahNumber} - {surah.nameTransliteration}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-[color:var(--kw-muted)]">
            Juz
            <select
              name="juz"
              defaultValue={juzNumber != null ? String(juzNumber) : ""}
              className="mt-1 h-10 w-full rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 text-sm text-[color:var(--kw-ink)]"
            >
              <option value="">All juz</option>
              {juzs.map((juz) => (
                <option key={juz.juzNumber} value={juz.juzNumber}>
                  Juz {juz.juzNumber}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-[color:var(--kw-muted)]">
            Ayah (global id)
            <input
              type="number"
              name="ayah"
              min={1}
              max={6236}
              defaultValue={ayahId != null ? String(ayahId) : ""}
              placeholder="1 - 6236"
              className="mt-1 h-10 w-full rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 text-sm text-[color:var(--kw-ink)]"
            />
          </label>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="h-10 rounded-xl border border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] px-4 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]"
            >
              Apply filters
            </button>
            <Link
              href={clearHref}
              className="h-10 rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-2 text-sm font-semibold text-[color:var(--kw-ink)]"
            >
              Clear
            </Link>
          </div>
        </form>
      </Card>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Pill tone="neutral">{ayahs.length} ayahs matched</Pill>
        <Pill tone={anonymous ? "warn" : "accent"}>{anonymous ? "Anonymous mode" : "Tracking mode"}</Pill>
        {surahNumber != null ? <Pill tone="accent">Surah {surahNumber}</Pill> : null}
        {juzNumber != null ? <Pill tone="accent">Juz {juzNumber}</Pill> : null}
        {ayahId != null ? <Pill tone="accent">Ayah #{ayahId}</Pill> : null}
      </div>

      {ayahs.length < 1 ? (
        <Card className="mt-8">
          <Pill tone="warn">No results</Pill>
          <p className="mt-3 text-sm text-[color:var(--kw-muted)]">
            No ayahs matched this filter combination. Try clearing one or more filters.
          </p>
          <div className="mt-4">
            <Link href={clearHref} className="text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)] hover:underline">
              Clear all filters
            </Link>
          </div>
        </Card>
      ) : null}

      {ayahs.length > 0 && view === "list" ? (
        <div className="mt-8 space-y-3">
          {ayahs.map((ayah) => (
            <Card key={ayah.id} className="py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-[color:var(--kw-border-2)] bg-white/70 px-2.5 py-1 text-xs font-semibold text-[color:var(--kw-muted)]">
                    {ayah.surahNumber}:{ayah.ayahNumber}
                  </span>
                  <span className="text-xs text-[color:var(--kw-faint)]">#{ayah.id}</span>
                </div>
                <div className="w-full sm:w-auto">
                  <AyahAudioPlayer ayahId={ayah.id} streakTrackSource={anonymous ? undefined : "quran_browse"} />
                </div>
              </div>

              <div dir="rtl" className="mt-4 text-right text-2xl leading-[2.1] text-[color:var(--kw-ink)]">
                {ayah.textUthmani}
              </div>
              <p dir="ltr" className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
                {getSahihTranslationByAyahId(ayah.id) ?? "Translation unavailable"}
              </p>
            </Card>
          ))}
        </div>
      ) : null}

      {ayahs.length > 0 && view === "compact" && compact.current ? (
        <div id={COMPACT_READER_ANCHOR} className="mt-8">
          <Card className="py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-[color:var(--kw-border-2)] bg-white/70 px-2.5 py-1 text-xs font-semibold text-[color:var(--kw-muted)]">
                  {compact.current.surahNumber}:{compact.current.ayahNumber}
                </span>
                <span className="text-xs text-[color:var(--kw-faint)]">#{compact.current.id}</span>
                <span className="text-xs text-[color:var(--kw-faint)]">
                  {compact.index + 1} / {ayahs.length}
                </span>
              </div>
              <div className="w-full sm:w-auto">
                <AyahAudioPlayer
                  ayahId={compact.current.id}
                  streakTrackSource={anonymous ? undefined : "quran_browse"}
                />
              </div>
            </div>

            <div dir="rtl" className="mt-4 text-right text-2xl leading-[2.1] text-[color:var(--kw-ink)]">
              {compact.current.textUthmani}
            </div>
            <p dir="ltr" className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
              {getSahihTranslationByAyahId(compact.current.id) ?? "Translation unavailable"}
            </p>

            <div className="mt-6 flex items-center gap-2">
              {compact.prevAyahId ? (
                <Link
                  href={`${buildHref({
                    ...baseQuery,
                    view: "compact",
                    cursor: compact.prevAyahId,
                    anonymous,
                  })}#${COMPACT_READER_ANCHOR}`}
                  scroll={false}
                  className="rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2 text-sm font-semibold text-[color:var(--kw-ink)]"
                >
                  Previous
                </Link>
              ) : (
                <span className="rounded-xl border border-[color:var(--kw-border-2)] bg-white/50 px-3 py-2 text-sm font-semibold text-[color:var(--kw-faint)]">
                  Previous
                </span>
              )}

              {compact.nextAyahId ? (
                <Link
                  href={`${buildHref({
                    ...baseQuery,
                    view: "compact",
                    cursor: compact.nextAyahId,
                    anonymous,
                  })}#${COMPACT_READER_ANCHOR}`}
                  scroll={false}
                  className="rounded-xl border border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] px-3 py-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]"
                >
                  Next
                </Link>
              ) : (
                <span className="rounded-xl border border-[color:var(--kw-border-2)] bg-white/50 px-3 py-2 text-sm font-semibold text-[color:var(--kw-faint)]">
                  Next
                </span>
              )}
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
