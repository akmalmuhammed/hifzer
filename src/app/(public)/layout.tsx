import { AppProviders } from "@/components/providers/app-providers";
import { MarketingFooter } from "@/components/landing/marketing-footer";
import { MarketingNav } from "@/components/landing/marketing-nav";
import { DEFAULT_UI_LANGUAGE } from "@/hifzer/i18n/ui-language";
import { DEFAULT_THEME_DOCUMENT_STATE } from "@/hifzer/theme/preferences";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders
      initialUiLanguage={DEFAULT_UI_LANGUAGE}
      initialDistractionFree={false}
      initialThemeState={DEFAULT_THEME_DOCUMENT_STATE}
    >
      <div className="min-h-dvh">
        <MarketingNav />
        <main id="main-content" className="w-full overflow-x-hidden">
          {children}
        </main>
        <MarketingFooter />
      </div>
    </AppProviders>
  );
}
