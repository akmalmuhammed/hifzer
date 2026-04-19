import { AppProviders } from "@/components/providers/app-providers";
import { MarketingFooter } from "@/components/landing/marketing-footer";
import { MarketingNav } from "@/components/landing/marketing-nav";
import { PublicAuthProvider } from "@/components/landing/public-auth-context";
import { DEFAULT_UI_LANGUAGE } from "@/hifzer/i18n/ui-language";
import { DEFAULT_THEME_DOCUMENT_STATE } from "@/hifzer/theme/preferences";
import { clerkEnabled } from "@/lib/clerk-config";
import {
  marketingAccentMonoFont,
  marketingDisplayFont,
  marketingEditorialFont,
  quranFont,
} from "@/lib/fonts";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const authEnabled = clerkEnabled();

  return (
    <AppProviders
      initialUiLanguage={DEFAULT_UI_LANGUAGE}
      initialDistractionFree={false}
      initialThemeState={DEFAULT_THEME_DOCUMENT_STATE}
    >
      <PublicAuthProvider authEnabled={authEnabled}>
        <div
          className={[
            "min-h-dvh",
            marketingDisplayFont.variable,
            marketingEditorialFont.variable,
            marketingAccentMonoFont.variable,
            quranFont.variable,
          ].join(" ")}
        >
          <MarketingNav />
          <main id="main-content" className="w-full overflow-x-hidden">
            {children}
          </main>
          <MarketingFooter />
        </div>
      </PublicAuthProvider>
    </AppProviders>
  );
}
