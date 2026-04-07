import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AyahAudioPlayer } from "@/components/audio/ayah-audio-player";
import { SupportTextPanel } from "@/components/quran/support-text-panel";
import { QuranViewportProgressTracker } from "@/components/quran/quran-viewport-progress-tracker";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { getDistractionFreeServer } from "@/hifzer/focus/server";
import { getProfileSnapshot } from "@/hifzer/profile/server";
import { getQuranFoundationConnectionStatus } from "@/hifzer/quran-foundation/server";
import {
  filterAyahs,
  getSurahInfo,
  listSurahs,
  resolveCompactCursorAyah,
  type AyahFilters,
} from "@/hifzer/quran/lookup.server";
import {
  DEFAULT_QURAN_TRANSLATION_ID,
  QURAN_TRANSLATION_OPTIONS,
  normalizeQuranTranslationId,
  QURAN_TRANSLATION_COOKIE,
} from "@/hifzer/quran/translation-prefs";
import { getReaderUiCopy } from "@/hifzer/quran/reader-ui-copy";
import { getPhoneticByAyahId, getQuranTranslationByAyahId } from "@/hifzer/quran/translation.server";
import { clerkEnabled } from "@/lib/clerk-config";
import { CompactReaderScroll } from "./compact-reader-scroll";
import { CompactReaderClient } from "./compact-reader-client";
import { QuranFoundationFilterAction } from "./quran-foundation-filter-action";
import { ReaderPreferencesControls } from "./reader-preferences-controls";

type ReaderView = "list" | "compact";
const COMPACT_READER_ANCHOR = "compact-reader";
const LIST_PAGE_SIZE = 40;
const QURAN_AUDIO_SPEED_PREF_KEY = "hifzer_quran_audio_speed_v1";

type SearchParamShape = {
  view?: string | string[];
  surah?: string | string[];
  ayah?: string | string[];
  cursor?: string | string[];
  page?: string | string[];
  anon?: string | string[];
  phonetic?: string | string[];
  translation?: string | string[];
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

function parseVisibility(raw: string | string[] | undefined, fallback: boolean): boolean {
  const value = readSingle(raw);
  if (value === "1") {
    return true;
  }
  if (value === "0") {
    return false;
  }
  return fallback;
}

function buildHref(filters: AyahFilters & {
  view?: ReaderView;
  cursor?: number;
  page?: number;
  anonymous?: boolean;
  showPhonetic?: boolean;
  showTranslation?: boolean;
}): string {
  const params = new URLSearchParams();
  if (filters.view) {
    params.set("view", filters.view);
  }
  if (filters.surahNumber != null) {
    params.set("surah", String(filters.surahNumber));
  }
  if (filters.ayahId != null) {
    params.set("ayah", String(filters.ayahId));
  }
  if (filters.cursor != null) {
    params.set("cursor", String(filters.cursor));
  }
  if (filters.page != null && filters.page > 1) {
    params.set("page", String(filters.page));
  }
  if (filters.anonymous) {
    params.set("anon", "1");
  }
  if (typeof filters.showPhonetic === "boolean") {
    params.set("phonetic", filters.showPhonetic ? "1" : "0");
  }
  if (typeof filters.showTranslation === "boolean") {
    params.set("translation", filters.showTranslation ? "1" : "0");
  }

  const query = params.toString();
  return query ? `/quran/read?${query}` : "/quran/read";
}

export const metadata = {
  title: "Qur'an Reader",
};

export default async function QuranReaderPage(props: { searchParams: Promise<SearchParamShape> }) {
  const searchParams = await props.searchParams;
  const cookieStore = await cookies();
  const authEnabled = clerkEnabled();
  const userId = authEnabled ? (await auth()).userId : null;
  const distractionFree = await getDistractionFreeServer();
  const profile = userId ? await getProfileSnapshot(userId) : null;
  const quranFoundationStatus = await getQuranFoundationConnectionStatus(userId ?? null);
  const reciterId = profile?.reciterId ?? "default";
  const requestedView = parseView(searchParams.view);
  const view = distractionFree ? "compact" : requestedView;
  const requestedSurahNumber = parseBoundedInt(searchParams.surah, 1, 114);
  const ayahId = parseBoundedInt(searchParams.ayah, 1, 6236);
  const requestedCursorAyahId = parseBoundedInt(searchParams.cursor, 1, 6236);
  const requestedPage = parseBoundedInt(searchParams.page, 1, 500) ?? 1;
  const anonymous = readSingle(searchParams.anon) === "1";
  const surahNumber = anonymous
    ? requestedSurahNumber
    : requestedSurahNumber ?? (ayahId == null ? (profile?.quranActiveSurahNumber ?? 1) : undefined);
  const cursorAyahId = anonymous
    ? requestedCursorAyahId
    : requestedCursorAyahId ?? profile?.quranCursorAyahId ?? undefined;
  const quranTranslationId = normalizeQuranTranslationId(
    cookieStore.get(QURAN_TRANSLATION_COOKIE)?.value ?? profile?.quranTranslationId ?? DEFAULT_QURAN_TRANSLATION_ID,
  );
  const quranShowDetails = profile?.quranShowDetails ?? true;
  const showPhonetic = distractionFree ? false : parseVisibility(searchParams.phonetic, quranShowDetails);
  const showTranslation = distractionFree ? false : parseVisibility(searchParams.translation, quranShowDetails);
  const showAnyDetails = showPhonetic || showTranslation;
  const ui = getReaderUiCopy(quranTranslationId);
  const selectedTranslation = QURAN_TRANSLATION_OPTIONS.find((option) => option.id === quranTranslationId);
  const translationDir = selectedTranslation?.rtl ? "rtl" : "ltr";
  const translationAlignClass = selectedTranslation?.rtl ? "text-right" : "text-left";

  const filters: AyahFilters = { surahNumber, ayahId };
  const ayahs = filterAyahs(filters);
  const compact = resolveCompactCursorAyah(ayahs, cursorAyahId);
  const totalListPages = Math.max(1, Math.ceil(ayahs.length / LIST_PAGE_SIZE));
  const listPage = Math.min(requestedPage, totalListPages);
  const listStartOffset = (listPage - 1) * LIST_PAGE_SIZE;
  const listAyahs = ayahs.slice(listStartOffset, listStartOffset + LIST_PAGE_SIZE);
  const surahs = listSurahs();

  // For compact view: pre-load the current surah's ayahs with translations so the
  // client component can navigate prev/next entirely in JS — no server round-trip per ayah.
  const compactSurahNumber = compact.current?.surahNumber ?? surahNumber ?? 1;
  const compactSurahAyahs = view === "compact"
    ? filterAyahs({ surahNumber: compactSurahNumber })
    : [];
  const compactAyahsData = view === "compact"
    ? compactSurahAyahs.map((ayah) => ({
        id: ayah.id,
        surahNumber: ayah.surahNumber,
        ayahNumber: ayah.ayahNumber,
        textUthmani: ayah.textUthmani,
        phonetic: getPhoneticByAyahId(ayah.id),
        translation: getQuranTranslationByAyahId(ayah.id, quranTranslationId),
      }))
    : [];

  const baseQuery = { surahNumber, ayahId };
  const detailQuery = { showPhonetic, showTranslation };
  const cursorForLinks = compact.current?.id ?? cursorAyahId;
  const listHref = buildHref({
    ...baseQuery,
    ...detailQuery,
    view: "list",
    page: view === "list" ? listPage : 1,
    anonymous,
  });
  const compactHref = `${
    buildHref({ ...baseQuery, ...detailQuery, view: "compact", cursor: cursorForLinks, anonymous })
  }#${COMPACT_READER_ANCHOR}`;
  const trackedHref = buildHref({
    ...baseQuery,
    ...detailQuery,
    view,
    cursor: cursorForLinks,
    page: view === "list" ? listPage : undefined,
    anonymous: false,
  });
  const anonymousHref = buildHref({
    ...baseQuery,
    ...detailQuery,
    view,
    cursor: cursorForLinks,
    page: view === "list" ? listPage : undefined,
    anonymous: true,
  });
  const phoneticToggleHref = buildHref({
    ...baseQuery,
    showPhonetic: !showPhonetic,
    showTranslation,
    view,
    cursor: view === "compact" ? cursorForLinks : undefined,
    page: view === "list" ? listPage : undefined,
    anonymous,
  });
  const translationToggleHref = buildHref({
    ...baseQuery,
    showPhonetic,
    showTranslation: !showTranslation,
    view,
    cursor: view === "compact" ? cursorForLinks : undefined,
    page: view === "list" ? listPage : undefined,
    anonymous,
  });
  const clearHref = anonymous ? "/quran/read?anon=1" : "/quran/read";
  const currentSurahInfo = compact.current ? getSurahInfo(compact.current.surahNumber) : null;
  const nextSurahNumber = currentSurahInfo &&
      compact.current &&
      compact.current.ayahNumber >= currentSurahInfo.ayahCount &&
      compact.current.surahNumber < 114
    ? compact.current.surahNumber + 1
    : null;
  const nextSurahHref = nextSurahNumber
    ? `${buildHref({
      view: "compact",
      surahNumber: nextSurahNumber,
      anonymous,
      ...detailQuery,
    })}#${COMPACT_READER_ANCHOR}`
    : null;
  const renderFilterControls = () => (
    <Card>
      <ReaderPreferencesControls
        initialTranslationId={quranTranslationId}
        initialShowDetails={quranShowDetails}
        persistEnabled={Boolean(authEnabled && userId)}
        ui={ui}
      />

      <div className="mt-4">
        <QuranFoundationFilterAction status={quranFoundationStatus} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          href={trackedHref}
          className={`rounded-full border px-3 py-2 text-sm font-semibold ${
            !anonymous
              ? "border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]"
              : "border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink)]"
          }`}
        >
          {ui.trackingOn}
        </Link>
        <Link
          href={anonymousHref}
          className={`rounded-full border px-3 py-2 text-sm font-semibold ${
            anonymous
              ? "border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]"
              : "border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink)]"
          }`}
        >
          {ui.anonymousWindow}
        </Link>
        <Link
          href={listHref}
          className={`rounded-full border px-3 py-2 text-sm font-semibold ${
            view === "list"
              ? "border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]"
              : "border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink)]"
          }`}
        >
          {ui.listView}
        </Link>
        <Link
          href={compactHref}
          className={`rounded-full border px-3 py-2 text-sm font-semibold ${
            view === "compact"
              ? "border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]"
              : "border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink)]"
          }`}
        >
          {ui.compactView}
        </Link>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Link
          href={phoneticToggleHref}
          className={`rounded-full border px-3 py-2 text-sm font-semibold ${
            showPhonetic
              ? "border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]"
              : "border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink)]"
          }`}
        >
          {showPhonetic ? ui.disablePhonetics : ui.enablePhonetics}
        </Link>
        <Link
          href={translationToggleHref}
          className={`rounded-full border px-3 py-2 text-sm font-semibold ${
            showTranslation
              ? "border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]"
              : "border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink)]"
          }`}
        >
          {showTranslation ? ui.disableTranslation : ui.enableTranslation}
        </Link>
      </div>

      <form className="mt-4 grid gap-3 md:grid-cols-3" method="get" action="/quran/read">
        <input type="hidden" name="view" value={view} />
        {anonymous ? <input type="hidden" name="anon" value="1" /> : null}
        <input type="hidden" name="phonetic" value={showPhonetic ? "1" : "0"} />
        <input type="hidden" name="translation" value={showTranslation ? "1" : "0"} />
        <label className="text-sm text-[color:var(--kw-muted)]">
          {ui.surah}
          <select
            name="surah"
            defaultValue={surahNumber != null ? String(surahNumber) : ""}
            className="mt-1 h-10 w-full rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 text-sm text-[color:var(--kw-ink)]"
          >
            <option value="">{ui.allSurahs}</option>
            {surahs.map((surah) => (
              <option key={surah.surahNumber} value={surah.surahNumber}>
                {surah.surahNumber} - {surah.nameTransliteration}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-[color:var(--kw-muted)]">
          {ui.ayahGlobalId}
          <input
            type="number"
            name="ayah"
            min={1}
            max={6236}
            defaultValue={ayahId != null ? String(ayahId) : ""}
            placeholder={ui.ayahPlaceholder}
            className="mt-1 h-10 w-full rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 text-sm text-[color:var(--kw-ink)]"
          />
        </label>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="h-10 rounded-xl border border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] px-4 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]"
          >
            {ui.applyFilters}
          </button>
          <Link
            href={clearHref}
            className="h-10 rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-2 text-sm font-semibold text-[color:var(--kw-ink)]"
          >
            {ui.clear}
          </Link>
        </div>
      </form>
    </Card>
  );

  return (
    <div className={distractionFree ? "pb-8 pt-4 md:pb-10 md:pt-6" : "pb-12 pt-10 md:pb-16 md:pt-14"}>
      {view === "compact" && compact.current ? (
        <CompactReaderScroll targetId={COMPACT_READER_ANCHOR} ayahId={compact.current.id} />
      ) : null}

      {!distractionFree ? (
        <>
          <Link
            href="/quran"
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2 text-sm font-semibold text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)] hover:bg-white"
          >
            <ArrowLeft size={16} />
            {ui.back}
          </Link>

          <div className="mt-6">
            <Pill tone="neutral">{ui.quranReaderPill}</Pill>
            <h1 className="mt-4 text-balance font-[family-name:var(--font-kw-display)] text-5xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)] sm:text-6xl">
              {ui.heroTitle}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--kw-muted)]">
              {ui.heroSubtitle}
              <span className="ml-2 inline-flex items-center rounded-full border border-[color:var(--kw-border-2)] bg-white/70 px-2 py-0.5 align-middle text-[10px] font-semibold leading-none tracking-[0.08em] text-[color:var(--kw-faint)]">
                Sahih Muslim 804a
              </span>
            </p>
          </div>

          <div className="mt-8">
            <details className="group rounded-[24px] border border-[color:var(--kw-border-2)] bg-white/65 p-3 shadow-[var(--kw-shadow-soft)]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-xl border border-[color:var(--kw-border-2)] bg-white/75 px-3 py-2.5 text-sm font-semibold text-[color:var(--kw-ink)]">
                <span>{ui.readerFilters}</span>
                <span className="rounded-full border border-[color:var(--kw-border-2)] bg-white/80 px-2 py-0.5 text-xs text-[color:var(--kw-muted)] group-open:hidden">
                  {ui.show}
                </span>
                <span className="hidden rounded-full border border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.1)] px-2 py-0.5 text-xs text-[rgba(var(--kw-accent-rgb),1)] group-open:inline-flex">
                  {ui.hide}
                </span>
              </summary>
              <div className="pt-3">{renderFilterControls()}</div>
            </details>
          </div>
        </>
      ) : null}

      {ayahs.length < 1 ? (
        <Card className="mt-8">
          <Pill tone="warn">{ui.noResults}</Pill>
          <p className="mt-3 text-sm text-[color:var(--kw-muted)]">
            {ui.noResultsMessage}
          </p>
          <div className="mt-4">
            <Link href={clearHref} className="text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)] hover:underline">
              {ui.clearAllFilters}
            </Link>
          </div>
        </Card>
      ) : null}

      {ayahs.length > 0 && view === "list" ? (
        <div className="mt-8 space-y-3">
          <QuranViewportProgressTracker enabled={Boolean(!anonymous && authEnabled && userId)} />
          {listAyahs.map((ayah) => (
            <Card
              key={ayah.id}
              className="py-3"
              data-quran-track="1"
              data-quran-ayah-id={ayah.id}
              data-quran-surah-number={ayah.surahNumber}
              data-quran-ayah-number={ayah.ayahNumber}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-[color:var(--kw-border-2)] bg-white/70 px-2.5 py-1 text-xs font-semibold text-[color:var(--kw-muted)]">
                    {ayah.surahNumber}:{ayah.ayahNumber}
                  </span>
                  <span className="text-xs text-[color:var(--kw-faint)]">#{ayah.id}</span>
                </div>
                <div className="w-full sm:w-auto">
                  <AyahAudioPlayer
                    ayahId={ayah.id}
                    reciterId={reciterId}
                    streakTrackSource={anonymous ? undefined : "quran_browse"}
                    speedPrefKey={QURAN_AUDIO_SPEED_PREF_KEY}
                  />
                </div>
              </div>

              <div dir="rtl" className="mt-4 text-right text-2xl leading-[2.1] text-[color:var(--kw-ink)]">
                {ayah.textUthmani}
              </div>
              {showAnyDetails ? (
                <div className="mt-3 space-y-2">
                  {showPhonetic ? (
                    <SupportTextPanel kind="transliteration">
                      {getPhoneticByAyahId(ayah.id) ?? ui.phoneticUnavailable}
                    </SupportTextPanel>
                  ) : null}
                  {showTranslation ? (
                    <SupportTextPanel
                      kind="translation"
                      dir={translationDir}
                      alignClassName={translationAlignClass}
                    >
                      {getQuranTranslationByAyahId(ayah.id, quranTranslationId) ??
                        `${ui.translationUnavailable} (${quranTranslationId})`}
                    </SupportTextPanel>
                  ) : null}
                </div>
              ) : (
                <p dir={translationDir} className="mt-3 text-sm leading-7 text-[color:var(--kw-faint)]">
                  {ui.detailsHiddenInFilters}
                </p>
              )}
            </Card>
          ))}

          {totalListPages > 1 ? (
            <Card className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                {listPage > 1 ? (
                  <Link
                    href={buildHref({
                      ...baseQuery,
                      ...detailQuery,
                      view: "list",
                      page: listPage - 1,
                      anonymous,
                    })}
                    className="rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2 font-semibold text-[color:var(--kw-ink)]"
                  >
                    {ui.previousPage}
                  </Link>
                ) : (
                  <span className="rounded-xl border border-[color:var(--kw-border-2)] bg-white/50 px-3 py-2 font-semibold text-[color:var(--kw-faint)]">
                    {ui.previousPage}
                  </span>
                )}

                <span className="text-[color:var(--kw-muted)]">
                  {ui.page} {listPage} {ui.of} {totalListPages}
                </span>

                {listPage < totalListPages ? (
                  <Link
                    href={buildHref({
                      ...baseQuery,
                      ...detailQuery,
                      view: "list",
                      page: listPage + 1,
                      anonymous,
                    })}
                    className="rounded-xl border border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] px-3 py-2 font-semibold text-[rgba(var(--kw-accent-rgb),1)]"
                  >
                    {ui.nextPage}
                  </Link>
                ) : (
                  <span className="rounded-xl border border-[color:var(--kw-border-2)] bg-white/50 px-3 py-2 font-semibold text-[color:var(--kw-faint)]">
                    {ui.nextPage}
                  </span>
                )}
              </div>
            </Card>
          ) : null}
        </div>
      ) : null}

      {ayahs.length > 0 && view === "compact" && compact.current ? (
        <CompactReaderClient
          ayahs={compactAyahsData}
          initialAyahId={compact.current.id}
          totalInSet={ayahs.length}
          indexInSet={compact.index}
          nextSurahHref={nextSurahHref}
          anonymous={anonymous}
          showPhonetic={showPhonetic}
          showTranslation={showTranslation}
          ui={ui}
          translationDir={translationDir}
          translationAlignClass={translationAlignClass}
          compactReaderAnchor={COMPACT_READER_ANCHOR}
          syncEnabled={Boolean(!anonymous && authEnabled && userId)}
          reciterId={reciterId}
          focusMode={distractionFree}
        />
      ) : null}
    </div>
  );
}
