import { AppProviders } from "@/components/providers/app-providers";
import { DEFAULT_UI_LANGUAGE } from "@/hifzer/i18n/ui-language";
import { DEFAULT_THEME_DOCUMENT_STATE } from "@/hifzer/theme/preferences";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders
      initialUiLanguage={DEFAULT_UI_LANGUAGE}
      initialDistractionFree={false}
      initialThemeState={DEFAULT_THEME_DOCUMENT_STATE}
    >
      <main id="main-content" className="mx-auto w-full max-w-[520px] px-4 py-12">
        {children}
      </main>
    </AppProviders>
  );
}
