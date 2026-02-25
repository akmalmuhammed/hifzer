"use client";

import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { UiLanguageProvider } from "@/components/providers/ui-language-provider";
import type { UiLanguage } from "@/hifzer/i18n/ui-language";

export function AppProviders(props: { children: React.ReactNode; initialUiLanguage: UiLanguage }) {
  return (
    <UiLanguageProvider initialLanguage={props.initialUiLanguage}>
      <ThemeProvider>
        <ToastProvider>
          {props.children}
        </ToastProvider>
      </ThemeProvider>
    </UiLanguageProvider>
  );
}
