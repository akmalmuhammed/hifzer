"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpenText } from "lucide-react";
import { useOnlineStatus } from "@/components/pwa/use-online-status";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { SupportTextPanel } from "@/components/quran/support-text-panel";

type ContentResource = {
  id: number;
  label: string;
  authorName: string | null;
  languageName: string | null;
  direction: "ltr" | "rtl";
  slug: string | null;
};

type SupportText = {
  resourceId: number;
  text: string;
  resourceName: string | null;
  languageName: string | null;
  direction: "ltr" | "rtl";
};

type Payload = {
  provider: string;
  verseKey: string;
  catalog: {
    status: "available" | "not_configured" | "degraded";
    detail: string;
    translations: ContentResource[];
    tafsirs: ContentResource[];
    defaultTranslationId: number | null;
    defaultTafsirIds: number[];
  };
  content: {
    status: "available" | "not_configured" | "degraded";
    detail: string;
    verseKey: string;
    pageNumber: number | null;
    juzNumber: number | null;
    hizbNumber: number | null;
    rubElHizbNumber: number | null;
    officialTranslation: SupportText | null;
    officialTafsirs: SupportText[];
  };
};

const MAX_TAFSIR_SELECTIONS = 2;

function selectionKey(values: number[]): string {
  return [...values].sort((left, right) => left - right).join(",");
}

function sameSelection(left: number[], right: number[]): boolean {
  return selectionKey(left) === selectionKey(right);
}

function renderResourceMeta(resource: ContentResource | SupportText): string {
  const name = "resourceName" in resource ? resource.resourceName : resource.label;
  return [name, resource.languageName].filter(Boolean).join(" · ");
}

export function QuranFoundationContentPanel(props: { ayahId: number; compact?: boolean }) {
  const online = useOnlineStatus();
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [translationId, setTranslationId] = useState<number | null>(null);
  const [tafsirIds, setTafsirIds] = useState<number[]>([]);

  useEffect(() => {
    setTranslationId(null);
    setTafsirIds([]);
  }, [props.ayahId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const query = new URLSearchParams();
    query.set("ayahId", String(props.ayahId));
    if (translationId) {
      query.set("translationId", String(translationId));
    }
    if (tafsirIds.length) {
      query.set("tafsirIds", tafsirIds.join(","));
    }

    void (async () => {
      try {
        const response = await fetch(`/api/quran/content-panel?${query.toString()}`, {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => null)) as Payload | null;
        if (cancelled) {
          return;
        }
        setPayload(response.ok ? data : null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [props.ayahId, tafsirIds, translationId]);

  const content = payload?.content ?? null;
  const catalog = payload?.catalog ?? null;
  const activeTranslationId = translationId ?? catalog?.defaultTranslationId ?? null;
  const activeTafsirIds = tafsirIds.length ? tafsirIds : (catalog?.defaultTafsirIds ?? []);
  const visibleTranslations = useMemo(() => (catalog?.translations ?? []).slice(0, 8), [catalog]);
  const visibleTafsirs = useMemo(() => (catalog?.tafsirs ?? []).slice(0, 8), [catalog]);

  const tone =
    content?.status === "available"
      ? "accent"
      : content?.status === "degraded" || catalog?.status === "degraded"
        ? "warn"
        : !online
          ? "warn"
          : "neutral";

  function onToggleTafsir(resourceId: number) {
    const current = tafsirIds.length ? [...tafsirIds] : [...activeTafsirIds];
    let next: number[];
    if (current.includes(resourceId)) {
      next = current.filter((id) => id !== resourceId);
    } else {
      next = [resourceId, ...current.filter((id) => id !== resourceId)].slice(0, MAX_TAFSIR_SELECTIONS);
    }

    const fallback = catalog?.defaultTafsirIds ?? [];
    setTafsirIds(sameSelection(next, fallback) ? [] : next);
  }

  return (
    <Card className={props.compact ? "mt-3" : "mt-4"}>
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={tone}>Quran Foundation</Pill>
        {content?.pageNumber ? <Pill tone="neutral">Page {content.pageNumber}</Pill> : null}
        {content?.juzNumber ? <Pill tone="neutral">Juz {content.juzNumber}</Pill> : null}
        {content?.hizbNumber ? <Pill tone="neutral">Hizb {content.hizbNumber}</Pill> : null}
        {content?.rubElHizbNumber ? <Pill tone="neutral">Rub {content.rubElHizbNumber}</Pill> : null}
      </div>

      <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
        {loading
          ? "Loading official Quran Foundation enrichment..."
          : !online
            ? "Official Quran Foundation enrichment needs connection. Local Qur'an reading still works offline on this device."
            : content?.detail ?? catalog?.detail ?? "Official enrichment is unavailable right now."}
      </p>

      {visibleTranslations.length ? (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <BookOpenText size={15} className="text-[color:var(--kw-faint)]" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
              Official translation layer
            </p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setTranslationId(null)}
              className={[
                "min-w-[140px] rounded-[18px] border px-3 py-2 text-left transition",
                translationId == null
                  ? "border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.10)]"
                  : "border-[color:var(--kw-border-2)] bg-white/70 hover:bg-white",
              ].join(" ")}
            >
              <p className="text-xs font-semibold text-[color:var(--kw-ink)]">Recommended</p>
              <p className="mt-1 text-xs leading-5 text-[color:var(--kw-muted)]">Use the default official translation.</p>
            </button>
            {visibleTranslations.map((resource) => {
              const active = activeTranslationId === resource.id;
              return (
                <button
                  key={resource.id}
                  type="button"
                  onClick={() => setTranslationId(resource.id === catalog?.defaultTranslationId ? null : resource.id)}
                  className={[
                    "min-w-[180px] rounded-[18px] border px-3 py-2 text-left transition",
                    active
                      ? "border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.10)]"
                      : "border-[color:var(--kw-border-2)] bg-white/70 hover:bg-white",
                  ].join(" ")}
                >
                  <p className="text-xs font-semibold text-[color:var(--kw-ink)]">{resource.label}</p>
                  <p className="mt-1 text-xs leading-5 text-[color:var(--kw-muted)]">
                    {[resource.authorName, resource.languageName].filter(Boolean).join(" · ") || "Official Quran.com translation"}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {content?.officialTranslation ? (
        <div className="mt-3 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
            {renderResourceMeta(content.officialTranslation) || "Official translation"}
          </p>
          <SupportTextPanel
            kind="translation"
            dir={content.officialTranslation.direction}
            alignClassName={content.officialTranslation.direction === "rtl" ? "text-right" : "text-left"}
          >
            {content.officialTranslation.text}
          </SupportTextPanel>
        </div>
      ) : null}

      {visibleTafsirs.length ? (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
              Multi-tafsir
            </p>
            <Pill tone="neutral">Pick up to 2</Pill>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setTafsirIds([])}
              className={[
                "min-w-[140px] rounded-[18px] border px-3 py-2 text-left transition",
                tafsirIds.length === 0
                  ? "border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.10)]"
                  : "border-[color:var(--kw-border-2)] bg-white/70 hover:bg-white",
              ].join(" ")}
            >
              <p className="text-xs font-semibold text-[color:var(--kw-ink)]">Recommended</p>
              <p className="mt-1 text-xs leading-5 text-[color:var(--kw-muted)]">Reset to the default official tafsir mix.</p>
            </button>
            {visibleTafsirs.map((resource) => {
              const active = activeTafsirIds.includes(resource.id);
              return (
                <button
                  key={resource.id}
                  type="button"
                  onClick={() => onToggleTafsir(resource.id)}
                  className={[
                    "min-w-[200px] rounded-[18px] border px-3 py-2 text-left transition",
                    active
                      ? "border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.10)]"
                      : "border-[color:var(--kw-border-2)] bg-white/70 hover:bg-white",
                  ].join(" ")}
                >
                  <p className="text-xs font-semibold text-[color:var(--kw-ink)]">{resource.label}</p>
                  <p className="mt-1 text-xs leading-5 text-[color:var(--kw-muted)]">
                    {[resource.authorName, resource.languageName].filter(Boolean).join(" · ") || "Official Quran.com tafsir"}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {content?.officialTafsirs.length ? (
        <div className="mt-3 space-y-3">
          {content.officialTafsirs.map((tafsir) => (
            <div key={tafsir.resourceId} className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
                {renderResourceMeta(tafsir) || "Official tafsir"}
              </p>
              <SupportTextPanel
                kind="translation"
                dir={tafsir.direction}
                alignClassName={tafsir.direction === "rtl" ? "text-right" : "text-left"}
              >
                {tafsir.text}
              </SupportTextPanel>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
