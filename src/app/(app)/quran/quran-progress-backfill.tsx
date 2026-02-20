"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CloudOff, Import } from "lucide-react";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";

type SurahRangeOption = {
  surahNumber: number;
  ayahCount: number;
  startAyahId: number;
  nameTransliteration: string;
};

type Props = {
  surahs: SurahRangeOption[];
  defaultSurahNumber: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function QuranProgressBackfill(props: Props) {
  const { pushToast } = useToast();
  const router = useRouter();
  const [selectedSurahNumber, setSelectedSurahNumber] = useState(() =>
    props.surahs.some((s) => s.surahNumber === props.defaultSurahNumber) ? props.defaultSurahNumber : 1,
  );
  const [fromAyah, setFromAyah] = useState(1);
  const [toAyah, setToAyah] = useState(10);
  const [saving, setSaving] = useState(false);

  const selected = useMemo(
    () => props.surahs.find((s) => s.surahNumber === selectedSurahNumber) ?? props.surahs[0],
    [props.surahs, selectedSurahNumber],
  );

  const safeFrom = clamp(Math.floor(fromAyah || 1), 1, selected?.ayahCount ?? 1);
  const safeTo = clamp(Math.floor(toAyah || 1), 1, selected?.ayahCount ?? 1);
  const rangeError = safeFrom > safeTo ? "Start ayah must be less than or equal to end ayah." : null;
  const rangeEndAyahId = (selected?.startAyahId ?? 1) + (safeTo - 1);

  async function markRangeCompleted() {
    if (!selected) {
      return;
    }
    if (rangeError) {
      pushToast({
        title: "Invalid range",
        message: rangeError,
        tone: "warning",
      });
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/profile/backfill-range", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          surahNumber: selected.surahNumber,
          fromAyahNumber: safeFrom,
          toAyahNumber: safeTo,
        }),
      });

      const payload = (await res.json().catch(() => ({}))) as {
        error?: string;
        movedCursor?: boolean;
        tracking?: {
          recordedAyahCount?: number;
          alreadyTrackedAyahCount?: number;
          totalAyahCount?: number;
        };
      };

      if (!res.ok) {
        if (res.status === 503) {
          pushToast({
            title: "Database unavailable",
            message: `Could not sync Surah ${selected.surahNumber}:${safeFrom}-${safeTo}. Try again when database access is restored.`,
            tone: "warning",
          });
          return;
        }
        throw new Error(payload.error || "Failed to import progress range.");
      }

      pushToast({
        title: payload.movedCursor ? "Progress tracker updated" : "Range logged",
        message: payload.movedCursor
          ? `Tracked ${payload.tracking?.recordedAyahCount ?? 0}/${payload.tracking?.totalAyahCount ?? (safeTo - safeFrom + 1)} ayahs in Surah ${selected.surahNumber}:${safeFrom}-${safeTo}. Resume cursor also advanced.`
          : `Tracked ${payload.tracking?.recordedAyahCount ?? 0}/${payload.tracking?.totalAyahCount ?? (safeTo - safeFrom + 1)} ayahs in Surah ${selected.surahNumber}:${safeFrom}-${safeTo}. Resume cursor was already ahead.`,
        tone: "success",
      });
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update progress.";
      pushToast({
        title: "Update failed",
        message,
        tone: "warning",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Pill tone="accent">Backfill tracker</Pill>
          <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(var(--kw-accent-rgb),0.22)] bg-[rgba(var(--kw-accent-rgb),0.08)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[rgba(var(--kw-accent-rgb),1)]">
            <Import size={12} />
            External reading
          </span>
        </div>
        <p className="text-xs text-[color:var(--kw-faint)]">Useful if you recited from a physical mushaf or another app.</p>
      </div>

      <p className="mt-3 text-sm text-[color:var(--kw-muted)]">
        Mark only the exact Surah ayah range as read. Ayahs before the selected range are not auto-completed.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <label className="text-sm text-[color:var(--kw-muted)]">
          Surah
          <select
            value={selected?.surahNumber ?? 1}
            onChange={(e) => {
              const next = Number(e.target.value);
              const target = props.surahs.find((s) => s.surahNumber === next);
              setSelectedSurahNumber(next);
              setFromAyah(1);
              setToAyah(Math.min(10, target?.ayahCount ?? 1));
            }}
            className="mt-1 h-10 w-full rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 text-sm text-[color:var(--kw-ink)]"
          >
            {props.surahs.map((surah) => (
              <option key={surah.surahNumber} value={surah.surahNumber}>
                {surah.surahNumber} - {surah.nameTransliteration}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-[color:var(--kw-muted)]">
          From ayah
          <input
            type="number"
            min={1}
            max={selected?.ayahCount ?? 1}
            value={safeFrom}
            onChange={(e) => setFromAyah(Number(e.target.value))}
            className="mt-1 h-10 w-full rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 text-sm text-[color:var(--kw-ink)]"
          />
        </label>

        <label className="text-sm text-[color:var(--kw-muted)]">
          To ayah
          <input
            type="number"
            min={1}
            max={selected?.ayahCount ?? 1}
            value={safeTo}
            onChange={(e) => setToAyah(Number(e.target.value))}
            className="mt-1 h-10 w-full rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 text-sm text-[color:var(--kw-ink)]"
          />
        </label>

        <div className="flex items-end">
          <button
            type="button"
            disabled={saving || Boolean(rangeError)}
            onClick={markRangeCompleted}
            className={`h-10 w-full rounded-xl border px-4 text-sm font-semibold transition ${
              saving || rangeError
                ? "cursor-not-allowed border-[color:var(--kw-border-2)] bg-white/50 text-[color:var(--kw-faint)]"
                : "border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)] hover:bg-[rgba(var(--kw-accent-rgb),0.16)]"
            }`}
          >
            {saving ? "Updating..." : "Mark as completed"}
          </button>
        </div>
      </div>

      {rangeError ? (
        <p className="mt-3 inline-flex items-center gap-2 text-xs text-[color:var(--kw-ember-600)]">
          <CloudOff size={14} />
          {rangeError}
        </p>
      ) : (
        <p className="mt-3 inline-flex items-center gap-2 text-xs text-[color:var(--kw-faint)]">
          <CheckCircle2 size={14} />
          Range to sync: Surah {selected?.surahNumber}:{safeFrom}-{safeTo} (global end ayah #{rangeEndAyahId}).
        </p>
      )}
    </div>
  );
}
