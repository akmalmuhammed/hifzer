import { cookies } from "next/headers";
import { normalizeUiLanguage, UI_LANGUAGE_COOKIE, type UiLanguage } from "@/hifzer/i18n/ui-language";

export async function getUiLanguageServer(): Promise<UiLanguage> {
  const cookieStore = await cookies();
  return normalizeUiLanguage(cookieStore.get(UI_LANGUAGE_COOKIE)?.value);
}
