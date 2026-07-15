import { MarketingFooter } from "@/components/landing/marketing-footer";
import { MarketingNav } from "@/components/landing/marketing-nav";
import { MarketingProviders } from "@/components/providers/marketing-providers";
import landingStyles from "@/components/landing/landing.module.css";
import { DEFAULT_UI_LANGUAGE } from "@/hifzer/i18n/ui-language";
import { DEFAULT_THEME_DOCUMENT_STATE } from "@/hifzer/theme/preferences";
import { marketingDisplayFont, quranFont } from "@/lib/fonts";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketingProviders
      initialUiLanguage={DEFAULT_UI_LANGUAGE}
      initialThemeState={DEFAULT_THEME_DOCUMENT_STATE}
    >
      <div
        className={[
          landingStyles.marketingShell,
          "min-h-dvh",
          marketingDisplayFont.variable,
          quranFont.variable,
        ].join(" ")}
      >
        <MarketingNav />
        <main id="main-content" tabIndex={-1} className="w-full overflow-x-hidden outline-none">
          {children}
        </main>
        <MarketingFooter />
      </div>
    </MarketingProviders>
  );
}
