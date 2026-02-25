"use client";

import { createContext, useContext, useMemo, useState } from "react";
import {
  buildUiLanguageCookieValue,
  isUiLanguageRtl,
  normalizeUiLanguage,
  type UiLanguage,
  uiLanguageToHtmlLang,
} from "@/hifzer/i18n/ui-language";

type UiLanguageContextValue = {
  language: UiLanguage;
  rtl: boolean;
  setLanguage: (value: UiLanguage) => void;
};

const UiLanguageContext = createContext<UiLanguageContextValue | null>(null);

export function UiLanguageProvider(props: { initialLanguage: UiLanguage; children: React.ReactNode }) {
  const [language, setLanguageState] = useState<UiLanguage>(props.initialLanguage);

  function setLanguage(next: UiLanguage) {
    const normalized = normalizeUiLanguage(next);
    setLanguageState(normalized);
    document.cookie = buildUiLanguageCookieValue(normalized);
    document.documentElement.lang = uiLanguageToHtmlLang(normalized);
  }

  const value = useMemo<UiLanguageContextValue>(() => ({
    language,
    rtl: isUiLanguageRtl(language),
    setLanguage,
  }), [language]);

  return (
    <UiLanguageContext.Provider value={value}>
      {props.children}
    </UiLanguageContext.Provider>
  );
}

export function useUiLanguage(): UiLanguageContextValue {
  const value = useContext(UiLanguageContext);
  if (!value) {
    throw new Error("useUiLanguage must be used within UiLanguageProvider.");
  }
  return value;
}
