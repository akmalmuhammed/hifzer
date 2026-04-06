"use client";

import { ToastProvider } from "@/components/ui/toast";
import { DistractionFreeProvider } from "@/components/providers/distraction-free-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { UiLanguageProvider } from "@/components/providers/ui-language-provider";
import type { UiLanguage } from "@/hifzer/i18n/ui-language";
import type { ThemeDocumentState } from "@/hifzer/theme/preferences";

export function AppProviders(props: {
  children: React.ReactNode;
  initialUiLanguage: UiLanguage;
  initialDistractionFree: boolean;
  initialThemeState: ThemeDocumentState;
}) {
  return (
    <DistractionFreeProvider initialEnabled={props.initialDistractionFree}>
      <UiLanguageProvider initialLanguage={props.initialUiLanguage}>
        <ThemeProvider initialState={props.initialThemeState}>
          <ToastProvider>
            {props.children}
          </ToastProvider>
        </ThemeProvider>
      </UiLanguageProvider>
    </DistractionFreeProvider>
  );
}
