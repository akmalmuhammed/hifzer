import { cookies } from "next/headers";
import { AppProviders } from "@/components/providers/app-providers";
import { MarketingFooter } from "@/components/landing/marketing-footer";
import { MarketingNav } from "@/components/landing/marketing-nav";
import { PublicAuthProvider } from "@/components/landing/public-auth-context";
import { clerkEnabled } from "@/lib/clerk-config";
import { marketingDisplayFont, quranFont } from "@/lib/fonts";
import { resolveInitialThemeState, resolveInitialUiLanguage } from "@/lib/layout-preferences";
import { auth } from "@clerk/nextjs/server";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const authEnabled = clerkEnabled();
  const initialSignedIn = authEnabled ? Boolean((await auth()).userId) : false;
  const initialUiLanguage = resolveInitialUiLanguage(cookieStore);
  const initialThemeState = resolveInitialThemeState(cookieStore);

  return (
    <AppProviders
      initialUiLanguage={initialUiLanguage}
      initialDistractionFree={false}
      initialThemeState={initialThemeState}
    >
      <PublicAuthProvider authEnabled={authEnabled} initialSignedIn={initialSignedIn}>
        <div className={`min-h-dvh ${marketingDisplayFont.variable} ${quranFont.variable}`}>
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
