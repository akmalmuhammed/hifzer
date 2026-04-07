"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import {
  UI_LANGUAGE_COOKIE,
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
const UI_LANGUAGE_CHANGE_EVENT = "hifzer:ui-language-change";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const token = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));
  if (!token) {
    return null;
  }
  return token.slice(name.length + 1);
}

function readPersistedUiLanguage(fallback: UiLanguage): UiLanguage {
  return normalizeUiLanguage(readCookie(UI_LANGUAGE_COOKIE) ?? fallback);
}

function dispatchUiLanguageChange() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(UI_LANGUAGE_CHANGE_EVENT));
}

function subscribeUiLanguage(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }
  const handleChange = () => onStoreChange();
  window.addEventListener(UI_LANGUAGE_CHANGE_EVENT, handleChange);
  window.addEventListener("focus", handleChange);
  return () => {
    window.removeEventListener(UI_LANGUAGE_CHANGE_EVENT, handleChange);
    window.removeEventListener("focus", handleChange);
  };
}

export function UiLanguageProvider(props: { initialLanguage: UiLanguage; children: React.ReactNode }) {
  const language = useSyncExternalStore(
    subscribeUiLanguage,
    () => readPersistedUiLanguage(props.initialLanguage),
    () => props.initialLanguage,
  );

  function setLanguage(next: UiLanguage) {
    const normalized = normalizeUiLanguage(next);
    document.cookie = buildUiLanguageCookieValue(normalized);
    document.documentElement.lang = uiLanguageToHtmlLang(normalized);
    dispatchUiLanguageChange();
  }

  useEffect(() => {
    document.documentElement.lang = uiLanguageToHtmlLang(language);
  }, [language]);

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
