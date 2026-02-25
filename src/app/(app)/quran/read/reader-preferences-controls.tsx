"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import type { ReaderUiCopy } from "@/hifzer/quran/reader-ui-copy";
import { QURAN_TRANSLATION_OPTIONS, type QuranTranslationId } from "@/hifzer/quran/translation-prefs";

type ReaderPreferencesControlsProps = {
  initialTranslationId: QuranTranslationId;
  initialShowDetails: boolean;
  persistEnabled: boolean;
  ui: ReaderUiCopy;
};

export function ReaderPreferencesControls(props: ReaderPreferencesControlsProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [translationId, setTranslationId] = useState<QuranTranslationId>(props.initialTranslationId);
  const [showDetails, setShowDetails] = useState(props.initialShowDetails);
  const [languageWarning, setLanguageWarning] = useState<string | null>(null);

  async function saveLanguage(next: QuranTranslationId) {
    const res = await fetch("/api/profile/language", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ quranTranslationId: next }),
    });
    const payload = (await res.json()) as { error?: string };
    if (!res.ok) {
      throw new Error(payload.error || props.ui.failedSaveLanguage);
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
      throw new Error(payload.error || props.ui.failedSaveReaderPreferences);
    }
  }

  const selected = QURAN_TRANSLATION_OPTIONS.find((item) => item.id === translationId);

  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <label className="text-sm text-[color:var(--kw-muted)]">
        {props.ui.translationLanguage}
        <select
          value={translationId}
          disabled={isPending || !props.persistEnabled}
          onChange={(e) => {
            const next = e.target.value as QuranTranslationId;
            setTranslationId(next);
            startTransition(() => {
              void saveLanguage(next)
                .then(() => {
                  setLanguageWarning(null);
                  pushToast({
                    tone: "success",
                    title: props.ui.savedTitle,
                    message: props.ui.translationLanguageUpdated,
                  });
                  router.refresh();
                })
                .catch((error) => {
                  const message = error instanceof Error ? error.message : props.ui.failedSaveLanguage;
                  setLanguageWarning(message);
                  setTranslationId(translationId);
                  pushToast({
                    tone: "warning",
                    title: props.ui.saveFailedTitle,
                    message,
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
          {props.ui.active}: {selected?.label ?? translationId}
        </span>
        {languageWarning ? (
          <span className="mt-1 block rounded-xl border border-[rgba(234,88,12,0.3)] bg-[rgba(234,88,12,0.08)] px-3 py-2 text-xs leading-5 text-[color:var(--kw-muted)]">
            <span className="block font-semibold text-[rgba(234,88,12,0.95)]">
              {languageWarning.startsWith("Persistence unavailable:") ? props.ui.persistenceUnavailable : props.ui.saveIssue}
            </span>
            <span className="block">{languageWarning}</span>
          </span>
        ) : null}
      </label>

      <div className="text-sm text-[color:var(--kw-muted)]">
        {props.ui.defaultDetails}
        <div className="mt-1 flex h-10 items-center justify-between rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-3">
          <span className="text-sm text-[color:var(--kw-ink)]">{showDetails ? props.ui.visible : props.ui.hidden}</span>
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
                      title: props.ui.savedTitle,
                      message: next ? props.ui.readerDetailsEnabled : props.ui.readerDetailsHidden,
                    });
                    router.refresh();
                  })
                  .catch((error) => {
                    setShowDetails(!next);
                    pushToast({
                      tone: "warning",
                      title: props.ui.saveFailedTitle,
                      message: error instanceof Error ? error.message : props.ui.failedSaveReaderPreferences,
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
            {showDetails ? props.ui.hideDetails : props.ui.showDetails}
          </button>
        </div>
        <span className="mt-1 block text-xs text-[color:var(--kw-faint)]">
          {props.ui.defaultDetailsHint}
        </span>
        {!props.persistEnabled ? (
          <span className="mt-1 block text-xs text-[color:var(--kw-faint)]">
            {props.ui.signInToPersist}
          </span>
        ) : null}
      </div>
    </div>
  );
}
