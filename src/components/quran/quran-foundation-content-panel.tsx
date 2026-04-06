"use client";

import { useEffect, useState } from "react";
import { useOnlineStatus } from "@/components/pwa/use-online-status";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { SupportTextPanel } from "@/components/quran/support-text-panel";

type Payload = {
  provider: string;
  verseKey: string;
  content: {
    status: "available" | "not_configured" | "degraded";
    detail: string;
    verseKey: string;
    pageNumber: number | null;
    juzNumber: number | null;
    hizbNumber: number | null;
    rubElHizbNumber: number | null;
    officialTranslation: {
      text: string;
      resourceName: string | null;
      languageName: string | null;
    } | null;
    officialTafsir: {
      text: string;
      resourceName: string | null;
      languageName: string | null;
    } | null;
  };
};

export function QuranFoundationContentPanel(props: { ayahId: number; compact?: boolean }) {
  const online = useOnlineStatus();
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const response = await fetch(`/api/quran/content-panel?ayahId=${encodeURIComponent(String(props.ayahId))}`, {
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
  }, [props.ayahId]);

  const content = payload?.content ?? null;
  const tone =
    content?.status === "available"
      ? "accent"
      : content?.status === "degraded"
        ? "warn"
        : !online
          ? "warn"
          : "neutral";

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
            : content?.detail ?? "Official enrichment is unavailable right now."}
      </p>

      {content?.officialTranslation ? (
        <div className="mt-3 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
            Official translation
            {content.officialTranslation.resourceName ? ` · ${content.officialTranslation.resourceName}` : ""}
          </p>
          <SupportTextPanel kind="translation">
            {content.officialTranslation.text}
          </SupportTextPanel>
        </div>
      ) : null}

      {content?.officialTafsir ? (
        <div className="mt-3 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
            Official tafsir
            {content.officialTafsir.resourceName ? ` · ${content.officialTafsir.resourceName}` : ""}
          </p>
          <SupportTextPanel kind="translation">
            {content.officialTafsir.text}
          </SupportTextPanel>
        </div>
      ) : null}
    </Card>
  );
}
