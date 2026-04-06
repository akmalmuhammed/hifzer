"use client";

import { useState } from "react";
import { BookOpenText, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useOnlineStatus } from "@/components/pwa/use-online-status";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import type { AyahExplanationGatewayResponse, AyahExplanationGatewaySuccess } from "@/hifzer/ai/contracts";

type LoadState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "ready"; payload: AyahExplanationGatewaySuccess }
  | { phase: "error"; detail: string };

function sectionHeading(label: string) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
      {label}
    </p>
  );
}

export function AyahAiExplanationPanel(props: { ayahId: number; compact?: boolean }) {
  const online = useOnlineStatus();
  const [state, setState] = useState<LoadState>({ phase: "idle" });

  async function loadExplanation() {
    if (!online) {
      setState({ phase: "error", detail: "AI explanation needs connection. Qur'an reading still works offline." });
      return;
    }

    setState({ phase: "loading" });
    try {
      const response = await fetch("/api/quran/ai-explain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ayahId: props.ayahId }),
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as AyahExplanationGatewayResponse | null;
      if (!response.ok || !payload?.ok) {
        setState({
          phase: "error",
          detail: payload && !payload.ok ? payload.detail : "AI explanation is unavailable right now.",
        });
        return;
      }
      setState({ phase: "ready", payload });
    } catch {
      setState({ phase: "error", detail: "AI explanation is unavailable right now." });
    }
  }

  const loading = state.phase === "loading";
  const ready = state.phase === "ready" ? state.payload : null;
  const errorDetail = state.phase === "error" ? state.detail : null;

  return (
    <Card className={props.compact ? "mt-3" : "mt-4"}>
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone="accent">AI beta</Pill>
        <Pill tone="neutral">Grounded with Quran MCP</Pill>
        {ready ? <Pill tone="neutral">{ready.provider} · {ready.model}</Pill> : null}
      </div>

      <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
        Plain-language ayah guidance for the current verse, grounded before it speaks. Official translation and tafsir stay
        the source of truth underneath.
      </p>

      {state.phase === "idle" ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={loadExplanation}
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.10)] px-4 py-2 text-sm font-semibold text-[color:var(--kw-ink)] transition hover:bg-[rgba(var(--kw-accent-rgb),0.14)]"
          >
            <Sparkles size={15} />
            Explain this ayah
          </button>
          <p className="text-xs leading-6 text-[color:var(--kw-faint)]">
            Best for quick context, key themes, and scholar-backed framing before you read the full tafsir.
          </p>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-4 flex items-center gap-3 rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3 text-sm text-[color:var(--kw-muted)]">
          <Loader2 size={16} className="animate-spin text-[color:var(--kw-faint)]" />
          Loading a grounded explanation for this ayah...
        </div>
      ) : null}

      {errorDetail ? (
        <div className="mt-4 rounded-[18px] border border-[rgba(180,83,9,0.18)] bg-[rgba(245,158,11,0.08)] px-4 py-3">
          <p className="text-sm leading-7 text-[color:var(--kw-muted)]">{errorDetail}</p>
          <button
            type="button"
            onClick={loadExplanation}
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-[color:var(--kw-border-2)] bg-white/80 px-3 py-2 text-xs font-semibold text-[color:var(--kw-ink)] transition hover:bg-white"
          >
            <RefreshCw size={13} />
            Try again
          </button>
        </div>
      ) : null}

      {ready ? (
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            {sectionHeading("Plain-language explanation")}
            <div className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3">
              <p className="text-sm leading-7 text-[color:var(--kw-ink)]">{ready.explanation.summary}</p>
            </div>
          </div>

          {ready.explanation.keyThemes.length ? (
            <div className="space-y-2">
              {sectionHeading("Key themes")}
              <div className="flex flex-wrap gap-2">
                {ready.explanation.keyThemes.map((theme) => (
                  <Pill key={theme} tone="neutral">
                    {theme}
                  </Pill>
                ))}
              </div>
            </div>
          ) : null}

          {ready.explanation.tafsirInsights.length ? (
            <div className="space-y-3">
              {sectionHeading("Tafsir insights")}
              {ready.explanation.tafsirInsights.map((insight) => (
                <div
                  key={`${insight.source}-${insight.title}`}
                  className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{insight.title}</p>
                    <Pill tone="neutral">{insight.source}</Pill>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">{insight.detail}</p>
                </div>
              ))}
            </div>
          ) : null}

          {ready.explanation.wordNotes.length ? (
            <div className="space-y-3">
              {sectionHeading("Word notes")}
              {ready.explanation.wordNotes.map((note) => (
                <div
                  key={`${note.term}-${note.detail}`}
                  className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <BookOpenText size={14} className="text-[color:var(--kw-faint)]" />
                    <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{note.term}</p>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">{note.detail}</p>
                </div>
              ))}
            </div>
          ) : null}

          {ready.explanation.reflectionPrompt ? (
            <div className="space-y-2">
              {sectionHeading("Reflection prompt")}
              <div className="rounded-[20px] border border-[rgba(var(--kw-accent-rgb),0.20)] bg-[rgba(var(--kw-accent-rgb),0.08)] px-4 py-3">
                <p className="text-sm leading-7 text-[color:var(--kw-ink)]">{ready.explanation.reflectionPrompt}</p>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            {sectionHeading("Grounding")}
            <p className="text-xs leading-6 text-[color:var(--kw-faint)]">
              AI explanation beta. Always verify with the official translation and tafsir shown above.
            </p>
            {ready.explanation.groundingTools.length ? (
              <div className="flex flex-wrap gap-2">
                {ready.explanation.groundingTools.map((tool) => (
                  <Pill key={tool} tone="neutral">
                    {tool}
                  </Pill>
                ))}
              </div>
            ) : null}
            {ready.explanation.sources.length ? (
              <div className="flex flex-wrap gap-2">
                {ready.explanation.sources.map((source) => (
                  <Pill key={`${source.kind}-${source.label}`} tone="neutral">
                    {source.kind}: {source.label}
                  </Pill>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={loadExplanation}
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--kw-border-2)] bg-white/80 px-3 py-2 text-xs font-semibold text-[color:var(--kw-ink)] transition hover:bg-white"
          >
            <RefreshCw size={13} />
            Refresh explanation
          </button>
        </div>
      ) : null}
    </Card>
  );
}
