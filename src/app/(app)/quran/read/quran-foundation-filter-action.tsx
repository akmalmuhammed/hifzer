"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getQuranFoundationFeedbackLabel } from "@/hifzer/quran-foundation/feedback";
import type { QuranFoundationConnectionStatus } from "@/hifzer/quran-foundation/types";

function statusLabel(status: QuranFoundationConnectionStatus): string {
  if (status.state === "connected") {
    return "Connected";
  }
  if (status.state === "degraded") {
    return "Needs attention";
  }
  return "Optional";
}

export function QuranFoundationFilterAction(props: { status: QuranFoundationConnectionStatus }) {
  const searchParams = useSearchParams();
  const feedback = useMemo(() => getQuranFoundationFeedbackLabel(searchParams.get("qf")), [searchParams]);
  const [value, setValue] = useState("");

  if (!props.status.available || props.status.state === "not_configured") {
    return null;
  }

  return (
    <label className="block text-sm text-[color:var(--kw-muted)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>Quran.com</span>
        <span className="text-xs text-[color:var(--kw-faint)]">{statusLabel(props.status)}</span>
      </div>

      <select
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          setValue("");
          if (!next || typeof window === "undefined") {
            return;
          }

          if (next === "connect") {
            const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
            window.location.href = `/api/quran-foundation/connect?returnTo=${encodeURIComponent(returnTo)}`;
            return;
          }

          if (next === "bookmarks") {
            window.location.href = "/quran/bookmarks";
            return;
          }

          window.location.href = "/settings/quran-foundation";
        }}
        className="mt-1 h-10 w-full rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 text-sm text-[color:var(--kw-ink)]"
      >
        <option value="">Choose an option</option>
        {props.status.state === "connected" || props.status.state === "degraded" ? (
          <>
            <option value="settings">Open Quran.com settings</option>
            <option value="bookmarks">Open bookmarks</option>
          </>
        ) : (
          <>
            <option value="connect">Link Quran.com</option>
            <option value="settings">Open Quran.com settings</option>
          </>
        )}
      </select>

      {feedback ? (
        <span className="mt-1 block text-xs text-[color:var(--kw-faint)]">{feedback}</span>
      ) : null}
    </label>
  );
}
