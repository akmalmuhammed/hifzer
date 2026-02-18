"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SURAH_INDEX } from "@/hifzer/quran/data/surah-index";

type SurahSearchSelectProps = {
  value: number;
  onChange: (surahNumber: number) => void;
  disabled?: boolean;
};

export function SurahSearchSelect(props: SurahSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(
    () => SURAH_INDEX.find((row) => row.surahNumber === props.value) ?? null,
    [props.value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return SURAH_INDEX.slice(0, 20);
    }
    return SURAH_INDEX.filter((row) => {
      const numberMatch = String(row.surahNumber).includes(q);
      const translitMatch = row.nameTransliteration.toLowerCase().includes(q);
      const englishMatch = row.nameEnglish.toLowerCase().includes(q);
      return numberMatch || translitMatch || englishMatch;
    }).slice(0, 20);
  }, [query]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (!rootRef.current.contains(target)) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={props.disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 rounded-2xl border border-[color:var(--kw-border)] bg-white px-3 py-2 text-left text-sm font-semibold text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span>
          {selected
            ? `${selected.surahNumber}. ${selected.nameTransliteration} (${selected.nameEnglish})`
            : "Select surah"}
        </span>
        <ChevronDown size={15} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>

      {open ? (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-[color:var(--kw-border)] bg-white p-2 shadow-[var(--kw-shadow)]">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--kw-faint)]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by surah number or name"
              className="pl-9"
              autoFocus
            />
          </div>
          <div className="mt-2 max-h-60 overflow-y-auto">
            {filtered.map((row) => {
              const active = row.surahNumber === props.value;
              return (
                <button
                  key={row.surahNumber}
                  type="button"
                  onClick={() => {
                    props.onChange(row.surahNumber);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={[
                    "w-full rounded-xl px-2 py-2 text-left text-sm transition",
                    active
                      ? "bg-[rgba(var(--kw-accent-rgb),0.12)] text-[color:var(--kw-ink)]"
                      : "text-[color:var(--kw-muted)] hover:bg-[color:var(--kw-surface)]",
                  ].join(" ")}
                >
                  <span className="font-semibold text-[color:var(--kw-ink)]">
                    {row.surahNumber}. {row.nameTransliteration}
                  </span>
                  <span className="ml-2 text-xs text-[color:var(--kw-faint)]">({row.nameEnglish})</span>
                </button>
              );
            })}
            {!filtered.length ? (
              <p className="px-2 py-3 text-xs text-[color:var(--kw-faint)]">No matching surah.</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

