"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpenText, Loader2, Search, Sparkles } from "lucide-react";
import { Pill } from "@/components/ui/pill";
import styles from "./quran-glossary.module.css";

type QuranSearchScope = "all" | "arabic" | "translation";

type SearchResult = {
  ayahId: number;
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  textUthmani: string;
  translation: string;
  score: number;
};

const QUICK_TOPICS = [
  { label: "Mercy", query: "mercy" },
  { label: "Patience", query: "patience" },
  { label: "Prayer", query: "prayer" },
  { label: "Paradise", query: "paradise" },
  { label: "Hellfire", query: "hellfire" },
  { label: "Charity", query: "charity" },
  { label: "Repentance", query: "repentance" },
  { label: "Guidance", query: "guidance" },
];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getHighlightRegex(query: string): RegExp | null {
  const tokens = query
    .trim()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .slice(0, 6);
  if (tokens.length === 0) {
    return null;
  }
  return new RegExp(`(${tokens.map(escapeRegex).join("|")})`, "gi");
}

function HighlightedText(props: { text: string; query: string }) {
  const regex = useMemo(() => getHighlightRegex(props.query), [props.query]);
  if (!regex) {
    return <>{props.text}</>;
  }

  const parts = props.text.split(regex);
  const tokenSet = new Set(
    props.query
      .trim()
      .split(/\s+/)
      .map((token) => token.toLowerCase())
      .filter((token) => token.length >= 2),
  );

  return (
    <>
      {parts.map((part, idx) =>
        tokenSet.has(part.toLowerCase()) ? (
          <mark key={`${part}-${idx}`} className={styles.matchMark}>
            {part}
          </mark>
        ) : (
          <span key={`${part}-${idx}`}>{part}</span>
        ),
      )}
    </>
  );
}

export function QuranGlossaryClient() {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<QuranSearchScope>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeRequest, setActiveRequest] = useState("");

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      setActiveRequest(trimmed);
      try {
        const params = new URLSearchParams({ q: trimmed, scope, limit: "36" });
        const res = await fetch(`/api/quran/search?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await res.json()) as {
          error?: string;
          results?: SearchResult[];
        };
        if (!res.ok) {
          throw new Error(payload.error || "Search failed.");
        }
        setResults(Array.isArray(payload.results) ? payload.results : []);
      } catch (fetchError) {
        if ((fetchError as Error).name === "AbortError") {
          return;
        }
        setResults([]);
        setError(fetchError instanceof Error ? fetchError.message : "Search failed.");
      } finally {
        setLoading(false);
      }
    }, 260);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, scope]);

  const trimmed = query.trim();

  return (
    <div className={styles.shell}>
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Pill tone="accent">Qur&apos;anic glossary</Pill>
            <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(var(--kw-accent-rgb),0.23)] bg-[rgba(var(--kw-accent-rgb),0.11)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[rgba(var(--kw-accent-rgb),1)]">
              <Sparkles size={12} />
              Smart search
            </span>
          </div>
          <p className="text-xs text-[color:var(--kw-faint)]">Search themes, words, or Arabic fragments.</p>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <label className={styles.searchBar}>
            <Search size={16} className="text-[color:var(--kw-faint)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try: mercy, patience, zakah, guidance, النور ..."
              className="h-11 w-full bg-transparent px-3 text-sm text-[color:var(--kw-ink)] outline-none placeholder:text-[color:var(--kw-faint)]"
            />
            {loading ? <Loader2 size={15} className="animate-spin text-[rgba(var(--kw-accent-rgb),1)]" /> : null}
          </label>

          <div className={styles.scopeToggle}>
            {(["all", "translation", "arabic"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setScope(item)}
                className={`${styles.scopeButton} ${scope === item ? styles.scopeButtonActive : ""}`}
              >
                {item === "all" ? "All" : item === "translation" ? "Translation" : "Arabic"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_TOPICS.map((topic) => (
            <button key={topic.label} type="button" onClick={() => setQuery(topic.query)} className={styles.topicChip}>
              {topic.label}
            </button>
          ))}
        </div>

        {trimmed.length < 2 ? (
          <div className={`mt-5 ${styles.emptyState}`}>
            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Start with a topic or verse fragment.</p>
            <p className="mt-1 text-sm text-[color:var(--kw-muted)]">
              Example searches: <span className="font-semibold">mercy</span>,{" "}
              <span className="font-semibold">those who believe</span>, <span className="font-semibold">ٱللَّهُ نُورُ</span>
            </p>
          </div>
        ) : null}

        {error ? (
          <div className={`mt-5 ${styles.emptyState}`}>
            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Search failed</p>
            <p className="mt-1 text-sm text-[color:var(--kw-muted)]">{error}</p>
          </div>
        ) : null}

        {trimmed.length >= 2 && !loading && !error ? (
          <div className="mt-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-[color:var(--kw-muted)]">
                {results.length} matches for <span className="font-semibold text-[color:var(--kw-ink)]">{activeRequest}</span>
              </p>
            </div>

            {results.length < 1 ? (
              <div className={`mt-3 ${styles.emptyState}`}>
                <p className="text-sm font-semibold text-[color:var(--kw-ink)]">No ayah matches found.</p>
                <p className="mt-1 text-sm text-[color:var(--kw-muted)]">
                  Try a broader term or switch scope to <span className="font-semibold">All</span>.
                </p>
              </div>
            ) : (
              <div className="mt-3 grid gap-3">
                {results.map((result) => (
                  <div key={result.ayahId} className={styles.resultCard}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-[rgba(var(--kw-accent-rgb),0.22)] bg-[rgba(var(--kw-accent-rgb),0.1)] px-2.5 py-1 text-xs font-semibold text-[rgba(var(--kw-accent-rgb),1)]">
                          {result.surahNumber}:{result.ayahNumber}
                        </span>
                        <span className="text-xs text-[color:var(--kw-faint)]">{result.surahName}</span>
                      </div>
                      <Link
                        href={`/quran/read?view=compact&surah=${result.surahNumber}&cursor=${result.ayahId}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[rgba(var(--kw-accent-rgb),1)] hover:underline"
                      >
                        Open in reader
                        <ArrowUpRight size={13} />
                      </Link>
                    </div>

                    <p dir="rtl" className="mt-3 text-right text-xl leading-[2] text-[color:var(--kw-ink)]">
                      {result.textUthmani}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                      <HighlightedText text={result.translation} query={activeRequest} />
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {loading && trimmed.length >= 2 ? (
          <div className={`mt-5 ${styles.emptyState}`}>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--kw-ink)]">
              <Loader2 size={15} className="animate-spin text-[rgba(var(--kw-accent-rgb),1)]" />
              Searching ayahs...
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function QuranGlossaryHeaderHint() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--kw-accent-rgb),0.24)] bg-[rgba(var(--kw-accent-rgb),0.11)] px-3 py-1 text-xs font-semibold text-[rgba(var(--kw-accent-rgb),1)]">
      <BookOpenText size={13} />
      Glossary & topic search
    </span>
  );
}
