"use client";

import { useEffect, useState } from "react";
import { SupportTextPanel } from "@/components/quran/support-text-panel";

type OfficialTafsir = {
  resourceId: number;
  text: string;
  resourceName: string | null;
  languageName: string | null;
  direction: "ltr" | "rtl";
};

type Payload = {
  content: {
    status: "available" | "not_configured" | "degraded";
    detail: string;
    officialTafsirs: OfficialTafsir[];
  };
};

export type InitialCompactOfficialTafsir = {
  ayahId: number;
  status: "available" | "not_configured" | "degraded";
  detail: string;
  tafsir: OfficialTafsir | null;
};

type CompactOfficialTafsirProps = {
  ayahId: number;
  tafsirId: number | null;
  fallbackLabel: string | null;
  initial: InitialCompactOfficialTafsir | null;
};

type TafsirState = {
  loading: boolean;
  status: "available" | "not_configured" | "degraded";
  detail: string;
  tafsir: OfficialTafsir | null;
};

function buildLabel(tafsir: OfficialTafsir | null, fallbackLabel: string | null): string {
  if (tafsir?.resourceName) {
    return `Tafsir - ${tafsir.resourceName}`;
  }
  if (fallbackLabel) {
    return `Tafsir - ${fallbackLabel}`;
  }
  return "Tafsir";
}

export function CompactOfficialTafsir(props: CompactOfficialTafsirProps) {
  const hasInitialTafsir = props.initial?.ayahId === props.ayahId;
  const [state, setState] = useState<TafsirState>(() => ({
    loading: props.tafsirId != null && !hasInitialTafsir,
    status: props.initial?.status ?? "available",
    detail: props.initial?.detail ?? "",
    tafsir: hasInitialTafsir ? props.initial?.tafsir ?? null : null,
  }));

  useEffect(() => {
    if (!props.tafsirId) {
      return;
    }

    if (hasInitialTafsir) {
      return;
    }

    let cancelled = false;

    const query = new URLSearchParams();
    query.set("ayahId", String(props.ayahId));
    query.set("tafsirIds", String(props.tafsirId));

    void (async () => {
      try {
        const response = await fetch(`/api/quran/content-panel?${query.toString()}`, {
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as Payload | null;
        if (cancelled) {
          return;
        }
        if (!response.ok || !payload) {
          setState({
            loading: false,
            status: "degraded",
            detail: "Official tafsir is unavailable right now.",
            tafsir: null,
          });
          return;
        }
        setState({
          loading: false,
          status: payload.content.status,
          detail: payload.content.detail,
          tafsir: payload.content.officialTafsirs[0] ?? null,
        });
      } catch {
        if (!cancelled) {
          setState({
            loading: false,
            status: "degraded",
            detail: "Official tafsir is unavailable right now.",
            tafsir: null,
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasInitialTafsir, props.ayahId, props.tafsirId]);

  if (!props.tafsirId) {
    return null;
  }

  const label = buildLabel(state.tafsir, props.fallbackLabel);
  const direction = state.tafsir?.direction ?? "ltr";
  const alignClassName = direction === "rtl" ? "text-right" : "text-left";
  const message = state.loading
    ? "Loading official tafsir..."
    : state.tafsir?.text ?? "Official tafsir unavailable right now.";

  return (
    <SupportTextPanel
      kind="translation"
      label={label}
      dir={direction}
      alignClassName={alignClassName}
      data-status={state.status}
      title={!state.tafsir && state.detail ? state.detail : undefined}
    >
      {message}
    </SupportTextPanel>
  );
}
