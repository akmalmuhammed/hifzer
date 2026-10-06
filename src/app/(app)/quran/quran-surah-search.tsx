"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

type SurahEntry = {
  surahNumber: number;
  nameTransliteration: string;
  nameArabic: string;
  nameEnglish: string;
  ayahCount: number;
};

export function QuranSurahSearch({ surahs }: { surahs: SurahEntry[] }) {
  const [query, setQuery] = useState("");

  const trimmed = query.trim().toLowerCase();
  const filtered =
    trimmed.length === 0
      ? []
      : surahs.filter((s) => {
          const num = Number(trimmed);
          if (Number.isFinite(num) && num > 0) {
            return s.surahNumber === num;
          }
          return (
            s.nameTransliteration.toLowerCase().includes(trimmed) ||
            s.nameEnglish.toLowerCase().includes(trimmed) ||
            s.nameArabic.includes(trimmed)
          );
        });

  return (
    <div className="relative">
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--kw-faint)]"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search surahs by name or number..."
          className="h-11 w-full rounded-xl border border-transparent bg-[color:var(--kw-fill-strong)] pl-9 pr-3 text-sm text-[color:var(--kw-ink)] transition-[border-color,box-shadow] duration-200 placeholder:text-[color:var(--kw-faint)] focus:border-[rgba(var(--kw-accent-rgb),0.55)] focus:outline-none focus:ring-4 focus:ring-[rgba(var(--kw-accent-rgb),0.16)]"
        />
      </div>

      {trimmed.length > 0 && (
        <ul className="mt-2 max-h-72 divide-y divide-[color:var(--kw-border-2)] overflow-y-auto rounded-[14px] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-card)]">
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-sm text-[color:var(--kw-muted)]">
              No surahs found for &ldquo;{query.trim()}&rdquo;
            </li>
          ) : (
            filtered.map((s) => (
              <li key={s.surahNumber}>
                <Link
                  href={`/quran/read?view=compact&surah=${s.surahNumber}`}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[color:var(--kw-hover-soft)]"
                  onClick={() => setQuery("")}
                >
                  <span className="flex items-center gap-2">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[rgba(var(--kw-accent-rgb),0.1)] text-xs font-semibold tabular-nums text-[rgba(var(--kw-accent-rgb),1)]">
                      {s.surahNumber}
                    </span>
                    <span className="font-medium text-[color:var(--kw-ink)]">
                      {s.nameTransliteration}
                    </span>
                    <span className="text-[color:var(--kw-muted)]">
                      {s.nameArabic}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-[color:var(--kw-faint)]">
                    {s.ayahCount} ayahs
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
