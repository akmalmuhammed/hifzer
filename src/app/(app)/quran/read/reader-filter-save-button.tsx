"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { ReaderUiCopy } from "@/hifzer/quran/reader-ui-copy";

type ReaderFilterSaveButtonProps = {
  formId: string;
  persistEnabled: boolean;
  ui: ReaderUiCopy;
};

function readNullableInt(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Math.floor(Number(trimmed));
  return Number.isFinite(parsed) ? parsed : null;
}

export function ReaderFilterSaveButton(props: ReaderFilterSaveButtonProps) {
  const { pushToast } = useToast();
  const [saving, setSaving] = useState(false);

  async function save() {
    const form = document.getElementById(props.formId);
    if (!(form instanceof HTMLFormElement)) {
      pushToast({
        tone: "warning",
        title: props.ui.saveFailedTitle,
        message: props.ui.failedSaveFilters ?? props.ui.failedSaveReaderPreferences,
      });
      return;
    }

    const formData = new FormData(form);
    const view = formData.get("view") === "compact" ? "compact" : "list";
    const payload = {
      view,
      surahNumber: readNullableInt(formData.get("surah")),
      ayahId: readNullableInt(formData.get("ayah")),
      showPhonetic: formData.get("phonetic") === "1",
      showTranslation: formData.get("translation") === "1",
      showTafsir: formData.get("tafsir") === "1",
      tafsirId: readNullableInt(formData.get("tafsirId")),
    };

    setSaving(true);
    try {
      const res = await fetch("/api/profile/quran-reader-filters", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const response = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(response.error || props.ui.failedSaveFilters || props.ui.failedSaveReaderPreferences);
      }

      pushToast({
        tone: "success",
        title: props.ui.savedTitle,
        message: props.ui.filtersSavedMessage ?? "Reader filters saved.",
      });
    } catch (error) {
      pushToast({
        tone: "warning",
        title: props.ui.saveFailedTitle,
        message: error instanceof Error ? error.message : props.ui.failedSaveFilters ?? props.ui.failedSaveReaderPreferences,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        type="button"
        variant="secondary"
        className="gap-2"
        disabled={!props.persistEnabled}
        loading={saving}
        onClick={() => void save()}
      >
        {props.ui.saveFiltersLabel ?? "Save filters"} <ArrowRight size={16} />
      </Button>
      {!props.persistEnabled ? (
        <span className="text-xs text-[color:var(--kw-faint)]">
          {props.ui.signInToPersist}
        </span>
      ) : props.ui.saveFiltersHint ? (
        <span className="text-xs text-[color:var(--kw-faint)]">
          {props.ui.saveFiltersHint}
        </span>
      ) : null}
    </div>
  );
}
