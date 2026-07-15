"use client";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { UiLanguageProvider } from "@/components/providers/ui-language-provider";
import type { UiLanguage } from "@/hifzer/i18n/ui-language";
import type { ThemeDocumentState } from "@/hifzer/theme/preferences";

export function MarketingProviders(props: {
  children: React.ReactNode;
  initialUiLanguage: UiLanguage;
  initialThemeState: ThemeDocumentState;
}) {
  return (
    <UiLanguageProvider initialLanguage={props.initialUiLanguage}>
      <ThemeProvider initialState={props.initialThemeState}>{props.children}</ThemeProvider>
    </UiLanguageProvider>
  );
}
