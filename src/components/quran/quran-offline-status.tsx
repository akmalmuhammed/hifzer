"use client";

import { CloudOff, Download, Wifi } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { useOnlineStatus } from "@/components/pwa/use-online-status";

type OfflineStatusProps = {
  compact?: boolean;
  showReadyHint?: boolean;
  scope?: "hub" | "reader" | "search" | "bookmarks";
};

function scopeCopy(scope: OfflineStatusProps["scope"], online: boolean): string {
  if (!online) {
    if (scope === "search") {
      return "Offline local search is active. Bundled ayahs and the seeded translation stay searchable on this device.";
    }
    if (scope === "bookmarks") {
      return "Offline mode is active. Saved bookmarks stay available locally and queued changes can sync when the connection returns.";
    }
    if (scope === "reader") {
      return "Offline reading mode is active. Bundled ayahs and translations still work on this device.";
    }
    return "Offline mode is active. Bundled ayahs, translations, and local bookmark state still work on this device.";
  }

  if (scope === "search") {
    return "This search surface is offline-ready. If the network drops, Hifzer can fall back to the seeded ayah data already bundled in the app.";
  }
  if (scope === "bookmarks") {
    return "Bookmarks are local-first. You can keep reading and saving changes here even if sync has to wait for the next connection.";
  }
  if (scope === "reader") {
    return "Reader routes are offline-ready after they have been loaded once on this device.";
  }
  return "Bundled Qur'an text, translations, and core reading routes are prepared to keep working on this device if the network drops.";
}

export function QuranOfflineStatus(props: OfflineStatusProps) {
  const online = useOnlineStatus();

  if (online && !props.showReadyHint) {
    return null;
  }

  const tone = online ? "accent" : "warn";
  const Icon = online ? Download : CloudOff;

  return (
    <Card className={props.compact ? "mt-4" : "mt-6"}>
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={tone}>{online ? "Offline-ready" : "Offline mode"}</Pill>
        <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--kw-ink-2)]">
          <Icon size={13} />
          {online ? "Cached on this device" : "Using local Qur'an data"}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--kw-ink-2)]">
          <Wifi size={13} />
          {online ? "Connection available" : "Connection unavailable"}
        </span>
      </div>

      <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">{scopeCopy(props.scope ?? "hub", online)}</p>
      <p className="mt-2 text-xs leading-6 text-[color:var(--kw-faint)]">
        Audio playback, Quran Foundation enrichment, and live sync still depend on connection unless the browser already cached them earlier.
      </p>
    </Card>
  );
}
