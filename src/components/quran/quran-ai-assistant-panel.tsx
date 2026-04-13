"use client";

import Link from "next/link";
import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Loader2, MessageSquareQuote, RefreshCw, Search, Sparkles } from "lucide-react";
import { useOnlineStatus } from "@/components/pwa/use-online-status";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import type { QuranAssistantGatewayResponse, QuranAssistantGatewaySuccess } from "@/hifzer/ai/contracts";

const SUGGESTED_PROMPTS = [
  "ayah about sadness",
  "where Allah talks about mercy",
  "verses about hardship and ease",
  "What does the Quran say about fear?",
  "Explain Surah Duha simply",
  "Give me verses about patience",
] as const;

type LoadState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "ready"; payload: QuranAssistantGatewaySuccess }
  | { phase: "error"; detail: string };

function sectionHeading(label: string) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
      {label}
    </p>
  );
}

export function QuranAiAssistantPanel(props: { ayahId: number; compact?: boolean }) {
  const online = useOnlineStatus();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<LoadState>({ phase: "idle" });

  async function submitAssistantQuery(nextQuery?: string) {
    const finalQuery = (nextQuery ?? query).trim();
    if (finalQuery.length < 3) {
      setState({ phase: "error", detail: "Ask a fuller question so the assistant can search the Qur'an properly." });
      return;
    }

    if (!online) {
      setState({ phase: "error", detail: "AI assistant needs connection. Qur'an reading still works offline." });
      return;
    }

    setState({ phase: "loading" });
    try {
      const response = await fetch("/api/quran/ai-assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: finalQuery, ayahId: props.ayahId }),
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as QuranAssistantGatewayResponse | null;
      if (!response.ok || !payload?.ok) {
        setState({
          phase: "error",
          detail: payload && !payload.ok ? payload.detail : "AI assistant is unavailable right now.",
        });
        return;
      }
      setQuery(finalQuery);
      setState({ phase: "ready", payload });
    } catch {
      setState({ phase: "error", detail: "AI assistant is unavailable right now." });
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitAssistantQuery();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitAssistantQuery();
    }
  }

  const loading = state.phase === "loading";
  const ready = state.phase === "ready" ? state.payload : null;
  const errorDetail = state.phase === "error" ? state.detail : null;

  return (
    <Card className={props.compact ? "mt-4" : "mt-5"}>
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone="accent">AI assistant</Pill>
        <Pill tone="neutral">Quran MCP grounded</Pill>
      </div>

      <div className="mt-3">
          <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Ask anything about this ayah or the Qur&apos;an</p>
        <p className="mt-1 text-sm leading-7 text-[color:var(--kw-muted)]">
          Search by meaning, topic, or surah and get grounded ayahs with translation, tafsir summary, and sources.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => {
              setQuery(prompt);
              void submitAssistantQuery(prompt);
            }}
            className="rounded-full border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-1.5 text-left text-xs font-semibold text-[color:var(--kw-ink)] transition hover:bg-white"
          >
            {prompt}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <label className="block text-sm text-[color:var(--kw-muted)]">
          Ask anything
          <textarea
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            placeholder="Ask anything about mercy, fear, patience, hardship, or a surah..."
            className="mt-1 w-full rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/75 px-4 py-3 text-sm leading-7 text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)] outline-none transition placeholder:text-[color:var(--kw-faint)] focus:border-[rgba(var(--kw-accent-rgb),0.28)] focus:ring-2 focus:ring-[rgba(var(--kw-accent-rgb),0.12)]"
          />
        </label>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.10)] px-4 py-2 text-sm font-semibold text-[color:var(--kw-ink)] transition hover:bg-[rgba(var(--kw-accent-rgb),0.14)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            Ask AI
          </button>
          {ready ? (
            <button
              type="button"
              onClick={() => void submitAssistantQuery()}
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--kw-border-2)] bg-white/80 px-3 py-2 text-xs font-semibold text-[color:var(--kw-ink)] transition hover:bg-white"
            >
              <RefreshCw size={13} />
              Refresh answer
            </button>
          ) : null}
        </div>
      </form>

      {loading ? (
        <div className="mt-4 flex items-center gap-3 rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3 text-sm text-[color:var(--kw-muted)]">
          <Loader2 size={16} className="animate-spin text-[color:var(--kw-faint)]" />
          Searching grounded Qur&apos;an matches for your question...
        </div>
      ) : null}

      {errorDetail ? (
        <div className="mt-4 rounded-[18px] border border-[rgba(180,83,9,0.18)] bg-[rgba(245,158,11,0.08)] px-4 py-3">
          <p className="text-sm leading-7 text-[color:var(--kw-muted)]">{errorDetail}</p>
        </div>
      ) : null}

      {ready ? (
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            {sectionHeading("Grounded answer")}
            <div className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <MessageSquareQuote size={15} className="text-[color:var(--kw-faint)]" />
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
                  {ready.query}
                </p>
              </div>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-ink)]">{ready.answer}</p>
            </div>
          </div>

          {ready.matches.length ? (
            <div className="space-y-3">
              {sectionHeading("Ayahs")}
              {ready.matches.map((match) => (
                <div
                  key={`${ready.query}-${match.verseKey}`}
                  className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone="neutral">{match.verseKey}</Pill>
                      <Link
                        href={`/quran/read?surah=${match.surahNumber}&ayah=${match.ayahNumber}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[rgba(var(--kw-accent-rgb),1)] hover:underline"
                      >
                        <Search size={12} />
                        Open
                      </Link>
                    </div>
                  </div>
                  <p dir="rtl" className="mt-3 text-right text-xl leading-[2] text-[color:var(--kw-ink)]">
                    {match.arabicText}
                  </p>
                  {match.translation ? (
                    <div className="mt-3 rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/80 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
                        {match.translation.label}
                      </p>
                      <p
                        dir={match.translation.direction}
                        className={`mt-2 text-sm leading-7 text-[color:var(--kw-muted)] ${
                          match.translation.direction === "rtl" ? "text-right" : "text-left"
                        }`}
                      >
                        {match.translation.text}
                      </p>
                    </div>
                  ) : null}
                  <div className="mt-3 rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/80 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
                      Tafsir summary
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">{match.tafsirSummary}</p>
                  </div>
                  {match.sources.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {match.sources.map((source) => (
                        <Pill key={`${match.verseKey}-${source.kind}-${source.label}`} tone="neutral">
                          {source.label}
                        </Pill>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
