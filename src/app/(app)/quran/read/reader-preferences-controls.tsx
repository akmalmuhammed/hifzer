"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { QURAN_TRANSLATION_OPTIONS, type QuranTranslationId } from "@/hifzer/quran/translation-prefs";

type ReaderPreferencesControlsProps = {
  initialTranslationId: QuranTranslationId;
  initialShowDetails: boolean;
  persistEnabled: boolean;
};

export function ReaderPreferencesControls(props: ReaderPreferencesControlsProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [translationId, setTranslationId] = useState<QuranTranslationId>(props.initialTranslationId);
  const [showDetails, setShowDetails] = useState(props.initialShowDetails);

  async function saveLanguage(next: QuranTranslationId) {
    const res = await fetch("/api/profile/language", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ quranTranslationId: next }),
    });
    const payload = (await res.json()) as { error?: string };
    if (!res.ok) {
      throw new Error(payload.error || "Failed to save language preference.");
    }
  }

  async function saveDetails(next: boolean) {
    const res = await fetch("/api/profile/quran-reader-prefs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ quranShowDetails: next }),
    });
    const payload = (await res.json()) as { error?: string };
    if (!res.ok) {
      throw new Error(payload.error || "Failed to save reader preferences.");
    }
  }

  const selected = QURAN_TRANSLATION_OPTIONS.find((item) => item.id === translationId);

  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <label className="text-sm text-[color:var(--kw-muted)]">
        Translation language
        <select
          value={translationId}
          disabled={isPending || !props.persistEnabled}
          onChange={(e) => {
            const next = e.target.value as QuranTranslationId;
            setTranslationId(next);
            startTransition(() => {
              void saveLanguage(next)
                .then(() => {
                  pushToast({ tone: "success", title: "Saved", message: "Translation language updated." });
                  router.refresh();
                })
                .catch((error) => {
                  setTranslationId(translationId);
                  pushToast({
                    tone: "warning",
                    title: "Save failed",
                    message: error instanceof Error ? error.message : "Failed to save language preference.",
                  });
                });
            });
          }}
          className="mt-1 h-10 w-full rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 text-sm text-[color:var(--kw-ink)]"
        >
          {QURAN_TRANSLATION_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-[color:var(--kw-faint)]">
          Active: {selected?.label ?? translationId}
        </span>
      </label>

      <div className="text-sm text-[color:var(--kw-muted)]">
        Default details
        <div className="mt-1 flex h-10 items-center justify-between rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-3">
          <span className="text-sm text-[color:var(--kw-ink)]">{showDetails ? "Visible" : "Hidden"}</span>
          <button
            type="button"
            disabled={isPending || !props.persistEnabled}
            onClick={() => {
              const next = !showDetails;
              setShowDetails(next);
              startTransition(() => {
                void saveDetails(next)
                  .then(() => {
                    pushToast({
                      tone: "success",
                      title: "Saved",
                      message: next ? "Reader details enabled." : "Reader details hidden.",
                    });
                    router.refresh();
                  })
                  .catch((error) => {
                    setShowDetails(!next);
                    pushToast({
                      tone: "warning",
                      title: "Save failed",
                      message: error instanceof Error ? error.message : "Failed to save reader preferences.",
                    });
                  });
              });
            }}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              showDetails
                ? "border-[rgba(var(--kw-accent-rgb),0.26)] bg-[rgba(var(--kw-accent-rgb),0.10)] text-[rgba(var(--kw-accent-rgb),1)]"
                : "border-[color:var(--kw-border-2)] bg-white text-[color:var(--kw-ink)]"
            }`}
          >
            {showDetails ? "Hide details" : "Show details"}
          </button>
        </div>
        <span className="mt-1 block text-xs text-[color:var(--kw-faint)]">
          Sets the default for phonetics and translation. Reader filter toggles can override this view.
        </span>
        {!props.persistEnabled ? (
          <span className="mt-1 block text-xs text-[color:var(--kw-faint)]">
            Sign in to persist reader preferences.
          </span>
        ) : null}
      </div>
    </div>
  );
}
